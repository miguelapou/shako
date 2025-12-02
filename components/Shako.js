import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, BadgeDollarSign, TrendingUp, Truck, CheckCircle, Clock, ChevronDown, Plus, X, ExternalLink, ChevronUp, Edit2, Trash2, Moon, Sun, Wrench, GripVertical, ShoppingCart, Car, Upload, Gauge, Settings, Check, Archive, ChevronRight, Pause, Play } from 'lucide-react';
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

// ========================================
// MAIN SHAKO COMPONENT
// ========================================

const Shako = () => {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'parts', 'projects', or 'vehicles'
  const [vendorColors, setVendorColors] = useState({});
  const [previousTab, setPreviousTab] = useState('vehicles');
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [draggedVehicle, setDraggedVehicle] = useState(null);
  const [dragOverVehicle, setDragOverVehicle] = useState(null);
  const [dragOverArchiveZone, setDragOverArchiveZone] = useState(false);
  const [dragOverProjectArchiveZone, setDragOverProjectArchiveZone] = useState(false);

  // Track if we're transitioning between modals to prevent scroll jumping
  const isTransitioningModals = useRef(false);
  const savedScrollPosition = useRef(0);

  // Refs for tab underline animation
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverTab, setHoverTab] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Refs for swipe detection on tab content
  const tabContentRef = useRef(null);

  // Swipe detection state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Vehicle modal states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [originalVehicleData, setOriginalVehicleData] = useState(null); // Track original data for unsaved changes detection
  const [vehicleModalProjectView, setVehicleModalProjectView] = useState(null); // Track if viewing project within vehicle modal
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(null); // 'vehicle' or 'project' - track if editing within modal
  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    name: '',
    make: '',
    year: '',
    license_plate: '',
    vin: '',
    insurance_policy: '',
    fuel_filter: '',
    air_filter: '',
    oil_filter: '',
    oil_type: '',
    oil_capacity: '',
    oil_brand: '',
    drain_plug: '',
    battery: '',
    image_url: '',
    color: '#3B82F6' // Default blue color
  });
  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Confirmation dialog state for main component
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Filter and sort states
  const [projectVehicleFilter, setProjectVehicleFilter] = useState('all'); // 'all' or vehicle ID
  const [isFilteringProjects, setIsFilteringProjects] = useState(false);
  const [showVehicleFilterDropdown, setShowVehicleFilterDropdown] = useState(false);
  const [partsDateFilter, setPartsDateFilter] = useState('all'); // 'all', '1week', '2weeks', '1month'
  const [isFilteringParts, setIsFilteringParts] = useState(false);
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);
  const [isArchiveCollapsed, setIsArchiveCollapsed] = useState(true);
  const [isProjectArchiveCollapsed, setIsProjectArchiveCollapsed] = useState(true);
  const [archiveStatesInitialized, setArchiveStatesInitialized] = useState(false);

  // Refs for archive sections to enable auto-scroll
  const projectArchiveRef = useRef(null);
  const vehicleArchiveRef = useRef(null);

  // Initialize archive collapsed states from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedArchiveCollapsed = localStorage.getItem('archiveCollapsed');
      if (savedArchiveCollapsed !== null) {
        setIsArchiveCollapsed(JSON.parse(savedArchiveCollapsed));
      }

      const savedProjectArchiveCollapsed = localStorage.getItem('projectArchiveCollapsed');
      if (savedProjectArchiveCollapsed !== null) {
        setIsProjectArchiveCollapsed(JSON.parse(savedProjectArchiveCollapsed));
      }

      setArchiveStatesInitialized(true);
    }
  }, []);

  // Save archive collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('archiveCollapsed', JSON.stringify(isArchiveCollapsed));
    }
  }, [isArchiveCollapsed, archiveStatesInitialized]);

  // Save project archive collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('projectArchiveCollapsed', JSON.stringify(isProjectArchiveCollapsed));
    }
  }, [isProjectArchiveCollapsed, archiveStatesInitialized]);

  // Initialize parts date filter from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPartsDateFilter = localStorage.getItem('partsDateFilter');
      if (savedPartsDateFilter !== null) {
        setPartsDateFilter(savedPartsDateFilter);
      }
    }
  }, []);

  // Save parts date filter to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('partsDateFilter', partsDateFilter);
    }
  }, [partsDateFilter, archiveStatesInitialized]);

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

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

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
      }
    } catch (error) {
      alert('Error loading parts from database');
    } finally {
      setLoading(false);
    }
  };

  // Load projects from Supabase
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (error) {
      // Error loading projects
    }
  };

  // Load vendors from Supabase
  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

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
      // Error loading vendors
    }
  };

  // Update vendor color in database
  const updateVendorColor = async (vendorName, color) => {
    try {
      // Use upsert to insert or update in one operation
      const { error } = await supabase
        .from('vendors')
        .upsert(
          { name: vendorName, color },
          { onConflict: 'name' }
        );

      if (error) throw error;

      // Update local state
      setVendorColors(prev => ({
        ...prev,
        [vendorName]: color
      }));
      await loadVendors();
    } catch (error) {
      alert('Error saving vendor color');
    }
  };

  const addProject = async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description,
          status: projectData.status || 'planning',
          budget: parseFloat(projectData.budget) || 0,
          spent: 0,
          priority: projectData.priority || 'medium',
          vehicle_id: projectData.vehicle_id || null,
          todos: []
        }])
        .select();

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      alert('Error adding project');
    }
  };

  // Helper function to calculate project status based on todos
  const calculateProjectStatus = (todos, currentStatus) => {
    // If status is manually set to "on_hold", keep it
    if (currentStatus === 'on_hold') return 'on_hold';
    if (!todos || todos.length === 0) {
      return 'planning';
    }
    const completedCount = todos.filter(todo => todo.completed).length;
    if (completedCount === 0) {
      return 'planning';
    } else if (completedCount === todos.length) {
      return 'completed';
    } else {
      return 'in_progress';
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      // Auto-calculate status based on todos unless it's being set to on_hold
      if (updates.todos && updates.status !== 'on_hold') {
        updates.status = calculateProjectStatus(updates.todos, updates.status);
      }
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      alert('Error updating project');
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      alert('Error deleting project');
    }
  };

  // Vehicle CRUD functions
  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      if (data) {
        // Sort so archived vehicles are always at the end
        const sorted = data.sort((a, b) => {
          if (a.archived === b.archived) {
            // If both have same archived status, sort by display_order
            return (a.display_order || 0) - (b.display_order || 0);
          }
          // Put archived vehicles at the end
          return a.archived ? 1 : -1;
        });
        setVehicles(sorted);
      }
    } catch (error) {
      // Error loading vehicles
    }
  };

  const addVehicle = async (vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();

      if (error) throw error;
      await loadVehicles();
    } catch (error) {
      alert('Error adding vehicle');
    }
  };

  const updateVehicle = async (vehicleId, updates) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId);

      if (error) throw error;
      await loadVehicles();
    } catch (error) {
      alert('Error updating vehicle');
    }
  };

  const deleteVehicle = async (vehicleId) => {
    const projectsForVehicle = projects.filter(p => p.vehicle_id === vehicleId);
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      await loadVehicles();
      await loadProjects(); // Reload projects to update vehicle_id references
    } catch (error) {
      alert('Error deleting vehicle');
    }
  };

  // Helper functions for vehicle-project relationships
  const getVehicleProjects = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId);
  };

  const getVehicleProjectCount = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId).length;
  };

  // Handle modal closing with exit animation
  const handleCloseModal = (closeCallback) => {
    setIsModalClosing(true);
    setTimeout(() => {
      closeCallback();
      setIsModalClosing(false);
    }, 200); // Duration matches the exit animation
  };

  const uploadVehicleImage = async (file) => {
    try {
      setUploadingImage(true);
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);

      setUploadingImage(false);
      return publicUrl;
    } catch (error) {
      setUploadingImage(false);
      alert('Error uploading image. Please try again.');
      return null;
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setVehicleImageFile(null);
    setVehicleImagePreview(null);
  };

  // Image drag and drop handlers
  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers for projects
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, project) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedProject && draggedProject.id !== project.id) {
      setDragOverProject(project);
    }
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = (e, targetProject) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.id === targetProject.id) {
      setDraggedProject(null);
      setDragOverProject(null);
      return;
    }

    const draggedIndex = projects.findIndex(p => p.id === draggedProject.id);
    const targetIndex = projects.findIndex(p => p.id === targetProject.id);

    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    setProjects(newProjects);
    setDraggedProject(null);
    setDragOverProject(null);

    // Update display_order in database
    updateProjectsOrder(newProjects);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
  };

  // Drag and drop handlers for vehicles
  const handleVehicleDragStart = (e, vehicle) => {
    setDraggedVehicle(vehicle);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVehicleDragOver = (e, vehicle) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedVehicle && draggedVehicle.id !== vehicle.id && dragOverVehicle?.id !== vehicle.id) {
      setDragOverVehicle(vehicle);
    }
  };

  const handleVehicleDragLeave = () => {
    setDragOverVehicle(null);
  };

  const handleVehicleDrop = (e, targetVehicle) => {
    e.preventDefault();
    if (!draggedVehicle || draggedVehicle.id === targetVehicle.id) {
      setDraggedVehicle(null);
      setDragOverVehicle(null);
      return;
    }

    // Check if the drag would change archive status
    const draggedIsArchived = draggedVehicle.archived || false;
    const targetIsArchived = targetVehicle.archived || false;

    if (draggedIsArchived !== targetIsArchived) {
      // Show confirmation dialog for archive/unarchive
      setConfirmDialog({
        isOpen: true,
        title: draggedIsArchived ? 'Unarchive Vehicle' : 'Archive Vehicle',
        message: draggedIsArchived 
          ? `Are you sure you want to unarchive "${draggedVehicle.nickname || draggedVehicle.name}"?` 
          : `Are you sure you want to archive "${draggedVehicle.nickname || draggedVehicle.name}"? It will still be visible but with limited information.`,
        confirmText: draggedIsArchived ? 'Unarchive' : 'Archive',
        isDangerous: false,
        onConfirm: async () => {
          // Update the vehicle's archived status
          const updates = { archived: !draggedIsArchived };
          if (!draggedIsArchived) {
            // Archiving: set display_order to max + 1
            const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
            updates.display_order = maxOrder + 1;
          }
          await updateVehicle(draggedVehicle.id, updates);
          
          // Reload vehicles to reflect the change
          await loadVehicles();
          
          setDraggedVehicle(null);
          setDragOverVehicle(null);
        }
      });
      
      // Clear drag state but don't reorder
      setDraggedVehicle(null);
      setDragOverVehicle(null);
      return;
    }

    // Normal reordering within same section
    const draggedIndex = vehicles.findIndex(v => v.id === draggedVehicle.id);
    const targetIndex = vehicles.findIndex(v => v.id === targetVehicle.id);

    const newVehicles = [...vehicles];
    const [removed] = newVehicles.splice(draggedIndex, 1);
    newVehicles.splice(targetIndex, 0, removed);

    setVehicles(newVehicles);
    setDraggedVehicle(null);
    setDragOverVehicle(null);

    // Update display_order in database
    updateVehiclesOrder(newVehicles);
  };

  const handleVehicleDragEnd = () => {
    setDraggedVehicle(null);
    setDragOverVehicle(null);
    setDragOverArchiveZone(false);
  };

  const handleArchiveZoneDrop = (shouldArchive) => {
    if (!draggedVehicle) return;

    const draggedIsArchived = draggedVehicle.archived || false;
    
    // If already in the correct state, do nothing
    if (draggedIsArchived === shouldArchive) {
      setDraggedVehicle(null);
      setDragOverArchiveZone(false);
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: shouldArchive ? 'Archive Vehicle' : 'Unarchive Vehicle',
      message: shouldArchive 
        ? `Are you sure you want to archive "${draggedVehicle.nickname || draggedVehicle.name}"? It will still be visible but with limited information.`
        : `Are you sure you want to unarchive "${draggedVehicle.nickname || draggedVehicle.name}"?`,
      confirmText: shouldArchive ? 'Archive' : 'Unarchive',
      isDangerous: false,
      onConfirm: async () => {
        const updates = { archived: shouldArchive };
        if (shouldArchive) {
          // Archiving: set display_order to max + 1
          const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
          updates.display_order = maxOrder + 1;
        }
        await updateVehicle(draggedVehicle.id, updates);
        await loadVehicles();
      }
    });

    setDraggedVehicle(null);
    setDragOverArchiveZone(false);
  };

  const handleProjectArchiveZoneDrop = (shouldArchive) => {
    if (!draggedProject) return;

    const draggedIsArchived = draggedProject.archived || false;

    // If already in the correct state, do nothing
    if (draggedIsArchived === shouldArchive) {
      setDraggedProject(null);
      setDragOverProjectArchiveZone(false);
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: shouldArchive ? 'Archive Project' : 'Unarchive Project',
      message: shouldArchive
        ? `Are you sure you want to archive "${draggedProject.name}"? It will still be visible but with limited information.`
        : `Are you sure you want to unarchive "${draggedProject.name}"?`,
      confirmText: shouldArchive ? 'Archive' : 'Unarchive',
      isDangerous: false,
      onConfirm: async () => {
        await updateProject(draggedProject.id, { archived: shouldArchive });
        await loadProjects();
      }
    });

    setDraggedProject(null);
    setDragOverProjectArchiveZone(false);
  };

  // Tab change handler to track animation direction
  const handleTabChange = (newTab) => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  // Swipe gesture handlers for tab navigation using native events
  const minSwipeDistance = 50;
  const tabs = ['vehicles', 'projects', 'parts'];

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const element = tabContentRef.current;
      if (!element) return;

      let touchStartPos = null;
      let touchEndPos = null;

      const handleTouchStart = (e) => {
        touchEndPos = null;
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

  const updateProjectsOrder = async (orderedProjects) => {
    try {
      // Update each project with its new display order
      const updates = orderedProjects.map((project, index) => ({
        id: project.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('projects')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      // Error updating project order
    }
  };

  const updateVehiclesOrder = async (orderedVehicles) => {
    try {
      // Update each vehicle with its new display order
      const updates = orderedVehicles.map((vehicle, index) => ({
        id: vehicle.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('vehicles')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      // Error updating vehicle order
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [deliveredFilter, setDeliveredFilter] = useState('all'); // 'all', 'only', 'hide'
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isSorting, setIsSorting] = useState(false);
  const [isStatusFiltering, setIsStatusFiltering] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPartDetailModal, setShowPartDetailModal] = useState(false);
  const [viewingPart, setViewingPart] = useState(null);
  const [partDetailView, setPartDetailView] = useState('detail'); // 'detail', 'edit', or 'manage-vendors'
  const [trackingModalPartId, setTrackingModalPartId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  const [originalPartData, setOriginalPartData] = useState(null); // Track original data for unsaved changes detection
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [partModalView, setPartModalView] = useState(null); // null = edit part, 'manage-vendors' = manage vendors view
  const [editingVendor, setEditingVendor] = useState(null); // { oldName: string, newName: string }
  // Project-related state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [originalProjectData, setOriginalProjectData] = useState(null); // Track original data for unsaved changes detection
  const [projectModalEditMode, setProjectModalEditMode] = useState(false); // Track if editing within project detail modal
  const [editingTodoId, setEditingTodoId] = useState(null); // Track which todo is being edited
  const [editingTodoText, setEditingTodoText] = useState(''); // Temp text while editing
  const [newTodoText, setNewTodoText] = useState(''); // Text for new todo input
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    priority: 'not_set',
    status: 'planning',
    vehicle_id: null
  });
  const [showAddProjectVehicleDropdown, setShowAddProjectVehicleDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Always start with false to match SSR
  const [darkModeInitialized, setDarkModeInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch by not rendering until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize dark mode after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
      } else {
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      setDarkModeInitialized(true);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && darkModeInitialized) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, darkModeInitialized]);

  // Apply dark scrollbar styles to both html and body for cross-browser compatibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Detect if Safari (not Chrome)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (darkMode) {
        document.documentElement.classList.add('dark-scrollbar');
        document.body.classList.add('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'dark';
        }
      } else {
        document.documentElement.classList.remove('dark-scrollbar');
        document.body.classList.remove('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'light';
        }
      }
    }
  }, [darkMode]);

  // Scroll to top when switching between vehicle and project view in modal
  useEffect(() => {
    if (showVehicleDetailModal) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        // Find all scrollable containers in the modal and scroll to top
        const scrollContainers = document.querySelectorAll('.max-h-\\[calc\\(90vh-180px\\)\\]');
        scrollContainers.forEach(container => {
          container.scrollTop = 0;
        });
      }, 50);
    }
  }, [vehicleModalProjectView, showVehicleDetailModal]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showAddModal || showTrackingModal || 
                          showAddProjectModal || showProjectDetailModal ||
                          showAddVehicleModal || showVehicleDetailModal ||
                          showPartDetailModal;
    if (isAnyModalOpen) {
      // Calculate scrollbar width before locking
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Store current scroll position when opening a modal
      if (savedScrollPosition.current === 0) {
        savedScrollPosition.current = window.scrollY;
      }
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollPosition.current}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Remove fixed positioning but maintain scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      // Restore scroll position
      if (savedScrollPosition.current > 0) {
        window.scrollTo(0, savedScrollPosition.current);
        savedScrollPosition.current = 0; // Reset for next modal
      }
    }
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
    };
  }, [showAddModal, showTrackingModal, showAddProjectModal, 
      showProjectDetailModal, showAddVehicleModal, showVehicleDetailModal, showPartDetailModal]);

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

  const hasUnsavedPartChanges = () => {
    if (!originalPartData || !editingPart) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'part', 'partNumber', 'vendor', 'price', 'shipping', 'duties', 
      'tracking', 'status', 'projectId'
    ];
    for (const field of fieldsToCheck) {
      if (String(editingPart[field] || '') !== String(originalPartData[field] || '')) {
        return true;
      }
    }
    return false;
  };

  const updatePartStatus = async (partId, newStatus) => {
    // If changing to shipped, show tracking modal
    if (newStatus === 'shipped') {
      setTrackingModalPartId(partId);
      setShowTrackingModal(true);
      setOpenDropdown(null);
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
      const { error } = await supabase
        .from('parts')
        .update(updates)
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === partId) {
          return { ...part, ...updates };
        }
        return part;
      }));
      setOpenDropdown(null);
    } catch (error) {
      alert('Error updating part status. Please try again.');
    }
  };

  const saveTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true,
          tracking: trackingInput
        })
        .eq('id', trackingModalPartId);
      if (error) throw error;
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
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      alert('Error saving tracking info. Please try again.');
    }
  };

  const skipTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true
        })
        .eq('id', trackingModalPartId);
      if (error) throw error;
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
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      alert('Error updating status. Please try again.');
    }
  };

  const saveEditedPart = async () => {
    const price = parseFloat(editingPart.price) || 0;
    const shipping = parseFloat(editingPart.shipping) || 0;
    const duties = parseFloat(editingPart.duties) || 0;
    const total = price + shipping + duties;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
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
        })
        .eq('id', editingPart.id);
      if (error) throw error;
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
      setEditingPart(null);
      setPartModalView(null);
    } catch (error) {
      alert('Error saving part. Please try again.');
    }
  };

  const deletePart = async (partId) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);
      if (error) throw error;
        // Update local state
        setParts(prevParts => prevParts.filter(part => part.id !== partId));
      } catch (error) {
        alert('Error deleting part. Please try again.');
      }
  };

  // Vendor management functions
  const renameVendor = async (oldName, newName) => {
    if (!newName || !newName.trim()) {
      alert('Vendor name cannot be empty');
      return;
    }

    try {
      const partsToUpdate = parts.filter(p => p.vendor === oldName);
      // Update all parts in database
      const { error } = await supabase
        .from('parts')
        .update({ vendor: newName.trim() })
        .eq('vendor', oldName);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.vendor === oldName ? { ...part, vendor: newName.trim() } : part
      ));
      // Update editingPart if it has the old vendor
      if (editingPart && editingPart.vendor === oldName) {
        setEditingPart({ ...editingPart, vendor: newName.trim() });
      }
      setEditingVendor(null);
    } catch (error) {
      alert('Error renaming vendor. Please try again.');
    }
  };

  const deleteVendor = async (vendorName) => {
    try {
      const partsWithVendor = parts.filter(p => p.vendor === vendorName);
      // Update all parts in database to have empty vendor
      const { error } = await supabase
        .from('parts')
        .update({ vendor: '' })
        .eq('vendor', vendorName);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.vendor === vendorName ? { ...part, vendor: '' } : part
      ));
      // Update editingPart if it has this vendor
      if (editingPart && editingPart.vendor === vendorName) {
        setEditingPart({ ...editingPart, vendor: '' });
      }
    } catch (error) {
      alert('Error deleting vendor. Please try again.');
    }
  };

  const unlinkPartFromProject = async (partId) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({ project_id: null })
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.id === partId ? { ...part, projectId: null } : part
      ));
    } catch (error) {
      alert('Error unlinking part. Please try again.');
    }
  };

  const updatePartProject = async (partId, projectId) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({ project_id: projectId || null })
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.id === partId ? { ...part, projectId: projectId || null } : part
      ));
    } catch (error) {
      alert('Error updating part project. Please try again.');
    }
  };

  const addNewPart = async () => {
    const price = parseFloat(newPart.price) || 0;
    const shipping = parseFloat(newPart.shipping) || 0;
    const duties = parseFloat(newPart.duties) || 0;
    const total = price + shipping + duties;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    try {
      const createdAt = new Date().toISOString();
      // Insert into database
      const { data, error } = await supabase
        .from('parts')
        .insert({
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
        })
        .select()
        .single();
      if (error) throw error;
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
      setShowAddModal(false);
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
      alert('Error adding part. Please try again.');
    }
  };

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

  const StatusDropdown = ({ part }) => {
    const isOpen = openDropdown === part.id;
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [isPositioned, setIsPositioned] = useState(false);
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 200; // Height of 4-item dropdown with padding
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Simple: open upward if not enough space below
        const openUpward = spaceBelow < dropdownHeight;
        setDropdownPosition(openUpward ? 'top' : 'bottom');
        
        // Calculate fixed position
        setDropdownStyle({
          left: `${rect.left}px`,
          top: openUpward ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
          minWidth: '140px'
        });
        
        setIsPositioned(true);
      } else {
        setIsPositioned(false);
      }
    }, [isOpen]);
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : part.id);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-md ${getStatusColor(part)}`}
          style={{ width: '8.25rem' }}
        >
          {getStatusIcon(part)}
          <span className="flex-1 text-left">{getStatusText(part)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && isPositioned && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(null);
              }}
            />
            <div 
              className={`fixed rounded-lg shadow-lg border py-1 z-50 ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}
              style={dropdownStyle}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'delivered');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-green-900/30' 
                    : 'text-gray-700 hover:bg-green-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Delivered</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'shipped');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-blue-900/30' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Truck className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Shipped</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'purchased');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-yellow-900/30' 
                    : 'text-gray-700 hover:bg-yellow-50'
                }`}
              >
                <ShoppingCart className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span>Ordered</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'pending');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <span>Pending</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const ProjectDropdown = ({ part }) => {
    const isOpen = openDropdown === `project-${part.id}`;
    const selectedProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [isPositioned, setIsPositioned] = useState(false);
    // Get priority color for selected project
    const getPriorityButtonColor = (priority) => {
      const colors = {
        not_set: darkMode ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-800 border-blue-200',
        low: darkMode ? 'bg-green-900/30 text-green-200 border-green-700' : 'bg-green-50 text-green-800 border-green-200',
        medium: darkMode ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700' : 'bg-yellow-50 text-yellow-800 border-yellow-200',
        high: darkMode ? 'bg-red-900/30 text-red-200 border-red-700' : 'bg-red-50 text-red-800 border-red-200'
      };
      return colors[priority] || colors.not_set;
    };
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Calculate dropdown height based on number of projects
        const itemHeight = 40;
        const maxVisibleItems = 6;
        const actualItems = Math.min(projects.length + 1, maxVisibleItems);
        const dropdownHeight = actualItems * itemHeight + 20; // Add padding
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Simple: open upward if not enough space below
        const openUpward = spaceBelow < dropdownHeight;
        setDropdownPosition(openUpward ? 'top' : 'bottom');
        
        // Calculate fixed position - on mobile align right, on desktop align left
        const isMobile = window.innerWidth < 768;
        setDropdownStyle({
          left: isMobile ? 'auto' : `${rect.left}px`,
          right: isMobile ? `${window.innerWidth - rect.right}px` : 'auto',
          top: openUpward ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
          minWidth: '180px',
          maxHeight: '240px'
        });
        
        setIsPositioned(true);
      } else {
        setIsPositioned(false);
      }
    }, [isOpen, projects.length]);
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : `project-${part.id}`);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-md ${
            selectedProject 
              ? getPriorityButtonColor(selectedProject.priority)
              : (darkMode ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300')
          }`}
          style={{ minWidth: '8.25rem', maxWidth: '10rem' }}
        >
          <span className="flex-1 text-left truncate">{selectedProject ? selectedProject.name : 'None'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && isPositioned && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(null);
              }}
            />
            <div 
              className={`fixed rounded-lg shadow-lg border py-1 z-50 overflow-y-auto scrollbar-hide ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}
              style={{
                ...dropdownStyle,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartProject(part.id, null);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-400'
                }`} />
                <span>None</span>
              </button>
              {projects.map(project => {
                const priorityColor = {
                  not_set: darkMode ? 'bg-blue-500' : 'bg-blue-600',
                  low: darkMode ? 'bg-green-500' : 'bg-green-600',
                  medium: darkMode ? 'bg-yellow-500' : 'bg-yellow-600',
                  high: darkMode ? 'bg-red-500' : 'bg-red-600'
                };
                return (
                  <button
                    key={project.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePartProject(part.id, project.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-blue-900/20' 
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      priorityColor[project.priority] || priorityColor.not_set
                    }`} />
                    <span className="truncate">{project.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
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
                  activeTab !== 'vehicles' ? 'hidden sm:flex' : ''
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
          darkMode ? 'border-gray-700' : 'border-slate-200'
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
              <Package className="w-5 h-5" />
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
          addNewPart={addNewPart}
          onClose={() => setShowAddModal(false)}
        />

        {/* Tracking Info Modal */}
        <TrackingModal
          isOpen={showTrackingModal}
          darkMode={darkMode}
          trackingInput={trackingInput}
          setTrackingInput={setTrackingInput}
          skipTrackingInfo={skipTrackingInfo}
          saveTrackingInfo={saveTrackingInfo}
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
          saveEditedPart={saveEditedPart}
          deletePart={deletePart}
          updateVendorColor={updateVendorColor}
          renameVendor={renameVendor}
          deleteVendor={deleteVendor}
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
          <div
            ref={tabContentRef}
            className="slide-in-left"
          >
          <>
        {/* Statistics and Cost Breakdown - Side by Side */}
        <div className="flex flex-col gap-6 mb-6 stats-container-800">
          <style>{`
            @media (min-width: 800px) {
              .stats-container-800 {
                display: grid !important;
                grid-template-columns: 1.5fr 1fr !important;
              }
              .stats-cards-800 {
                display: flex !important;
                flex-direction: column !important;
                gap: 1rem !important;
                height: 100% !important;
                justify-content: space-between !important;
                order: 0 !important;
              }
              .stats-cards-800 > div:first-child {
                flex-shrink: 0 !important;
              }
              .stats-cards-800 .space-y-4 {
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }
              .cost-breakdown-800 {
                order: 0 !important;
              }
              .search-box-800 {
                display: block !important;
              }
              .circular-progress-800 {
                display: flex !important;
              }
              .mobile-progress-800 {
                display: none !important;
              }
            }
          `}</style>
          {/* Statistics Cards - 3 column grid on mobile */}
          <div className="space-y-4 order-1 stats-cards-800">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div
                onClick={() => {
                  setIsStatusFiltering(true);
                  setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased');
                  setDeliveredFilter('all');
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-yellow-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'purchased' ? 'ring-2 ring-yellow-500' : ''}`}
              >
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Ordered</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.purchased}</p>
                </div>
              </div>

              <div
                onClick={() => {
                  setIsStatusFiltering(true);
                  setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped');
                  setDeliveredFilter('all');
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-blue-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'shipped' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Shipped</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.shipped}</p>
                </div>
              </div>

              <div
                onClick={() => {
                  setIsStatusFiltering(true);
                  // Cycle through: all -> only -> hide -> all
                  setDeliveredFilter(prev =>
                    prev === 'all' ? 'only' :
                    prev === 'only' ? 'hide' : 'all'
                  );
                  setStatusFilter('all');
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 ${
                  deliveredFilter === 'hide' ? 'border-red-500' : 'border-green-500'
                } relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  deliveredFilter === 'hide'
                    ? (darkMode ? 'bg-gray-900' : 'bg-gray-300')
                    : (darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50')
                } ${deliveredFilter !== 'all' ? `ring-2 ${deliveredFilter === 'hide' ? 'ring-red-500' : 'ring-green-500'}` : ''}`}
              >
                <CheckCircle className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  deliveredFilter === 'hide' ? 'text-red-500' : 'text-green-500'
                } opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4`} />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Delivered</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.delivered}</p>
                </div>
              </div>
            </div>

            {/* Search Box - Shows in left column at 800px+ */}
            <div className={`hidden search-box-800 rounded-lg shadow-md p-3 ${
              darkMode ? 'bg-gray-800' : 'bg-slate-100'
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Cost Breakdown - order-2 on mobile, full column width at 800px+ */}
          <div className="order-2 cost-breakdown-800">
            <div className={`rounded-lg shadow-md p-3 pb-2 h-full flex flex-col ${
              darkMode ? 'bg-gray-800' : 'bg-slate-100'
            }`}>
            <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <TrendingUp className="w-4 h-4" />
              Cost Breakdown
            </h3>
            <div className="flex gap-4 flex-1">
              {/* Circular Progress - Desktop Only */}
              <div className="hidden circular-progress-800 items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className={darkMode ? 'text-gray-700' : 'text-gray-200'}
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats.delivered / stats.total))}`}
                      className="text-green-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {Math.round((stats.delivered / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="grid grid-cols-1 gap-0.5 flex-1">
                <div className={`flex items-center justify-between py-0.5`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Parts</p>
                  <PriceDisplay 
                    amount={stats.totalPrice}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between py-0.5`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Shipping</p>
                  <PriceDisplay 
                    amount={stats.totalShipping}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between py-0.5 border-b ${
                  darkMode ? 'border-gray-700' : 'border-gray-300'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Import Duties</p>
                  <PriceDisplay 
                    amount={stats.totalDuties}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between`}>
                  <p className={`text-sm font-bold ${
                    darkMode ? 'text-gray-200' : 'text-slate-800'
                  }`}>Total</p>
                  <PriceDisplay 
                    amount={stats.totalCost}
                    className={`text-base font-bold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                
                {/* Mobile Progress Bar */}
                <div className="pt-1 md:pt-1.5 mt-auto mobile-progress-800">
                  <p className={`text-xs mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Progress</p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 rounded-full h-2 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      {Math.round((stats.delivered / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Search Box - Mobile only */}
          <div className={`show-below-800 rounded-lg shadow-md p-3 order-3 ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          }`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search parts..."
                className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parts Table */}
        {/* Desktop Table View - Hidden below 800px */}
        {filteredParts.length > 0 ? (
        <div className={`hidden-below-800 rounded-lg shadow-md ${
          darkMode ? 'bg-gray-800' : 'bg-slate-100'
        }`}>
          <div className="overflow-x-auto overflow-y-visible rounded-lg">
            <table className={`w-full ${isStatusFiltering || isFilteringParts ? 'table-status-filtering' : isSorting ? 'table-sorting' : ''}`}>
              <thead className={`border-b ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-100 border-slate-200'
              }`}>
                <tr>
                  <th 
                    onClick={() => handleSort('status')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part</th>
                  <th className={`hidden px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part #</th>
                  <th 
                    onClick={() => handleSort('vendor')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Vendor
                      {getSortIcon('vendor')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('project')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Project
                      {getSortIcon('project')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vehicle')}
                    className={`hidden xl:table-cell px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Vehicle
                      {getSortIcon('vehicle')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Total
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Tracking</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-slate-200'
              }`}>
                {filteredParts.map((part) => (
                  <tr 
                    key={part.id} 
                    onClick={() => {
                      setViewingPart(part);
                      setShowPartDetailModal(true);
                    }}
                    className={`transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusDropdown part={part} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>{part.part}</div>
                    </td>
                    <td className="hidden px-6 py-4">
                      {part.partNumber && part.partNumber !== '-' ? (
                        <div className={`text-sm font-mono ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>{part.partNumber}</div>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Part #
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {part.vendor ? (
                        vendorColors[part.vendor] ? (
                          (() => {
                            const colors = getVendorDisplayColor(vendorColors[part.vendor], darkMode);
                            return (
                              <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-center border"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderColor: colors.border
                                }}
                              >
                                {part.vendor}
                              </span>
                            );
                          })()
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-center ${getVendorColor(part.vendor, vendorColors)}`}>
                            {part.vendor}
                          </span>
                        )
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-center border ${
                          darkMode
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Vendor
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ProjectDropdown part={part} />
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 text-center">
                      {(() => {
                        const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                        const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                        return vehicle ? (
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                              darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <Car className="w-3 h-3 mr-1" />
                            <span style={{ color: vehicle.color || '#3B82F6' }}>
                              {vehicle.nickname || vehicle.name}
                            </span>
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                            darkMode 
                              ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}>
                            No Vehicle
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {part.tracking ? (
                        getTrackingUrl(part.tracking) ? (
                          <a
                            href={getTrackingUrl(part.tracking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors w-28"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getCarrierName(part.tracking)}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md w-28 ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {getCarrierName(part.tracking)}
                          </div>
                        )
                      ) : (
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md w-28 border ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Tracking
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`px-6 py-4 border-t parts-table-footer ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Showing <span className="font-semibold">{filteredParts.length}</span> of <span className="font-semibold">{stats.total}</span> parts
            </p>
          </div>
        </div>
        ) : (
          <div className={`hidden-below-800 text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          } ${isStatusFiltering || isSorting ? 'animate-fade-in' : ''}`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all' 
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
            {!searchTerm && statusFilter === 'all' && vendorFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add First Part
              </button>
            )}
          </div>
        )}

        {/* Mobile Card View - Visible only below 800px */}
        {filteredParts.length > 0 ? (
        <div className={`show-below-800 grid grid-cols-1 gap-4 ${isStatusFiltering || isFilteringParts ? 'cards-status-filtering' : ''}`}>
            {filteredParts.map((part) => (
              <div 
                key={part.id}
                onClick={() => {
                  setViewingPart(part);
                  setShowPartDetailModal(true);
                }}
                className={`relative rounded-lg shadow-lg p-4 transition-all hover:shadow-xl cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-800' 
                    : 'bg-slate-100'
                }`}
              >
                {/* Card Header - Part Name and Vehicle Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`text-base font-bold flex-1 ${
                    darkMode ? 'text-gray-100' : 'text-slate-800'
                  }`}>
                    {part.part}
                  </h3>
                  {/* Vehicle Badge - Top Right */}
                  {(() => {
                    const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                    const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                    return vehicle && (
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <Car className="w-3 h-3 mr-1" />
                        <span style={{ color: vehicle.color || '#3B82F6' }}>
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </span>
                    );
                  })()}
                </div>

                {/* Vendor and Project Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  {/* Vendor on Left (or "none" badge if no vendor) */}
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Vendor:</p>
                    {part.vendor ? (
                      vendorColors[part.vendor] ? (
                        (() => {
                          const colors = getVendorDisplayColor(vendorColors[part.vendor], darkMode);
                          return (
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: colors.border
                              }}
                            >
                              {part.vendor}
                            </span>
                          );
                        })()
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor, vendorColors)}`}>
                          {part.vendor}
                        </span>
                      )
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        none
                      </span>
                    )}
                  </div>
                  
                  {/* Project on Right (with label) */}
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Project:</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ProjectDropdown part={part} />
                    </div>
                  </div>
                </div>

                {/* Part Number and Status Row - Mobile only */}
                <div className="mb-3 sm:hidden">
                  <div className="flex items-center justify-between gap-3">
                    {/* Part Number on Left */}
                    {part.partNumber && part.partNumber !== '-' ? (
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Part #:</p>
                        <p className={`text-sm font-mono ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{part.partNumber}</p>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {/* Status on Right (no label) */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown part={part} />
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Show full price breakdown */}
                <div className="mb-3 hidden sm:block">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Price</p>
                        <p className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>${part.price.toFixed(2)}</p>
                      </div>
                      {part.shipping > 0 && (
                        <div>
                          <p className={`text-xs mb-0.5 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Ship</p>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${part.shipping.toFixed(2)}</p>
                        </div>
                      )}
                      {part.duties > 0 && (
                        <div>
                          <p className={`text-xs mb-0.5 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Duties</p>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${part.duties.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Total</p>
                        <p className={`text-base font-bold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>${part.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className={`my-3 border-t ${
                  darkMode ? 'border-gray-700' : 'border-slate-200'
                }`}></div>

                {/* Tracking and Total Price Row (Mobile Only) */}
                <div className="flex items-center justify-between gap-3 sm:hidden">
                  {/* Tracking on Left */}
                  <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                    {part.tracking ? (
                      getTrackingUrl(part.tracking) ? (
                        <a
                          href={getTrackingUrl(part.tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track: {getCarrierName(part.tracking)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {getCarrierName(part.tracking)}
                        </div>
                      )
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}>
                        No Tracking
                      </span>
                    )}
                  </div>
                  
                  {/* Total Price on Right */}
                  <div className="flex items-baseline gap-1">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Total:</p>
                    <PriceDisplay 
                      amount={part.total}
                      className={`text-xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                      }`}
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                {/* Desktop: Tracking Only */}
                <div className="hidden sm:block">
                  <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                    {part.tracking ? (
                      getTrackingUrl(part.tracking) ? (
                        <a
                          href={getTrackingUrl(part.tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track: {getCarrierName(part.tracking)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {getCarrierName(part.tracking)}
                        </div>
                      )
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}>
                        No Tracking
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`show-below-800 text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          } ${isStatusFiltering || isSorting ? 'animate-fade-in' : ''}`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all' 
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
            {!searchTerm && statusFilter === 'all' && vendorFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add First Part
              </button>
            )}
          </div>
        )}
        </>
          </div>
        )}

        {/* PROJECTS TAB CONTENT */}
        {activeTab === 'projects' && (
          <div
            ref={tabContentRef}
            className={previousTab === 'vehicles' ? 'slide-in-left' : 'slide-in-right'}
          >
          <>
            {/* Projects Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isFilteringProjects ? 'projects-filtering' : ''}`}>
              {projects
                .filter(project => !project.archived)
                .filter(project => {
                  if (projectVehicleFilter === 'all') return true;
                  // Convert both to strings for comparison since select values are strings
                  return String(project.vehicle_id) === String(projectVehicleFilter);
                })
                .map((project) => {
                // Calculate spent based on linked parts
                const linkedPartsTotal = calculateProjectTotal(project.id, parts);
                const progress = project.budget > 0 ? (linkedPartsTotal / project.budget) * 100 : 0;
                const statusColors = getStatusColors(darkMode);
                const priorityColors = getPriorityColors(darkMode);

                return (
                  <div
                    key={project.id}
                    data-project-id={project.id}
                    onDragOver={(e) => handleDragOver(e, project)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, project)}
                    onClick={() => {
                      setViewingProject(project);
                      setOriginalProjectData({ ...project }); // Save original data for unsaved changes check
                      setProjectModalEditMode(false);
                      setShowProjectDetailModal(true);
                    }}
                    className={`relative rounded-lg shadow-lg pt-3 pb-6 px-6 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer ${
                      draggedProject?.id === project.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : dragOverProject?.id === project.id
                          ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                          : ''
                    } ${cardBg(darkMode)}`}
                  >
                    {/* Drag Handle - Hidden on mobile */}
                    <div 
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, project);
                        // Set the entire card as the drag image, positioned at top-left
                        const card = e.currentTarget.closest('[data-project-id]');
                        if (card) {
                          // Position the drag image so cursor is at the grip icon location (top-left area)
                          e.dataTransfer.setDragImage(card, 20, 20);
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      className={`absolute top-2 left-2 cursor-grab active:cursor-grabbing hidden md:block ${
                        darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Edit Button - Top Right */}
                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setViewingProject(project);
                          setOriginalProjectData({ ...project }); // Save original data for unsaved changes check
                          setProjectModalEditMode(true);
                          setShowProjectDetailModal(true);
                        }}
                        className={`p-2 rounded-md transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                        }`}
                        title="Edit project"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Project Header */}
                    <div className="mb-4 mt-8">
                      <div className="mb-2">
                        <h3 className={`text-xl font-bold ${primaryText(darkMode)}`}>
                          {project.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[project.status]
                        }`}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {(() => {
                          const vehicle = project.vehicle_id ? vehicles.find(v => v.id === project.vehicle_id) : null;
                          return vehicle && (
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              <Car className="w-3 h-3 mr-1" />
                              <span style={{ color: vehicle.color || '#3B82F6' }}>
                                {vehicle.nickname || vehicle.name}
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4" style={{ height: '3.75rem' }}>
                      <p className={`text-sm line-clamp-3 overflow-hidden ${
                        project.description 
                          ? secondaryText(darkMode)
                          : (darkMode ? 'text-gray-500 italic' : 'text-gray-500 italic')
                      }`}
                      style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {project.description || 'No description added'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Budget Used
                        </span>
                        <span className={`text-sm font-bold ${
                          darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-3 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className={`h-3 rounded-full transition-all ${
                            progress > 90
                              ? 'bg-red-500'
                              : progress > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget Info */}
                    <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Spent
                        </p>
                        <p className={`text-lg font-bold ${
                          linkedPartsTotal > project.budget
                            ? (darkMode ? 'text-red-400' : 'text-red-600')
                            : (darkMode ? 'text-green-400' : 'text-green-600')
                        }`}>
                          ${linkedPartsTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Budget
                        </p>
                        <p className={`text-lg font-bold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>
                          ${Math.round(project.budget || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Dates and Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Priority:
                        </span>
                        <span className={`text-sm font-bold ${priorityColors[project.priority]}`}>
                          {project.priority?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Linked Parts */}
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === project.id);
                      return (
                        <div className={`mt-4 pt-4 border-t ${
                          darkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              <Package className="w-4 h-4" />
                              Linked Parts ({linkedParts.length})
                            </span>
                          </div>
                          {linkedParts.length > 0 ? (
                            <div className={`grid grid-cols-2 gap-1 ${
                              linkedParts.length === 6 ? 'pb-6' : ''
                            }`}>
                              {linkedParts.slice(0, 6).map((part) => (
                                <div 
                                  key={part.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <span className="truncate block">{part.part}</span>
                                </div>
                              ))}
                              {linkedParts.length > 6 && (
                                <div className={`col-span-2 text-xs text-center pt-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>
                                  +{linkedParts.length - 6} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <Package className={`w-8 h-8 mx-auto mb-1.5 opacity-40 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <p className={`text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                No parts linked
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Todo Counter - Bottom Right */}
                    {project.todos && project.todos.length > 0 && (
                      <div className="absolute bottom-2 right-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <CheckCircle className={`w-3.5 h-3.5 ${
                              darkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              {project.todos.filter(t => t.completed).length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className={`w-3.5 h-3.5 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              {project.todos.filter(t => !t.completed).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Archived Projects Section */}
            <>
              <div className={`my-8 border-t ${
                darkMode ? 'border-gray-700' : 'border-slate-300'
              }`}>
                {/* Archive Drop Zone - appears when dragging an active project */}
                {draggedProject && !draggedProject.archived && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverProjectArchiveZone(true);
                    }}
                    onDragLeave={() => setDragOverProjectArchiveZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleProjectArchiveZoneDrop(true);
                    }}
                    className={`hidden md:block mt-8 mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                      dragOverProjectArchiveZone
                        ? darkMode
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-600 bg-blue-100/50'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800/50'
                          : 'border-gray-300 bg-gray-100/50'
                    }`}
                  >
                    <p className={`text-center text-sm ${
                      dragOverProjectArchiveZone
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Drop here to archive
                    </p>
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 ${draggedProject && !draggedProject.archived ? '' : 'mt-8'} mb-6 cursor-pointer select-none transition-colors ${
                    darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-slate-700 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    const wasCollapsed = isProjectArchiveCollapsed;
                    setIsProjectArchiveCollapsed(!isProjectArchiveCollapsed);
                    // If opening the archive, scroll to bottom of page after a brief delay to allow expansion
                    if (wasCollapsed) {
                      setTimeout(() => {
                        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                >
                  <Archive className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">
                    Archive
                  </h2>
                  <ChevronRight
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isProjectArchiveCollapsed ? '' : 'rotate-90'
                    }`}
                  />
                </div>
              </div>

              <div
                ref={projectArchiveRef}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isProjectArchiveCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'
                }`}
              >
                {projects.filter(p => p.archived).length > 0 ? (
                  <>
                    {/* Unarchive Drop Zone - appears when dragging an archived project */}
                    {draggedProject && draggedProject.archived && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverProjectArchiveZone(true);
                        }}
                        onDragLeave={() => setDragOverProjectArchiveZone(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleProjectArchiveZoneDrop(false);
                        }}
                        className={`hidden md:block mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                          dragOverProjectArchiveZone
                            ? darkMode
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-green-600 bg-green-100/50'
                            : darkMode
                              ? 'border-gray-600 bg-gray-800/50'
                              : 'border-gray-300 bg-gray-100/50'
                        }`}
                      >
                        <p className={`text-center text-sm ${
                          dragOverProjectArchiveZone
                            ? darkMode ? 'text-green-400' : 'text-green-600'
                            : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Drop here to unarchive
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.filter(p => p.archived).map((project) => {
                      const vehicle = project.vehicle_id ? vehicles.find(v => v.id === project.vehicle_id) : null;
                      return (
                        <div
                          key={project.id}
                          onClick={() => {
                            setViewingProject(project);
                            setOriginalProjectData({ ...project });
                            setProjectModalEditMode(false);
                            setShowProjectDetailModal(true);
                          }}
                          className={`relative rounded-lg shadow-lg p-6 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer ${
                            darkMode ? 'bg-gray-800' : 'bg-slate-100'
                          }`}
                        >
                          {/* Vehicle Badge - Top Right */}
                          {vehicle && (
                            <div className="absolute top-2 right-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                  darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                              >
                                <Car className="w-3 h-3 mr-1" />
                                <span style={{ color: vehicle.color || '#3B82F6' }}>
                                  {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.name}`}
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Project Name */}
                          <h3 className={`text-lg font-bold mb-2 ${vehicle ? 'pr-20' : ''} ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>
                            {project.name}
                          </h3>

                          {/* Description */}
                          {project.description && (
                            <p className={`text-sm mb-3 line-clamp-2 ${
                              darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>
                              {project.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </>
                ) : (
                  <div className={`text-center py-8 rounded-lg border ${
                    darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <Car className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Archive empty</p>
                  </div>
                )}
              </div>
            </>

            {/* Empty State - Vehicle has no projects */}
            {projectVehicleFilter !== 'all' && projects.filter(project => !project.archived && String(project.vehicle_id) === String(projectVehicleFilter)).length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Car className={`w-16 h-16 mx-auto mb-4 opacity-40 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Selected vehicle has no linked projects
                </h3>
                <p className={`${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Create a project or link an existing one to this vehicle
                </p>
              </div>
            )}

            {/* Empty State - No projects at all */}
            {projects.filter(p => !p.archived).length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Wrench className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  No Projects Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Start organizing your restoration by creating your first project
                </p>
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create First Project
                </button>
              </div>
            )}

            {/* Add Project Modal */}
            <AddProjectModal
              isOpen={showAddProjectModal}
              darkMode={darkMode}
              newProject={newProject}
              setNewProject={setNewProject}
              vehicles={vehicles}
              showAddProjectVehicleDropdown={showAddProjectVehicleDropdown}
              setShowAddProjectVehicleDropdown={setShowAddProjectVehicleDropdown}
              isModalClosing={isModalClosing}
              handleCloseModal={handleCloseModal}
              addProject={addProject}
              onClose={() => setShowAddProjectModal(false)}
            />

            {/* Project Detail Modal */}
            <ProjectDetailModal
              isOpen={showProjectDetailModal}
              darkMode={darkMode}
              viewingProject={viewingProject}
              projectModalEditMode={projectModalEditMode}
              setProjectModalEditMode={setProjectModalEditMode}
              originalProjectData={originalProjectData}
              setOriginalProjectData={setOriginalProjectData}
              isModalClosing={isModalClosing}
              projects={projects}
              parts={parts}
              vehicles={vehicles}
              vendorColors={vendorColors}
              editingTodoId={editingTodoId}
              setEditingTodoId={setEditingTodoId}
              editingTodoText={editingTodoText}
              setEditingTodoText={setEditingTodoText}
              newTodoText={newTodoText}
              setNewTodoText={setNewTodoText}
              handleCloseModal={handleCloseModal}
              hasUnsavedProjectChanges={hasUnsavedProjectChanges}
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
              setConfirmDialog={setConfirmDialog}
              onClose={() => {
                setShowProjectDetailModal(false);
                setViewingProject(null);
              }}
            />
          </>
          </div>
        )}

        {/* VEHICLES TAB CONTENT */}
        {activeTab === 'vehicles' && (
          <div
            ref={tabContentRef}
            className="slide-in-right"
          >
          <>
            {/* Active Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.filter(v => !v.archived).map((vehicle) => {
                const borderColor = getMutedColor(vehicle.color, darkMode);
                return (
                <div
                  key={vehicle.id}
                  data-vehicle-id={vehicle.id}
                  onDragOver={(e) => handleVehicleDragOver(e, vehicle)}
                  onDragLeave={handleVehicleDragLeave}
                  onDrop={(e) => handleVehicleDrop(e, vehicle)}
                  onClick={() => {
                    setViewingVehicle(vehicle);
                    setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                    setShowVehicleDetailModal(true);
                  }}
                  className={`relative rounded-lg shadow-lg pt-3 ${vehicle.archived ? 'pb-3' : 'pb-4'} px-6 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border-t-4 ${
                    draggedVehicle?.id === vehicle.id 
                      ? 'ring-2 ring-blue-500 ring-offset-2' 
                      : dragOverVehicle?.id === vehicle.id
                        ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                        : ''
                  } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                  style={{ borderTopColor: borderColor }}
                >
                  {/* Drag Handle - Hidden on mobile */}
                  <div 
                    draggable
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleVehicleDragStart(e, vehicle);
                      // Set the entire card as the drag image, positioned at top-left
                      const card = e.currentTarget.closest('[data-vehicle-id]');
                      if (card) {
                        // Position the drag image so cursor is at the grip icon location (top-left area)
                        e.dataTransfer.setDragImage(card, 20, 20);
                      }
                    }}
                    onDragEnd={handleVehicleDragEnd}
                    className={`absolute top-2 left-2 cursor-grab active:cursor-grabbing hidden md:block ${
                      darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Edit Button - Top Right */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingVehicle(vehicle);
                        setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                        setVehicleModalEditMode('vehicle');
                        setShowVehicleDetailModal(true);
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                      }`}
                      title="Edit vehicle"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Vehicle Image */}
                  {vehicle.image_url && (
                    <div className="mb-4 mt-10 relative">
                      <img 
                        src={vehicle.image_url} 
                        alt={vehicle.nickname || vehicle.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-48 object-cover rounded-lg border ${
                          vehicle.archived 
                            ? 'grayscale opacity-40' 
                            : ''
                        } ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}`}
                      />
                      {vehicle.archived && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-2xl font-bold px-6 py-2 rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900/80 text-gray-300 border-2 border-gray-600' 
                              : 'bg-white/80 text-gray-700 border-2 border-gray-400'
                          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                            ARCHIVED
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Header */}
                  <div className={`mb-4 ${vehicle.image_url ? 'mt-4' : 'mt-8'}`}>
                    <h3 className={`text-xl font-bold mb-1 ${
                      darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>
                      {vehicle.nickname || [vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                    </h3>
                    {vehicle.nickname && (
                      <p className={`text-sm mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {[vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {!vehicle.archived && (
                      <>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {vehicle.vin && (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'
                            }`}>
                              VIN: {vehicle.vin}
                            </span>
                          )}
                          {vehicle.license_plate && (
                            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                              darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {vehicle.license_plate}
                            </span>
                          )}
                        </div>

                        {/* Project Badges */}
                        {(() => {
                          const vehicleProjects = getVehicleProjects(vehicle.id);
                          return (
                            <div className={`mt-4 pt-4 border-t ${
                              darkMode ? 'border-gray-700' : 'border-slate-200'
                            }`}>
                              <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>
                                Projects ({vehicleProjects.length})
                              </h4>
                              {vehicleProjects.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {vehicleProjects.slice(0, 4).map((project) => (
                                    <span
                                      key={project.id}
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                        darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                                      }`}
                                      style={{ 
                                        borderLeftWidth: '3px', 
                                        borderLeftColor: getPriorityBorderColor(project.priority),
                                        width: 'calc(50% - 4px)'
                                      }}
                                    >
                                      <Wrench className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{project.name}</span>
                                    </span>
                                  ))}
                                  {vehicleProjects.length > 4 && (
                                    <div className="w-full text-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                        darkMode ? 'text-gray-500' : 'text-gray-600'
                                      }`}>
                                        +{vehicleProjects.length - 4} more
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Wrench className={`w-8 h-8 mx-auto mb-2 opacity-40 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                  <p className={`text-xs ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    No projects linked
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {vehicle.archived && vehicle.vin && (
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'
                        }`}>
                          VIN: {vehicle.vin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {/* Archived Vehicles Section */}
            <>
              <div className={`my-8 border-t ${
                darkMode ? 'border-gray-700' : 'border-slate-300'
              }`}>
                {/* Archive Drop Zone - appears when dragging an active vehicle */}
                {draggedVehicle && !draggedVehicle.archived && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverArchiveZone(true);
                    }}
                    onDragLeave={() => setDragOverArchiveZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleArchiveZoneDrop(true);
                    }}
                    className={`hidden md:block mt-8 mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                      dragOverArchiveZone
                        ? darkMode
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-600 bg-blue-100/50'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800/50'
                          : 'border-gray-300 bg-gray-100/50'
                    }`}
                  >
                    <p className={`text-center text-sm ${
                      dragOverArchiveZone
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Drop here to archive
                    </p>
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 ${draggedVehicle && !draggedVehicle.archived ? '' : 'mt-8'} mb-6 cursor-pointer select-none transition-colors ${
                    darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-slate-700 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    const wasCollapsed = isArchiveCollapsed;
                    setIsArchiveCollapsed(!isArchiveCollapsed);
                    // If opening the archive, scroll to bottom of page after a brief delay to allow expansion
                    if (wasCollapsed) {
                      setTimeout(() => {
                        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                >
                  <Archive className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">
                    Archive
                  </h2>
                  <ChevronRight
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isArchiveCollapsed ? '' : 'rotate-90'
                    }`}
                  />
                </div>
              </div>

              <div
                ref={vehicleArchiveRef}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isArchiveCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'
                }`}
              >
                {vehicles.filter(v => v.archived).length > 0 ? (
                  <>
                    {/* Unarchive Drop Zone - appears when dragging an archived vehicle */}
                  {draggedVehicle && draggedVehicle.archived && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverArchiveZone(true);
                      }}
                      onDragLeave={() => setDragOverArchiveZone(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleArchiveZoneDrop(false);
                      }}
                      className={`hidden md:block mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                        dragOverArchiveZone
                          ? darkMode
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-green-600 bg-green-100/50'
                          : darkMode
                            ? 'border-gray-600 bg-gray-800/50'
                            : 'border-gray-300 bg-gray-100/50'
                      }`}
                    >
                      <p className={`text-center text-sm ${
                        dragOverArchiveZone
                          ? darkMode ? 'text-green-400' : 'text-green-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Drop here to unarchive
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vehicles.filter(v => v.archived).map((vehicle) => {
                    const borderColor = getMutedColor(vehicle.color, darkMode);
                    return (
                    <div
                      key={vehicle.id}
                      onClick={() => {
                        setViewingVehicle(vehicle);
                        setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                        setShowVehicleDetailModal(true);
                      }}
                      className={`relative rounded-lg shadow-lg pt-2 pb-2 px-3 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border-t-4 ${
                        darkMode ? 'bg-gray-800' : 'bg-slate-100'
                      }`}
                      style={{ borderTopColor: borderColor }}
                    >
                      {/* Vehicle Image */}
                      {vehicle.image_url && (
                        <div className="mb-2 mt-8 relative">
                          <img 
                            src={vehicle.image_url} 
                            alt={vehicle.name}
                            className={`w-full h-32 object-cover rounded-lg border grayscale opacity-40 ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'
                            }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold px-4 py-1 rounded-lg ${
                              darkMode 
                                ? 'bg-gray-900/80 text-gray-300 border-2 border-gray-600' 
                                : 'bg-white/80 text-gray-700 border-2 border-gray-400'
                            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                              ARCHIVED
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Header */}
                      <div className={`mb-2 ${vehicle.image_url ? 'mt-2' : 'mt-8'}`}>
                        <h3 className={`text-base font-bold mb-1 ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>
                          {vehicle.nickname || [vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                        </h3>
                        {vehicle.nickname && (
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            {[vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                  })}
                  </div>
                  </>
                ) : (
                  <div className={`text-center py-8 rounded-lg border ${
                    darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <Car className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Archive empty</p>
                  </div>
                )}
              </div>
            </>

            {/* Empty State */}
            {vehicles.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Car className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  No Vehicles Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Add your first vehicle to track maintenance and information
                </p>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add First Vehicle
                </button>
              </div>
            )}

            {/* Add Vehicle Modal */}
            <AddVehicleModal
              isOpen={showAddVehicleModal}
              darkMode={darkMode}
              newVehicle={newVehicle}
              setNewVehicle={setNewVehicle}
              vehicleImagePreview={vehicleImagePreview}
              vehicleImageFile={vehicleImageFile}
              uploadingImage={uploadingImage}
              isDraggingImage={isDraggingImage}
              isModalClosing={isModalClosing}
              handleCloseModal={handleCloseModal}
              addVehicle={addVehicle}
              uploadVehicleImage={uploadVehicleImage}
              clearImageSelection={clearImageSelection}
              handleImageFileChange={handleImageFileChange}
              handleImageDragEnter={handleImageDragEnter}
              handleImageDragLeave={handleImageDragLeave}
              handleImageDragOver={handleImageDragOver}
              handleImageDrop={handleImageDrop}
              onClose={() => setShowAddVehicleModal(false)}
            />


            {/* Vehicle Detail Modal */}
            <VehicleDetailModal
              isOpen={showVehicleDetailModal}
              darkMode={darkMode}
              viewingVehicle={viewingVehicle}
              setViewingVehicle={setViewingVehicle}
              vehicleModalProjectView={vehicleModalProjectView}
              setVehicleModalProjectView={setVehicleModalProjectView}
              vehicleModalEditMode={vehicleModalEditMode}
              setVehicleModalEditMode={setVehicleModalEditMode}
              originalVehicleData={originalVehicleData}
              setOriginalVehicleData={setOriginalVehicleData}
              isModalClosing={isModalClosing}
              projects={projects}
              parts={parts}
              vehicles={vehicles}
              vendorColors={vendorColors}
              vehicleImagePreview={vehicleImagePreview}
              vehicleImageFile={vehicleImageFile}
              uploadingImage={uploadingImage}
              isDraggingImage={isDraggingImage}
              editingTodoId={editingTodoId}
              setEditingTodoId={setEditingTodoId}
              editingTodoText={editingTodoText}
              setEditingTodoText={setEditingTodoText}
              newTodoText={newTodoText}
              setNewTodoText={setNewTodoText}
              handleCloseModal={handleCloseModal}
              hasUnsavedVehicleChanges={hasUnsavedVehicleChanges}
              updateVehicle={updateVehicle}
              deleteVehicle={deleteVehicle}
              updateProject={updateProject}
              uploadVehicleImage={uploadVehicleImage}
              clearImageSelection={clearImageSelection}
              handleImageFileChange={handleImageFileChange}
              handleImageDragEnter={handleImageDragEnter}
              handleImageDragLeave={handleImageDragLeave}
              handleImageDragOver={handleImageDragOver}
              handleImageDrop={handleImageDrop}
              getVehicleProjects={getVehicleProjects}
              unlinkPartFromProject={unlinkPartFromProject}
              loadProjects={loadProjects}
              setConfirmDialog={setConfirmDialog}
            />
          </>
          </div>
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
