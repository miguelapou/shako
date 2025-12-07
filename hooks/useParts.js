import { useState } from 'react';
import * as partsService from '../services/partsService';
import * as vendorsService from '../services/vendorsService';
import { validatePartCosts } from '../utils/validationUtils';

/**
 * Custom hook for managing parts data and CRUD operations
 *
 * Features:
 * - Load parts from Supabase
 * - Add, update, and delete parts
 * - Update part status (pending/purchased/shipped/delivered)
 * - Manage tracking information
 * - Link/unlink parts to/from projects
 * - Vendor management (rename, delete vendors)
 *
 * @param {string} userId - Current user's ID for data isolation
 * @param {Object} toast - Toast notification functions { error, success, warning, info }
 * @returns {Object} Parts state and operations
 */
const useParts = (userId, toast) => {
  const [parts, setParts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorColors, setVendorColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [newPart, setNewPart] = useState({
    part: '',
    partNumber: '',
    vendor: '',
    price: '',
    shipping: '',
    duties: '',
    tracking: '',
    status: 'pending',
    projectId: null
  });

  /**
   * Load parts from Supabase
   */
  const loadParts = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await partsService.getAllParts(userId);

      if (data && data.length > 0) {
        // Convert database format to app format
        const formattedParts = data.map(part => ({
          id: part.id,
          delivered: part.delivered,
          shipped: part.shipped,
          purchased: part.purchased,
          part: part.part,
          partNumber: part.part_number || '',
          vendor: part.vendor || '',
          price: parseFloat(part.price) || 0,
          shipping: parseFloat(part.shipping) || 0,
          duties: parseFloat(part.duties) || 0,
          total: parseFloat(part.total) || 0,
          tracking: part.tracking || '',
          projectId: part.project_id || null,
          createdAt: part.created_at || null
        }));
        setParts(formattedParts);
      } else {
        setParts([]);
      }
    } catch (error) {
      toast?.error('Error loading parts from database');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load vendors from Supabase
   */
  const loadVendors = async () => {
    if (!userId) return;
    try {
      const data = await vendorsService.getAllVendors(userId);

      if (data && data.length > 0) {
        setVendors(data);
        // Convert to vendorColors object for easy lookup
        const colorsMap = {};
        data.forEach(vendor => {
          colorsMap[vendor.name] = vendor.color;
        });
        setVendorColors(colorsMap);
      }
    } catch (error) {
      // Error loading vendors - silent fail
    }
  };

  /**
   * Update vendor color in database
   */
  const updateVendorColor = async (vendorName, color) => {
    if (!userId) return;
    try {
      await vendorsService.upsertVendor(vendorName, color, userId);

      // Update local state
      setVendorColors(prev => ({
        ...prev,
        [vendorName]: color
      }));
      await loadVendors();
    } catch (error) {
      toast?.error('Error saving vendor color');
    }
  };

  /**
   * Add a new part
   */
  const addNewPart = async (setShowAddModal) => {
    if (!userId) return;

    // Validate cost fields
    const costValidation = validatePartCosts({
      price: newPart.price,
      shipping: newPart.shipping,
      duties: newPart.duties
    }, toast);

    if (!costValidation.isValid) {
      return; // Toast already shown by validatePartCosts
    }

    const { price, shipping, duties, total } = costValidation.values;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    try {
      const createdAt = new Date().toISOString();
      // Insert into database
      const data = await partsService.createPart({
        ...statusMap[newPart.status],
        part: newPart.part,
        part_number: newPart.partNumber,
        vendor: newPart.vendor,
        price,
        shipping,
        duties,
        total,
        tracking: newPart.tracking,
        project_id: newPart.projectId || null,
        created_at: createdAt
      }, userId);
      // Add to local state with the ID from database
      const partToAdd = {
        id: data.id,
        ...statusMap[newPart.status],
        part: newPart.part,
        partNumber: newPart.partNumber,
        vendor: newPart.vendor,
        price,
        shipping,
        duties,
        total,
        tracking: newPart.tracking,
        projectId: newPart.projectId || null,
        createdAt: createdAt
      };
      setParts([...parts, partToAdd]);
      if (setShowAddModal) setShowAddModal(false);
      setNewPart({
        part: '',
        partNumber: '',
        vendor: '',
        price: '',
        shipping: '',
        duties: '',
        tracking: '',
        status: 'pending',
        projectId: null
      });
    } catch (error) {
      toast?.error('Error adding part. Please try again.');
    }
  };

  /**
   * Update part status
   */
  const updatePartStatus = async (partId, newStatus, setTrackingModalPartId, setShowTrackingModal, setOpenDropdown) => {
    // If changing to shipped, show tracking modal
    if (newStatus === 'shipped') {
      if (setTrackingModalPartId) setTrackingModalPartId(partId);
      if (setShowTrackingModal) setShowTrackingModal(true);
      if (setOpenDropdown) setOpenDropdown(null);
      return;
    }
    try {
      const statusMap = {
        delivered: { delivered: true, shipped: true, purchased: true },
        purchased: { delivered: false, shipped: false, purchased: true },
        pending: { delivered: false, shipped: false, purchased: false }
      };
      const updates = statusMap[newStatus];
      // Update in database
      await partsService.updatePart(partId, updates);
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === partId) {
          return { ...part, ...updates };
        }
        return part;
      }));
      if (setOpenDropdown) setOpenDropdown(null);
    } catch (error) {
      toast?.error('Error updating part status. Please try again.');
    }
  };

  /**
   * Save tracking information
   */
  const saveTrackingInfo = async (trackingModalPartId, trackingInput, setShowTrackingModal, setTrackingModalPartId, setTrackingInput) => {
    try {
      // Update in database
      await partsService.updatePart(trackingModalPartId, {
        delivered: false,
        shipped: true,
        purchased: true,
        tracking: trackingInput
      });
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return {
            ...part,
            delivered: false,
            shipped: true,
            purchased: true,
            tracking: trackingInput
          };
        }
        return part;
      }));
      if (setShowTrackingModal) setShowTrackingModal(false);
      if (setTrackingModalPartId) setTrackingModalPartId(null);
      if (setTrackingInput) setTrackingInput('');
    } catch (error) {
      toast?.error('Error saving tracking info. Please try again.');
    }
  };

  /**
   * Skip tracking information
   */
  const skipTrackingInfo = async (trackingModalPartId, setShowTrackingModal, setTrackingModalPartId, setTrackingInput) => {
    try {
      // Update in database
      await partsService.updatePart(trackingModalPartId, {
        delivered: false,
        shipped: true,
        purchased: true
      });
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return {
            ...part,
            delivered: false,
            shipped: true,
            purchased: true
          };
        }
        return part;
      }));
      if (setShowTrackingModal) setShowTrackingModal(false);
      if (setTrackingModalPartId) setTrackingModalPartId(null);
      if (setTrackingInput) setTrackingInput('');
    } catch (error) {
      toast?.error('Error updating status. Please try again.');
    }
  };

  /**
   * Save edited part
   */
  const saveEditedPart = async (editingPart, setEditingPart, setPartModalView) => {
    // Validate cost fields
    const costValidation = validatePartCosts({
      price: editingPart.price,
      shipping: editingPart.shipping,
      duties: editingPart.duties
    }, toast);

    if (!costValidation.isValid) {
      return; // Toast already shown by validatePartCosts
    }

    const { price, shipping, duties, total } = costValidation.values;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };

    try {
      // Update in database
      await partsService.updatePart(editingPart.id, {
        ...statusMap[editingPart.status],
        part: editingPart.part,
        part_number: editingPart.partNumber,
        vendor: editingPart.vendor,
        price,
        shipping,
        duties,
        total,
        tracking: editingPart.tracking,
        project_id: editingPart.projectId || null
      });
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === editingPart.id) {
          return {
            ...part,
            ...statusMap[editingPart.status],
            part: editingPart.part,
            partNumber: editingPart.partNumber,
            vendor: editingPart.vendor,
            price,
            shipping,
            duties,
            total,
            tracking: editingPart.tracking,
            projectId: editingPart.projectId || null
          };
        }
        return part;
      }));
      if (setEditingPart) setEditingPart(null);
      if (setPartModalView) setPartModalView(null);
    } catch (error) {
      toast?.error('Error saving part. Please try again.');
    }
  };

  /**
   * Delete a part
   */
  const deletePart = async (partId) => {
    try {
      // Delete from database
      await partsService.deletePart(partId);
      // Update local state
      setParts(prevParts => prevParts.filter(part => part.id !== partId));
    } catch (error) {
      toast?.error('Error deleting part. Please try again.');
    }
  };

  /**
   * Rename a vendor
   */
  const renameVendor = async (oldName, newName, editingPart, setEditingPart, setEditingVendor) => {
    if (!userId) return;
    if (!newName || !newName.trim()) {
      toast?.warning('Vendor name cannot be empty');
      return;
    }

    try {
      // Update all parts in database
      await partsService.updatePartsVendor(oldName, newName.trim(), userId);
      // Update local state
      setParts(prevParts => prevParts.map(part =>
        part.vendor === oldName ? { ...part, vendor: newName.trim() } : part
      ));
      // Update editingPart if it has the old vendor
      if (editingPart && editingPart.vendor === oldName && setEditingPart) {
        setEditingPart({ ...editingPart, vendor: newName.trim() });
      }
      if (setEditingVendor) setEditingVendor(null);
    } catch (error) {
      toast?.error('Error renaming vendor. Please try again.');
    }
  };

  /**
   * Delete a vendor
   */
  const deleteVendor = async (vendorName, editingPart, setEditingPart) => {
    if (!userId) return;
    try {
      // Update all parts in database to have empty vendor
      await partsService.removeVendorFromParts(vendorName, userId);
      // Update local state
      setParts(prevParts => prevParts.map(part =>
        part.vendor === vendorName ? { ...part, vendor: '' } : part
      ));
      // Update editingPart if it has this vendor
      if (editingPart && editingPart.vendor === vendorName && setEditingPart) {
        setEditingPart({ ...editingPart, vendor: '' });
      }
    } catch (error) {
      toast?.error('Error deleting vendor. Please try again.');
    }
  };

  /**
   * Unlink a part from a project
   */
  const unlinkPartFromProject = async (partId) => {
    try {
      // Update in database
      await partsService.updatePart(partId, { project_id: null });
      // Update local state
      setParts(prevParts => prevParts.map(part =>
        part.id === partId ? { ...part, projectId: null } : part
      ));
    } catch (error) {
      toast?.error('Error unlinking part. Please try again.');
    }
  };

  /**
   * Update part's project
   */
  const updatePartProject = async (partId, projectId) => {
    try {
      // Update in database
      await partsService.updatePart(partId, { project_id: projectId || null });
      // Update local state
      setParts(prevParts => prevParts.map(part =>
        part.id === partId ? { ...part, projectId: projectId || null } : part
      ));
    } catch (error) {
      toast?.error('Error updating part project. Please try again.');
    }
  };

  /**
   * Update part tracking data in local state
   * Used after refreshing tracking from AfterShip API
   */
  const updatePartTrackingData = (partId, trackingData) => {
    setParts(prevParts => prevParts.map(part =>
      part.id === partId ? { ...part, ...trackingData } : part
    ));
  };

  /**
   * Get unique vendors from parts
   */
  const getUniqueVendors = () => {
    return [...new Set(parts.filter(p => p.vendor).map(p => p.vendor))].sort();
  };

  /**
   * Import multiple parts from CSV
   * Note: For bulk imports, we sanitize values silently (defaulting to 0)
   * rather than showing individual validation toasts
   */
  const importPartsFromCSV = async (partsToImport) => {
    if (!userId) return;

    const createdParts = [];

    for (const partData of partsToImport) {
      // Sanitize cost values - default to 0 for invalid/negative values
      const price = Math.max(0, parseFloat(partData.price) || 0);
      const shipping = Math.max(0, parseFloat(partData.shipping) || 0);
      const duties = Math.max(0, parseFloat(partData.duties) || 0);
      const total = price + shipping + duties;
      const statusMap = {
        delivered: { delivered: true, shipped: true, purchased: true },
        shipped: { delivered: false, shipped: true, purchased: true },
        purchased: { delivered: false, shipped: false, purchased: true },
        pending: { delivered: false, shipped: false, purchased: false }
      };
      const status = partData.status || 'pending';

      try {
        const createdAt = new Date().toISOString();
        const data = await partsService.createPart({
          ...statusMap[status],
          part: partData.part,
          part_number: partData.partNumber || '',
          vendor: partData.vendor || '',
          price,
          shipping,
          duties,
          total,
          tracking: partData.tracking || '',
          project_id: partData.projectId || null,
          created_at: createdAt
        }, userId);

        createdParts.push({
          id: data.id,
          ...statusMap[status],
          part: partData.part,
          partNumber: partData.partNumber || '',
          vendor: partData.vendor || '',
          price,
          shipping,
          duties,
          total,
          tracking: partData.tracking || '',
          projectId: partData.projectId || null,
          createdAt: createdAt
        });
      } catch (error) {
        console.error('Error importing part:', partData.part, error);
      }
    }

    if (createdParts.length > 0) {
      setParts(prevParts => [...prevParts, ...createdParts]);
    }

    return createdParts.length;
  };

  return {
    // State
    parts,
    setParts,
    vendors,
    vendorColors,
    loading,
    newPart,
    setNewPart,

    // Operations
    loadParts,
    loadVendors,
    updateVendorColor,
    addNewPart,
    updatePartStatus,
    saveTrackingInfo,
    skipTrackingInfo,
    saveEditedPart,
    deletePart,
    renameVendor,
    deleteVendor,
    unlinkPartFromProject,
    updatePartProject,
    updatePartTrackingData,
    getUniqueVendors,
    importPartsFromCSV
  };
};

export default useParts;
