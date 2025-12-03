import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing all modal state and visibility
 *
 * Features:
 * - Part modals (add, view, edit, tracking)
 * - Project modals (add, view/edit)
 * - Vehicle modals (add, view/edit)
 * - Modal closing animations
 * - Unsaved changes detection
 * - Confirmation dialogs
 * - Body scroll locking when modals are open
 *
 * @returns {Object} Modal state and handlers
 */
const useModals = () => {
  // Part modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPartDetailModal, setShowPartDetailModal] = useState(false);
  const [viewingPart, setViewingPart] = useState(null);
  const [partDetailView, setPartDetailView] = useState('detail'); // 'detail', 'edit', or 'manage-vendors'
  const [trackingModalPartId, setTrackingModalPartId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  const [originalPartData, setOriginalPartData] = useState(null);
  const [partModalView, setPartModalView] = useState(null); // null = edit part, 'manage-vendors' = manage vendors view
  const [editingVendor, setEditingVendor] = useState(null); // { oldName: string, newName: string }

  // Project modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [originalProjectData, setOriginalProjectData] = useState(null);
  const [projectModalEditMode, setProjectModalEditMode] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [showAddProjectVehicleDropdown, setShowAddProjectVehicleDropdown] = useState(false);

  // Vehicle modals
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [originalVehicleData, setOriginalVehicleData] = useState(null);
  const [vehicleModalProjectView, setVehicleModalProjectView] = useState(null);
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(null); // 'vehicle' or 'project'

  // Modal closing animation
  const [isModalClosing, setIsModalClosing] = useState(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Track if we're transitioning between modals to prevent scroll jumping
  const isTransitioningModals = useRef(false);
  const savedScrollPosition = useRef(0);

  /**
   * Handle modal closing with exit animation
   */
  const handleCloseModal = (closeCallback) => {
    setIsModalClosing(true);
    setTimeout(() => {
      closeCallback();
      setIsModalClosing(false);
    }, 200); // Duration matches the exit animation
  };

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

  return {
    // Part modals
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

    // Project modals
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

    // Vehicle modals
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

    // Modal animation and utilities
    isModalClosing,
    setIsModalClosing,
    handleCloseModal,
    isTransitioningModals,
    savedScrollPosition,

    // Confirmation dialog
    confirmDialog,
    setConfirmDialog
  };
};

export default useModals;
