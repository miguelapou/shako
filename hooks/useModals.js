import { useState, useEffect, useLayoutEffect, useRef } from 'react';

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
  const [showAddPartOptionsModal, setShowAddPartOptionsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
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

  // Vendor modals
  const [showManageVendorsModal, setShowManageVendorsModal] = useState(false);

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
  const isScrollLocked = useRef(false);

  /**
   * Handle modal closing with exit animation
   */
  const handleCloseModal = (closeCallback) => {
    console.log('[Modal] handleCloseModal called, setting isModalClosing=true');
    setIsModalClosing(true);
    setTimeout(() => {
      console.log('[Modal] setTimeout fired, calling closeCallback');
      closeCallback();
      // Note: isModalClosing is reset in the useEffect below when no modals are open
      // This prevents a race condition that can cause flickering
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

  // Reset isModalClosing synchronously before paint when a modal opens
  // This prevents flicker where the exit animation class shows briefly before enter animation
  useLayoutEffect(() => {
    const isAnyModalOpen = showAddPartOptionsModal || showAddModal || showCSVImportModal ||
                          showTrackingModal ||
                          showAddProjectModal || showProjectDetailModal ||
                          showAddVehicleModal || showVehicleDetailModal ||
                          showPartDetailModal || showManageVendorsModal;

    // If a modal is opening and isModalClosing is still true from previous close,
    // reset it synchronously before the browser paints
    if (isAnyModalOpen && isModalClosing) {
      console.log('[Modal] useLayoutEffect - Resetting isModalClosing before paint');
      setIsModalClosing(false);
    }
  }, [showAddPartOptionsModal, showAddModal, showCSVImportModal, showTrackingModal, showAddProjectModal,
      showProjectDetailModal, showAddVehicleModal, showVehicleDetailModal, showPartDetailModal, showManageVendorsModal, isModalClosing]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showAddPartOptionsModal || showAddModal || showCSVImportModal ||
                          showTrackingModal ||
                          showAddProjectModal || showProjectDetailModal ||
                          showAddVehicleModal || showVehicleDetailModal ||
                          showPartDetailModal || showManageVendorsModal;

    console.log('[Modal] useEffect - isAnyModalOpen:', isAnyModalOpen, 'isModalClosing:', isModalClosing);

    if (isAnyModalOpen && !isScrollLocked.current) {
      // Lock scroll using overflow: hidden - works with scrollbar-gutter: stable
      console.log('[Modal] Locking scroll');
      savedScrollPosition.current = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      isScrollLocked.current = true;
    } else if (!isAnyModalOpen) {
      // Unlock scroll
      if (isScrollLocked.current) {
        console.log('[Modal] Unlocking scroll');
        document.documentElement.style.overflow = '';
        isScrollLocked.current = false;
      }
    }

    // Cleanup on unmount
    return () => {
      if (isScrollLocked.current) {
        document.documentElement.style.overflow = '';
        isScrollLocked.current = false;
      }
    };
  }, [showAddPartOptionsModal, showAddModal, showCSVImportModal, showTrackingModal, showAddProjectModal,
      showProjectDetailModal, showAddVehicleModal, showVehicleDetailModal, showPartDetailModal, showManageVendorsModal]);

  return {
    // Part modals
    showAddPartOptionsModal,
    setShowAddPartOptionsModal,
    showAddModal,
    setShowAddModal,
    showCSVImportModal,
    setShowCSVImportModal,
    csvFile,
    setCsvFile,
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

    // Vendor modals
    showManageVendorsModal,
    setShowManageVendorsModal,

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
