import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, PackageOpen, BadgeDollarSign, TrendingUp, Truck, CheckCircle, Clock, ChevronDown, Plus, X, ExternalLink, ChevronUp, Edit2, Trash2, Moon, Sun, Wrench, GripVertical, ShoppingCart, Car, Upload, Gauge, Settings, Check, Archive, ChevronRight, Pause, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Utilities
import {
  getStatusColors,
  getPriorityColors,
  getPriorityBorderColor,
  getVendorColor,
  getVendorDisplayColor,
  hexToRgba,
  isLightColor,
  darkenColor,
  getMutedColor
} from '../utils/colorUtils';
import {
  cardBg,
  secondaryBg,
  primaryText,
  secondaryText,
  borderColor,
  hoverBg,
  inputClasses,
  selectDropdownStyle
} from '../utils/styleUtils';
import {
  calculateVehicleTotalSpent,
  calculateProjectTotal
} from '../utils/dataUtils';
import {
  getTrackingUrl,
  getCarrierName
} from '../utils/trackingUtils';

// UI Components
import ConfirmDialog from './ui/ConfirmDialog';
import PrimaryButton from './ui/PrimaryButton';
import PriceDisplay from './ui/PriceDisplay';
import VendorSelect from './ui/VendorSelect';
import ProjectDetailView from './ui/ProjectDetailView';
import ProjectEditForm from './ui/ProjectEditForm';
import LinkedPartsSection from './ui/LinkedPartsSection';

// Modal Components
import AddPartModal from './modals/AddPartModal';
import TrackingModal from './modals/TrackingModal';
import PartDetailModal from './modals/PartDetailModal';
import AddProjectModal from './modals/AddProjectModal';
import ProjectDetailModal from './modals/ProjectDetailModal';
import AddVehicleModal from './modals/AddVehicleModal';
import VehicleDetailModal from './modals/VehicleDetailModal';

// Tab Components
import PartsTab from './tabs/PartsTab';
import ProjectsTab from './tabs/ProjectsTab';
import VehiclesTab from './tabs/VehiclesTab';

// Custom Hooks
import useDarkMode from '../hooks/useDarkMode';
import useFilters from '../hooks/useFilters';
import useModals from '../hooks/useModals';
import useDragDrop from '../hooks/useDragDrop';
import useParts from '../hooks/useParts';
import useProjects from '../hooks/useProjects';
import useVehicles from '../hooks/useVehicles';

// ========================================
// MAIN SHAKO COMPONENT
// ========================================

const Shako = () => {
  // ========================================
  // CUSTOM HOOKS
  // ========================================

  // Dark mode hook
  const { darkMode, setDarkMode, darkModeInitialized, mounted } = useDarkMode();

  // Parts hook
  const {
    parts,
    setParts,
    vendors,
    vendorColors,
    loading,
    newPart,
    setNewPart,
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
    getUniqueVendors
  } = useParts();

  // Projects hook
  const {
    projects,
    setProjects,
    newProject,
    setNewProject,
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectsOrder,
    calculateProjectStatus,
    getVehicleProjects,
    getVehicleProjectCount
  } = useProjects();

  // Vehicles hook
  const {
    vehicles,
    setVehicles,
    newVehicle,
    setNewVehicle,
    vehicleImageFile,
    setVehicleImageFile,
    vehicleImagePreview,
    setVehicleImagePreview,
    uploadingImage,
    setUploadingImage,
    isDraggingImage,
    setIsDraggingImage,
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehiclesOrder,
    uploadVehicleImage,
    handleImageFileChange,
    clearImageSelection,
    handleImageDragEnter,
    handleImageDragLeave,
    handleImageDragOver,
    handleImageDrop
  } = useVehicles();

  // Filters hook
  const {
    searchTerm,
    setSearchTerm,
    deliveredFilter,
    setDeliveredFilter,
    statusFilter,
    setStatusFilter,
    vendorFilter,
    setVendorFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isSorting,
    setIsSorting,
    isStatusFiltering,
    setIsStatusFiltering,
    partsDateFilter,
    setPartsDateFilter,
    isFilteringParts,
    setIsFilteringParts,
    showDateFilterDropdown,
    setShowDateFilterDropdown,
    projectVehicleFilter,
    setProjectVehicleFilter,
    isFilteringProjects,
    setIsFilteringProjects,
    showVehicleFilterDropdown,
    setShowVehicleFilterDropdown,
    isArchiveCollapsed,
    setIsArchiveCollapsed,
    isProjectArchiveCollapsed,
    setIsProjectArchiveCollapsed,
    archiveStatesInitialized,
    openDropdown,
    setOpenDropdown
  } = useFilters();

  // Modals hook
  const {
    showAddModal,
    setShowAddModal,
    showTrackingModal,
    setShowTrackingModal,
    showPartDetailModal,
    setShowPartDetailModal,
    viewingPart,
    setViewingPart,
    partDetailView,
    setPartDetailView,
    trackingModalPartId,
    setTrackingModalPartId,
    trackingInput,
    setTrackingInput,
    editingPart,
    setEditingPart,
    originalPartData,
    setOriginalPartData,
    partModalView,
    setPartModalView,
    editingVendor,
    setEditingVendor,
    showAddProjectModal,
    setShowAddProjectModal,
    showProjectDetailModal,
    setShowProjectDetailModal,
    viewingProject,
    setViewingProject,
    originalProjectData,
    setOriginalProjectData,
    projectModalEditMode,
    setProjectModalEditMode,
    editingTodoId,
    setEditingTodoId,
    editingTodoText,
    setEditingTodoText,
    newTodoText,
    setNewTodoText,
    showAddProjectVehicleDropdown,
    setShowAddProjectVehicleDropdown,
    showAddVehicleModal,
    setShowAddVehicleModal,
    showVehicleDetailModal,
    setShowVehicleDetailModal,
    viewingVehicle,
    setViewingVehicle,
    originalVehicleData,
    setOriginalVehicleData,
    vehicleModalProjectView,
    setVehicleModalProjectView,
    vehicleModalEditMode,
    setVehicleModalEditMode,
    isModalClosing,
    setIsModalClosing,
    handleCloseModal,
    isTransitioningModals,
    savedScrollPosition,
    confirmDialog,
    setConfirmDialog
  } = useModals();

  // Drag and drop hook
  const {
    draggedProject,
    setDraggedProject,
    dragOverProject,
    setDragOverProject,
    dragOverProjectArchiveZone,
    setDragOverProjectArchiveZone,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleProjectArchiveZoneDrop,
    draggedVehicle,
    setDraggedVehicle,
    dragOverVehicle,
    setDragOverVehicle,
    dragOverArchiveZone,
    setDragOverArchiveZone,
    handleVehicleDragStart,
    handleVehicleDragOver,
    handleVehicleDragLeave,
    handleVehicleDrop,
    handleVehicleDragEnd,
    handleArchiveZoneDrop
  } = useDragDrop({
    projects,
    setProjects,
    updateProjectsOrder,
    updateProject,
    loadProjects,
    vehicles,
    setVehicles,
    updateVehiclesOrder,
    updateVehicle,
    loadVehicles,
    setConfirmDialog
  });

  // ========================================
  // LOCAL COMPONENT STATE
  // ========================================

  const [activeTab, setActiveTab] = useState('vehicles'); // 'parts', 'projects', or 'vehicles'
  const [previousTab, setPreviousTab] = useState('vehicles');

  // Refs for tab underline animation
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverTab, setHoverTab] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Refs for swipe detection on tab content
  const tabContentRef = useRef(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Refs for archive sections to enable auto-scroll
  const projectArchiveRef = useRef(null);
  const vehicleArchiveRef = useRef(null);

  // ========================================
  // WRAPPER FUNCTIONS FOR HOOKS
  // ========================================

  // Wrapper functions that provide state setters to hook functions
  const handleAddNewPart = () => addNewPart(setShowAddModal);

  const handleSaveTrackingInfo = () => saveTrackingInfo(
    trackingModalPartId,
    trackingInput,
    setShowTrackingModal,
    setTrackingModalPartId,
    setTrackingInput
  );

  const handleSkipTrackingInfo = () => skipTrackingInfo(
    trackingModalPartId,
    setShowTrackingModal,
    setTrackingModalPartId,
    setTrackingInput
  );

  const handleSaveEditedPart = () => saveEditedPart(
    editingPart,
    setEditingPart,
    setPartModalView
  );

  const handleRenameVendor = (oldName, newName) => renameVendor(
    oldName,
    newName,
    editingPart,
    setEditingPart,
    setEditingVendor
  );

  const handleDeleteVendor = (vendorName) => deleteVendor(
    vendorName,
    editingPart,
    setEditingPart
  );

  const handleUpdatePartStatus = (partId, newStatus) => updatePartStatus(
    partId,
    newStatus,
    setTrackingModalPartId,
    setShowTrackingModal,
    setOpenDropdown
  );

  // Check if there are unsaved changes in vehicle edit mode
  const hasUnsavedVehicleChanges = () => {
    if (!vehicleModalEditMode || vehicleModalEditMode !== 'vehicle' || !originalVehicleData || !viewingVehicle) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'nickname', 'name', 'year', 'license_plate', 'vin', 'insurance_policy',
      'fuel_filter', 'air_filter', 'oil_filter', 'oil_type', 'oil_capacity',
      'oil_brand', 'drain_plug', 'battery', 'color'
    ];
    for (const field of fieldsToCheck) {
      if (viewingVehicle[field] !== originalVehicleData[field]) {
        return true;
      }
    }
    // Check if a new image has been selected
    if (vehicleImageFile !== null) {
      return true;
    }
    return false;
  };

  const hasUnsavedProjectChanges = () => {
    if (!projectModalEditMode || !originalProjectData || !viewingProject) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'name', 'description', 'budget', 'priority',
      'vehicle_id'
    ];
    for (const field of fieldsToCheck) {
      if (viewingProject[field] !== originalProjectData[field]) {
        return true;
      }
    }
    return false;
  };

  // Tab change handler to track animation direction
  const handleTabChange = (newTab) => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  // ========================================
  // EFFECTS
  // ========================================

  // Load parts, projects, and vendors from Supabase on mount
  useEffect(() => {
    loadParts();
    loadProjects();
    loadVendors();
    // Don't load vehicles on initial mount, only when tab is accessed
  }, []);

  // Load vehicles when the vehicles tab is accessed
  useEffect(() => {
    if (activeTab === 'vehicles' && vehicles.length === 0) {
      loadVehicles();
    }
  }, [activeTab]);

  // Update underline position when active tab changes
  useEffect(() => {
    const updateUnderline = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setUnderlineStyle({
          left: offsetLeft,
          width: offsetWidth
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateUnderline, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Initial underline position on mount
  useEffect(() => {
    const updateUnderline = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setUnderlineStyle({
          left: offsetLeft,
          width: offsetWidth
        });
      }
    };

    // Delay to ensure refs are populated
    const timer = setTimeout(updateUnderline, 100);
    return () => clearTimeout(timer);
  }, []);

  // Swipe gesture handlers for tab navigation
  useEffect(() => {
    const minSwipeDistance = 50;
    const tabs = ['vehicles', 'projects', 'parts'];

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const element = tabContentRef.current;
      if (!element || loading) return;

      let touchStartPos = null;
      let touchEndPos = null;
      let isScrolling = false;

      const handleTouchStart = (e) => {
        touchEndPos = null;
        isScrolling = false;
        touchStartPos = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      };

      const handleTouchMove = (e) => {
        if (!touchStartPos) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        const diffX = Math.abs(currentX - touchStartPos.x);
        const diffY = Math.abs(currentY - touchStartPos.y);

        // Detect if user is scrolling vertically
        if (diffY > diffX && diffY > 10) {
          isScrolling = true;
        }

        // If horizontal movement is greater than vertical, prevent scrolling
        if (diffX > diffY && diffX > 10) {
          e.preventDefault();
        }

        touchEndPos = {
          x: currentX,
          y: currentY
        };
      };

      const handleTouchEnd = () => {
        if (!touchStartPos || !touchEndPos) return;

        // Don't trigger tab change if user was scrolling vertically
        if (isScrolling) {
          touchStartPos = null;
          touchEndPos = null;
          isScrolling = false;
          return;
        }

        const distance = touchStartPos.x - touchEndPos.x;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
          const currentIndex = tabs.indexOf(activeTab);

          if (isLeftSwipe && currentIndex < tabs.length - 1) {
            handleTabChange(tabs[currentIndex + 1]);
          } else if (isRightSwipe && currentIndex > 0) {
            handleTabChange(tabs[currentIndex - 1]);
          }
        }

        touchStartPos = null;
        touchEndPos = null;
        isScrolling = false;
      };

      // Add event listeners with passive: false to allow preventDefault
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });

      // Store cleanup function
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeTab, loading]);

  // Reset scroll position to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);


  const handleSort = (field) => {
    // Trigger animation
    setIsSorting(true);
    
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
    
    // Remove animation class after animation completes
    setTimeout(() => setIsSorting(false), 400);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 transition-transform duration-300 animate-in spin-in-180" /> 
      : <ChevronDown className="w-4 h-4 transition-transform duration-300 animate-in spin-in-180" />;
  };

  const filteredParts = useMemo(() => {
    let sorted = parts
      .filter(part => {
        const matchesSearch = part.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.vendor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'delivered' && part.delivered) ||
                             (statusFilter === 'shipped' && part.shipped && !part.delivered) ||
                             (statusFilter === 'purchased' && part.purchased && !part.shipped) ||
                             (statusFilter === 'pending' && !part.purchased);
        const matchesVendor = vendorFilter === 'all' || part.vendor === vendorFilter;
        const matchesDeliveredFilter =
          deliveredFilter === 'all' ? true :
          deliveredFilter === 'only' ? part.delivered :
          deliveredFilter === 'hide' ? !part.delivered : true;

        // Date filter logic
        let matchesDate = true;
        if (partsDateFilter !== 'all' && part.createdAt) {
          const partDate = new Date(part.createdAt);
          const now = new Date();
          const daysDiff = (now - partDate) / (1000 * 60 * 60 * 24);

          if (partsDateFilter === '1week' && daysDiff > 7) {
            matchesDate = false;
          } else if (partsDateFilter === '2weeks' && daysDiff > 14) {
            matchesDate = false;
          } else if (partsDateFilter === '1month' && daysDiff > 30) {
            matchesDate = false;
          }
        }

        return matchesSearch && matchesStatus && matchesVendor && matchesDeliveredFilter && matchesDate;
      })
      .sort((a, b) => {
        let aVal, bVal;
        // Special handling for status sorting
        if (sortBy === 'status') {
          // Assign numeric values: pending=0, purchased=1, shipped=2, delivered=3
          aVal = a.delivered ? 3 : (a.shipped ? 2 : (a.purchased ? 1 : 0));
          bVal = b.delivered ? 3 : (b.shipped ? 2 : (b.purchased ? 1 : 0));
        } else if (sortBy === 'project') {
          // Sort by project name
          const aProject = projects.find(p => p.id === a.projectId);
          const bProject = projects.find(p => p.id === b.projectId);
          aVal = (aProject?.name || '').toLowerCase();
          bVal = (bProject?.name || '').toLowerCase();
          // Sort empty values to the end
          if (!aVal && bVal) return 1;
          if (aVal && !bVal) return -1;
        } else if (sortBy === 'vehicle') {
          // Sort by vehicle name (via project)
          const aProject = projects.find(p => p.id === a.projectId);
          const bProject = projects.find(p => p.id === b.projectId);
          const aVehicle = aProject?.vehicle_id ? vehicles.find(v => v.id === aProject.vehicle_id) : null;
          const bVehicle = bProject?.vehicle_id ? vehicles.find(v => v.id === bProject.vehicle_id) : null;
          aVal = (aVehicle?.nickname || aVehicle?.name || '').toLowerCase();
          bVal = (bVehicle?.nickname || bVehicle?.name || '').toLowerCase();
          // Sort empty values to the end
          if (!aVal && bVal) return 1;
          if (aVal && !bVal) return -1;
        } else {
          aVal = a[sortBy];
          bVal = b[sortBy];
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
        }
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    return sorted;
  }, [parts, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder, projects, vehicles, deliveredFilter, partsDateFilter]);

  // Get unique vendors from existing parts for the dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = parts
      .map(p => p.vendor)
      .filter(v => v && v.trim() !== '')
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique values
      .sort();
    return vendors;
  }, [parts]);

  const stats = useMemo(() => {
    // Filter out pending items (items where purchased is false) for cost calculations
    const purchasedParts = parts.filter(p => p.purchased);
    return {
      total: parts.length,
      delivered: parts.filter(p => p.delivered).length,
      shipped: parts.filter(p => p.shipped && !p.delivered).length,
      purchased: parts.filter(p => p.purchased && !p.shipped).length,
      pending: parts.filter(p => !p.purchased).length,
      totalCost: purchasedParts.reduce((sum, p) => sum + p.total, 0),
      totalPrice: purchasedParts.reduce((sum, p) => sum + p.price, 0),
      totalShipping: purchasedParts.reduce((sum, p) => sum + p.shipping, 0),
      totalDuties: purchasedParts.reduce((sum, p) => sum + p.duties, 0),
    };
  }, [parts]);

  const getStatusIcon = (part) => {
    if (part.delivered) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (part.shipped) return <Truck className="w-4 h-4 text-blue-600" />;
    if (part.purchased) return <ShoppingCart className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (part) => {
    if (part.delivered) return 'Delivered';
    if (part.shipped) return 'Shipped';
    if (part.purchased) return 'Ordered';
    return 'Pending';
  };

  const getStatusColor = (part) => {
    if (part.delivered) {
      return darkMode 
        ? 'bg-green-900/20 text-green-400 border-green-700/50' 
        : 'bg-green-50 text-green-700 border-green-200';
    }
    if (part.shipped) {
      return darkMode 
        ? 'bg-blue-900/20 text-blue-400 border-blue-700/50' 
        : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (part.purchased) {
      return darkMode 
        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    return darkMode 
      ? 'bg-gray-700 text-gray-400 border-gray-600' 
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusTextColor = (part) => {
    if (part.delivered) {
      return darkMode ? 'text-green-400' : 'text-green-700';
    }
    if (part.shipped) {
      return darkMode ? 'text-blue-400' : 'text-blue-700';
    }
    if (part.purchased) {
      return darkMode ? 'text-yellow-400' : 'text-yellow-700';
    }
    return darkMode ? 'text-gray-400' : 'text-gray-700';
  };

  const getTrackingUrl = (tracking) => {
    if (!tracking) return null;
    // If it's already a full URL, return it
    if (tracking.startsWith('http')) {
      return tracking;
    }
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return `https://www.orangeconnex.com/tracking?language=en&trackingnumber=${tracking}`;
    }
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return `https://www.ecmsglobal.com/en-us/tracking.html?orderNumber=${tracking}`;
    }
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return `https://www.ups.com/track?tracknum=${tracking}&loc=en_US&requester=ST/trackdetails`;
    }
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    }
    // Check if it's a USPS tracking number (20-22 digits or specific patterns)
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    }
    // Check if it's a DHL tracking number (10-11 digits)
    if (/^\d{10,11}$/.test(tracking)) {
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`;
    }
    // For generic text like "Local", "USPS", "FedEx" without tracking number
    return null;
  };

  const getCarrierName = (tracking) => {
    if (!tracking) return null;
    // Check if it's an Amazon URL or tracking
    if (tracking.toLowerCase().includes('amazon.com') || tracking.toLowerCase().includes('amzn')) {
      return 'Amazon';
    }
    // Check if it's a FedEx URL
    if (tracking.toLowerCase().includes('fedex.com')) {
      return 'FedEx';
    }
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return 'Orange Connex';
    }
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return 'ECMS';
    }
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return 'UPS';
    }
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return 'FedEx';
    }
    // Check if it's a USPS tracking number
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return 'USPS';
    }
    // Check if it's a DHL tracking number
    if (/^\d{10,11}$/.test(tracking)) {
      return 'DHL';
    }
    // For text like "Local", "USPS", "FedEx", "ECMS" etc.
    const upper = tracking.toUpperCase();
    if (upper.includes('UPS')) return 'UPS';
    if (upper.includes('FEDEX')) return 'FedEx';
    if (upper.includes('USPS')) return 'USPS';
    if (upper.includes('DHL')) return 'DHL';
    if (upper.includes('ECMS')) return 'ECMS';
    if (upper.includes('LOCAL')) return 'Local';
    return tracking; // Return as-is if unknown
  };

  // Don't render main content until mounted on client to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-6 transition-colors duration-200 ${
      darkMode
        ? 'bg-gray-900 dark-scrollbar'
        : 'bg-slate-200'
    }`}>
      <style>{`
        /* Reserve scrollbar space to prevent layout shift */
        html {
          scrollbar-gutter: stable;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .vehicle-dropdown-scroll::-webkit-scrollbar {
          display: none;
        }
        .vehicle-dropdown-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        /* Disable hover and scale effects on touch devices */
        @media (hover: none), (pointer: coarse) {
          * {
            /* Disable all scale transforms on touch devices */
          }
          [class*="hover:scale"],
          [class*="hover:shadow"] {
            transition: none !important;
          }
          [class*="hover:scale"]:hover,
          [class*="hover:scale"]:active {
            transform: none !important;
          }
          .hover\:scale-\[1\.02\]:hover,
          .hover\:scale-\[1\.03\]:hover,
          .hover\:scale-\[1\.02\]:active,
          .hover\:scale-\[1\.03\]:active,
          .hover\:scale-\[1\.02\],
          .hover\:scale-\[1\.03\] {
            transform: none !important;
          }
          .hover\:shadow-lg:hover,
          .hover\:shadow-xl:hover,
          .hover\:shadow-2xl:hover {
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
          }
        }

        /* Custom 800px breakpoint */
        .hidden-below-800 {
          display: none;
        }
        @media (min-width: 800px) {
          .hidden-below-800 {
            display: block;
          }
          .flex-below-800 {
            display: flex;
          }
          .grid-below-800 {
            display: grid;
          }
        }
        .show-below-800 {
          display: block;
        }
        .show-below-800.grid {
          display: grid;
        }
        @media (min-width: 800px) {
          .show-below-800,
          .show-below-800.grid {
            display: none;
          }
        }

        /* Round bottom corners of parts table */
        .parts-table-footer {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }

        /* Round bottom corners of last table row cells */
        table tbody tr:last-child td:first-child {
          border-bottom-left-radius: 0.5rem;
        }
        table tbody tr:last-child td:last-child {
          border-bottom-right-radius: 0.5rem;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 sm:mb-4 min-h-[52px] sm:min-h-[60px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Shako" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Shako</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
              {/* Vehicle Filter - Only visible on Projects tab */}
              {activeTab === 'projects' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVehicleFilterDropdown(!showVehicleFilterDropdown);
                    }}
                    className={`px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-100'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                    style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
                  >
                    <div className="flex items-center gap-2">
                      {projectVehicleFilter !== 'all' && (() => {
                        const selectedVehicle = vehicles.find(v => String(v.id) === String(projectVehicleFilter));
                        return selectedVehicle ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ 
                                backgroundColor: selectedVehicle.color || '#3B82F6',
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                              }}
                            />
                            <span className="hidden sm:inline">{selectedVehicle.nickname || selectedVehicle.name}</span>
                          </>
                        ) : null;
                      })()}
                      {projectVehicleFilter === 'all' && <span>All</span>}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showVehicleFilterDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowVehicleFilterDropdown(false)}
                      />
                      <div className={`absolute right-0 z-20 mt-1 min-w-[200px] w-max rounded-lg border shadow-lg py-1 ${
                        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-300'
                      }`} style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
                        <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-tight border-b whitespace-nowrap ${
                          darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-slate-200'
                        }`}>
                          Filter by Vehicle
                        </div>
                        <button
                          onClick={() => {
                            setIsFilteringProjects(true);
                            setProjectVehicleFilter('all');
                            setShowVehicleFilterDropdown(false);
                            setTimeout(() => setIsFilteringProjects(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                            projectVehicleFilter === 'all'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          All
                        </button>
                        {vehicles.filter(vehicle => !vehicle.archived).map(vehicle => (
                          <button
                            key={vehicle.id}
                            onClick={() => {
                              setIsFilteringProjects(true);
                              setProjectVehicleFilter(String(vehicle.id));
                              setShowVehicleFilterDropdown(false);
                              setTimeout(() => setIsFilteringProjects(false), 500);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                              String(projectVehicleFilter) === String(vehicle.id)
                                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div 
                              className="w-3 h-3 rounded-full border flex-shrink-0"
                              style={{ 
                                backgroundColor: vehicle.color || '#3B82F6',
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                              }}
                            />
                            <span className="truncate">
                              {vehicle.nickname ? `${vehicle.nickname} (${vehicle.name})` : vehicle.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Date Filter - Only visible on Parts tab */}
              {activeTab === 'parts' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDateFilterDropdown(!showDateFilterDropdown);
                    }}
                    className={`px-3 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-gray-100'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                    style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
                  >
                    <span>
                      {partsDateFilter === 'all' && 'All'}
                      {partsDateFilter === '1week' && <><span className="hidden sm:inline">1 week</span><span className="sm:hidden">1w</span></>}
                      {partsDateFilter === '2weeks' && <><span className="hidden sm:inline">2 weeks</span><span className="sm:hidden">2w</span></>}
                      {partsDateFilter === '1month' && <><span className="hidden sm:inline">1 month</span><span className="sm:hidden">1m</span></>}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showDateFilterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDateFilterDropdown(false)}
                      />
                      <div className={`absolute right-0 z-20 mt-1 w-auto rounded-lg border shadow-lg py-1 ${
                        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-300'
                      }`} style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
                        <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-tight border-b whitespace-nowrap ${
                          darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-slate-200'
                        }`}>
                          Filter by age
                        </div>
                        <button
                          onClick={() => {
                            setIsFilteringParts(true);
                            setPartsDateFilter('all');
                            setShowDateFilterDropdown(false);
                            setTimeout(() => setIsFilteringParts(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            partsDateFilter === 'all'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => {
                            setIsFilteringParts(true);
                            setPartsDateFilter('1week');
                            setShowDateFilterDropdown(false);
                            setTimeout(() => setIsFilteringParts(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            partsDateFilter === '1week'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          1 week
                        </button>
                        <button
                          onClick={() => {
                            setIsFilteringParts(true);
                            setPartsDateFilter('2weeks');
                            setShowDateFilterDropdown(false);
                            setTimeout(() => setIsFilteringParts(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            partsDateFilter === '2weeks'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          2 weeks
                        </button>
                        <button
                          onClick={() => {
                            setIsFilteringParts(true);
                            setPartsDateFilter('1month');
                            setShowDateFilterDropdown(false);
                            setTimeout(() => setIsFilteringParts(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm ${
                            partsDateFilter === '1month'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          1 month
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors ${
                  activeTab !== 'vehicles' ? 'hidden' : ''
                } ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'parts') setShowAddModal(true);
                  else if (activeTab === 'projects') setShowAddProjectModal(true);
                  else if (activeTab === 'vehicles') setShowAddVehicleModal(true);
                }}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors bg-blue-600 hover:bg-blue-700 text-white ${
                  darkMode ? '' : ''
                }`}
                title="Add New"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-slate-300'
        }`}>
          <div className="flex relative">
            <button
              ref={(el) => (tabRefs.current['vehicles'] = el)}
              onClick={() => handleTabChange('vehicles')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('vehicles')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'vehicles'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-sm sm:text-base">Vehicles</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['projects'] = el)}
              onClick={() => handleTabChange('projects')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('projects')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'projects'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="text-sm sm:text-base">Projects</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['parts'] = el)}
              onClick={() => handleTabChange('parts')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('parts')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'parts'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              {activeTab === 'parts' ? <PackageOpen className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              <span className="text-sm sm:text-base">Parts</span>
            </button>
            {/* Animated hover background */}
            {hoverTab && tabRefs.current[hoverTab] && (
              <div
                className={`absolute top-0 bottom-1 rounded-lg transition-all duration-300 ease-out ${
                  darkMode ? 'bg-gray-700/50' : 'bg-slate-200/50'
                }`}
                style={{
                  left: `${tabRefs.current[hoverTab].offsetLeft}px`,
                  width: `${tabRefs.current[hoverTab].offsetWidth}px`
                }}
              />
            )}
            {/* Animated underline */}
            <div
              className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out z-10 ${
                darkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              style={{
                left: `${underlineStyle.left}px`,
                width: `${underlineStyle.width}px`
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="garage-spinner mx-auto mb-4">
                <div className="door-segment"></div>
                <div className="door-segment"></div>
                <div className="door-segment"></div>
                <div className="door-segment"></div>
              </div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Opening your garage...</p>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Add New Part Modal */}
        <AddPartModal
          isOpen={showAddModal}
          darkMode={darkMode}
          newPart={newPart}
          setNewPart={setNewPart}
          projects={projects}
          uniqueVendors={uniqueVendors}
          isModalClosing={isModalClosing}
          handleCloseModal={handleCloseModal}
          addNewPart={handleAddNewPart}
          onClose={() => setShowAddModal(false)}
        />

        {/* Tracking Info Modal */}
        <TrackingModal
          isOpen={showTrackingModal}
          darkMode={darkMode}
          trackingInput={trackingInput}
          setTrackingInput={setTrackingInput}
          skipTrackingInfo={handleSkipTrackingInfo}
          saveTrackingInfo={handleSaveTrackingInfo}
          onClose={() => {
            setShowTrackingModal(false);
            setTrackingModalPartId(null);
            setTrackingInput('');
          }}
        />

        {/* Part Detail Modal */}
        <PartDetailModal
          isOpen={showPartDetailModal}
          darkMode={darkMode}
          viewingPart={viewingPart}
          editingPart={editingPart}
          partDetailView={partDetailView}
          setPartDetailView={setPartDetailView}
          setEditingPart={setEditingPart}
          setOriginalPartData={setOriginalPartData}
          projects={projects}
          vehicles={vehicles}
          parts={parts}
          uniqueVendors={uniqueVendors}
          vendorColors={vendorColors}
          editingVendor={editingVendor}
          setEditingVendor={setEditingVendor}
          isModalClosing={isModalClosing}
          handleCloseModal={handleCloseModal}
          saveEditedPart={handleSaveEditedPart}
          deletePart={deletePart}
          updateVendorColor={updateVendorColor}
          renameVendor={handleRenameVendor}
          deleteVendor={handleDeleteVendor}
          confirmDialog={confirmDialog}
          setConfirmDialog={setConfirmDialog}
          setShowPartDetailModal={setShowPartDetailModal}
          setViewingPart={setViewingPart}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getStatusText={getStatusText}
        />

        {/* PARTS TAB CONTENT */}
        {activeTab === 'parts' && (
          <PartsTab
            tabContentRef={tabContentRef}
            stats={stats}
            filteredParts={filteredParts}
            darkMode={darkMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            deliveredFilter={deliveredFilter}
            setDeliveredFilter={setDeliveredFilter}
            vendorFilter={vendorFilter}
            setVendorFilter={setVendorFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            isSorting={isSorting}
            setIsSorting={setIsSorting}
            isStatusFiltering={isStatusFiltering}
            setIsStatusFiltering={setIsStatusFiltering}
            isFilteringParts={isFilteringParts}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            projects={projects}
            vehicles={vehicles}
            vendorColors={vendorColors}
            setShowAddModal={setShowAddModal}
            setShowPartDetailModal={setShowPartDetailModal}
            setViewingPart={setViewingPart}
            updatePartStatus={handleUpdatePartStatus}
            updatePartProject={updatePartProject}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
            getStatusIcon={getStatusIcon}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
            getVendorColor={getVendorColor}
          />
        )}

        {/* PROJECTS TAB CONTENT */}
        {activeTab === 'projects' && (
          <ProjectsTab
            tabContentRef={tabContentRef}
            previousTab={previousTab}
            projects={projects}
            parts={parts}
            vehicles={vehicles}
            darkMode={darkMode}
            projectVehicleFilter={projectVehicleFilter}
            setProjectVehicleFilter={setProjectVehicleFilter}
            isFilteringProjects={isFilteringProjects}
            showVehicleFilterDropdown={showVehicleFilterDropdown}
            setShowVehicleFilterDropdown={setShowVehicleFilterDropdown}
            isProjectArchiveCollapsed={isProjectArchiveCollapsed}
            setIsProjectArchiveCollapsed={setIsProjectArchiveCollapsed}
            projectArchiveRef={projectArchiveRef}
            draggedProject={draggedProject}
            setDraggedProject={setDraggedProject}
            dragOverProject={dragOverProject}
            setDragOverProject={setDragOverProject}
            dragOverProjectArchiveZone={dragOverProjectArchiveZone}
            setDragOverProjectArchiveZone={setDragOverProjectArchiveZone}
            showAddProjectModal={showAddProjectModal}
            setShowAddProjectModal={setShowAddProjectModal}
            showProjectDetailModal={showProjectDetailModal}
            setShowProjectDetailModal={setShowProjectDetailModal}
            viewingProject={viewingProject}
            setViewingProject={setViewingProject}
            setProjectModalEditMode={setProjectModalEditMode}
            newProject={newProject}
            setNewProject={setNewProject}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            handleProjectArchiveZoneDrop={handleProjectArchiveZoneDrop}
            calculateProjectStatus={calculateProjectStatus}
            updateProject={updateProject}
            deleteProject={deleteProject}
            unlinkPartFromProject={unlinkPartFromProject}
            loadProjects={loadProjects}
            getStatusColors={getStatusColors}
            getPriorityColors={getPriorityColors}
            getStatusText={getStatusText}
            getStatusTextColor={getStatusTextColor}
            getVendorColor={getVendorColor}
            calculateProjectTotal={calculateProjectTotal}
            isModalClosing={isModalClosing}
            handleCloseModal={handleCloseModal}
            hasUnsavedProjectChanges={hasUnsavedProjectChanges}
            setConfirmDialog={setConfirmDialog}
            projectModalEditMode={projectModalEditMode}
            setProjectModalEditMode={setProjectModalEditMode}
            originalProjectData={originalProjectData}
            setOriginalProjectData={setOriginalProjectData}
            editingTodoId={editingTodoId}
            setEditingTodoId={setEditingTodoId}
            editingTodoText={editingTodoText}
            setEditingTodoText={setEditingTodoText}
            newTodoText={newTodoText}
            setNewTodoText={setNewTodoText}
            vendorColors={vendorColors}
          />
        )}

        {/* VEHICLES TAB CONTENT */}
        {activeTab === 'vehicles' && (
          <VehiclesTab
            tabContentRef={tabContentRef}
            vehicles={vehicles}
            projects={projects}
            parts={parts}
            darkMode={darkMode}
            draggedVehicle={draggedVehicle}
            setDraggedVehicle={setDraggedVehicle}
            dragOverVehicle={dragOverVehicle}
            setDragOverVehicle={setDragOverVehicle}
            dragOverArchiveZone={dragOverArchiveZone}
            setDragOverArchiveZone={setDragOverArchiveZone}
            isArchiveCollapsed={isArchiveCollapsed}
            setIsArchiveCollapsed={setIsArchiveCollapsed}
            archiveRef={vehicleArchiveRef}
            setShowAddVehicleModal={setShowAddVehicleModal}
            setShowVehicleDetailModal={setShowVehicleDetailModal}
            setViewingVehicle={setViewingVehicle}
            setVehicleModalEditMode={setVehicleModalEditMode}
            handleVehicleDragStart={handleVehicleDragStart}
            handleVehicleDragOver={handleVehicleDragOver}
            handleVehicleDragLeave={handleVehicleDragLeave}
            handleVehicleDrop={handleVehicleDrop}
            handleVehicleDragEnd={handleVehicleDragEnd}
            handleArchiveZoneDrop={handleArchiveZoneDrop}
            getVehicleProjects={getVehicleProjects}
            showAddVehicleModal={showAddVehicleModal}
            newVehicle={newVehicle}
            setNewVehicle={setNewVehicle}
            vehicleImagePreview={vehicleImagePreview}
            setVehicleImagePreview={setVehicleImagePreview}
            vehicleImageFile={vehicleImageFile}
            setVehicleImageFile={setVehicleImageFile}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
            isDraggingImage={isDraggingImage}
            setIsDraggingImage={setIsDraggingImage}
            isModalClosing={isModalClosing}
            handleCloseModal={handleCloseModal}
            addVehicle={addVehicle}
            uploadVehicleImage={uploadVehicleImage}
            handleImageFileChange={handleImageFileChange}
            handleImageDragEnter={handleImageDragEnter}
            handleImageDragLeave={handleImageDragLeave}
            handleImageDragOver={handleImageDragOver}
            handleImageDrop={handleImageDrop}
            clearImageSelection={clearImageSelection}
            showVehicleDetailModal={showVehicleDetailModal}
            viewingVehicle={viewingVehicle}
            vehicleModalEditMode={vehicleModalEditMode}
            vehicleModalProjectView={vehicleModalProjectView}
            setVehicleModalProjectView={setVehicleModalProjectView}
            originalVehicleData={originalVehicleData}
            setOriginalVehicleData={setOriginalVehicleData}
            updateVehicle={updateVehicle}
            deleteVehicle={deleteVehicle}
            loadVehicles={loadVehicles}
            getStatusColors={getStatusColors}
            getPriorityColors={getPriorityColors}
            getStatusText={getStatusText}
            getStatusTextColor={getStatusTextColor}
            getVendorColor={getVendorColor}
            calculateProjectTotal={calculateProjectTotal}
            hasUnsavedVehicleChanges={hasUnsavedVehicleChanges}
            setConfirmDialog={setConfirmDialog}
            editingTodoId={editingTodoId}
            setEditingTodoId={setEditingTodoId}
            editingTodoText={editingTodoText}
            setEditingTodoText={setEditingTodoText}
            newTodoText={newTodoText}
            setNewTodoText={setNewTodoText}
            vendorColors={vendorColors}
            unlinkPartFromProject={unlinkPartFromProject}
            loadProjects={loadProjects}
          />
        )}

        </>
        )}
      </div>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDangerous={confirmDialog.isDangerous !== false}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Shako;
