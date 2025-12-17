import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Wrench,
  Package,
  BadgeDollarSign,
  CheckCircle,
  Clock,
  Gauge,
  Edit2,
  Trash2,
  Archive,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Upload,
  Pause,
  Play,
  Camera,
  FileText,
  Plus,
  ExternalLink,
  MoreVertical,
  Calendar,
  ListChecks,
  FileDown,
  Info
} from 'lucide-react';
import ProjectDetailView from '../ui/ProjectDetailView';
import ProjectEditForm from '../ui/ProjectEditForm';
import LinkedPartsSection from '../ui/LinkedPartsSection';
import FadeInImage from '../ui/FadeInImage';
import AddDocumentModal from './AddDocumentModal';
import AddServiceEventModal from './AddServiceEventModal';
import ExportReportModal from './ExportReportModal';
import {
  calculateVehicleTotalSpent,
  calculateProjectTotal,
  calculateServicePartsTotal
} from '../../utils/dataUtils';
import {
  getPriorityBorderColor,
  getStatusColors,
  getPriorityColors,
  getVendorColor,
  getVendorDisplayColor
} from '../../utils/colorUtils';
import { inputClasses } from '../../utils/styleUtils';
import { generateVehicleReportPDF, downloadBlob } from '../../utils/pdfUtils';
import { useDocuments, useServiceEvents } from '../../contexts';

const VehicleDetailModal = ({
  isOpen,
  setShowVehicleDetailModal,
  darkMode,
  viewingVehicle,
  setViewingVehicle,
  vehicleModalProjectView,
  setVehicleModalProjectView,
  vehicleModalEditMode,
  setVehicleModalEditMode,
  originalVehicleData,
  setOriginalVehicleData,
  isModalClosing,
  projects,
  parts,
  vehicles,
  vendorColors,
  vehicleImagePreview,
  vehicleImageFile,
  uploadingImage,
  isDraggingImage,
  editingTodoId,
  setEditingTodoId,
  editingTodoText,
  setEditingTodoText,
  newTodoText,
  setNewTodoText,
  handleCloseModal,
  hasUnsavedVehicleChanges,
  updateVehicle,
  deleteVehicle,
  updateProject,
  uploadVehicleImage,
  clearImageSelection,
  handleImageFileChange,
  handleImageDragEnter,
  handleImageDragLeave,
  handleImageDragOver,
  handleImageDrop,
  // Multi-image props
  vehicleImageFiles,
  setVehicleImageFiles,
  MAX_VEHICLE_IMAGES,
  addImageFile,
  removeImageFile,
  setPrimaryImageFile,
  uploadMultipleVehicleImages,
  deleteVehicleImageFromStorage,
  getPrimaryImageUrl,
  getVehicleProjects,
  unlinkPartFromProject,
  loadProjects,
  setConfirmDialog,
  getStatusColors,
  getPriorityColors,
  getStatusText,
  getStatusTextColor,
  getVendorColor,
  calculateProjectTotal,
  toast
}) => {
  // State for image gallery navigation
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Slide direction for animation: 'left' or 'right' or null (initial)
  const [slideDirection, setSlideDirection] = useState(null);

  // Reset image index when vehicle changes or modal opens
  useEffect(() => {
    if (isOpen && viewingVehicle?.id) {
      setCurrentImageIndex(0);
      setSlideDirection(null);
    }
  }, [isOpen, viewingVehicle?.id]);

  // State for report generation
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  // State for document/service event action overlays
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  // State for viewing service event info (notes + parts)
  const [viewingInfoEvent, setViewingInfoEvent] = useState(null);
  const [isInfoModalClosing, setIsInfoModalClosing] = useState(false);
  // State for service history expansion
  const [serviceHistoryExpanded, setServiceHistoryExpanded] = useState(false);
  const [isServiceHistoryCollapsing, setIsServiceHistoryCollapsing] = useState(false);
  // State for mobile detection (to show inline service event form instead of modal)
  const [isMobile, setIsMobile] = useState(false);
  // State for inline service event parts dropdown
  const [showInlinePartsDropdown, setShowInlinePartsDropdown] = useState(false);
  const [isInlineDropdownClosing, setIsInlineDropdownClosing] = useState(false);
  const [inlinePartsSearchTerm, setInlinePartsSearchTerm] = useState('');
  const inlinePartsDropdownRef = useRef(null);

  // Track screen size for responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close inline parts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inlinePartsDropdownRef.current && !inlinePartsDropdownRef.current.contains(event.target)) {
        if (showInlinePartsDropdown && !isInlineDropdownClosing) {
          setIsInlineDropdownClosing(true);
          setTimeout(() => {
            setShowInlinePartsDropdown(false);
            setIsInlineDropdownClosing(false);
          }, 150);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInlinePartsDropdown, isInlineDropdownClosing]);

  // Toggle inline parts dropdown
  const toggleInlinePartsDropdown = () => {
    if (showInlinePartsDropdown) {
      setIsInlineDropdownClosing(true);
      setTimeout(() => {
        setShowInlinePartsDropdown(false);
        setIsInlineDropdownClosing(false);
      }, 150);
    } else {
      setShowInlinePartsDropdown(true);
    }
  };

  // Reset service history expansion when viewing a different vehicle
  useEffect(() => {
    setServiceHistoryExpanded(false);
    setIsServiceHistoryCollapsing(false);
  }, [viewingVehicle?.id]);

  // Handle closing the info modal with animation
  const handleCloseInfoModal = () => {
    setIsInfoModalClosing(true);
    setTimeout(() => {
      setViewingInfoEvent(null);
      setIsInfoModalClosing(false);
    }, 150);
  };

  // Touch refs for swipe gestures
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const isScrollingRef = useRef(false);
  const minSwipeDistance = 50;

  // Filter to non-archived vehicles for navigation
  const navigableVehicles = useMemo(() =>
    vehicles.filter(v => !v.archived),
    [vehicles]
  );

  // Get current index and navigation state
  const currentIndex = navigableVehicles.findIndex(v => v.id === viewingVehicle?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < navigableVehicles.length - 1 && currentIndex !== -1;

  const goToPrevVehicle = useCallback(() => {
    if (hasPrev) {
      const prevVehicle = navigableVehicles[currentIndex - 1];
      setViewingVehicle(prevVehicle);
      setOriginalVehicleData({ ...prevVehicle });
      // Reset sub-views when navigating
      setVehicleModalProjectView(null);
      setVehicleModalEditMode(null);
      clearImageSelection();
    }
  }, [hasPrev, navigableVehicles, currentIndex, setViewingVehicle, setOriginalVehicleData, setVehicleModalProjectView, setVehicleModalEditMode, clearImageSelection]);

  const goToNextVehicle = useCallback(() => {
    if (hasNext) {
      const nextVehicle = navigableVehicles[currentIndex + 1];
      setViewingVehicle(nextVehicle);
      setOriginalVehicleData({ ...nextVehicle });
      // Reset sub-views when navigating
      setVehicleModalProjectView(null);
      setVehicleModalEditMode(null);
      clearImageSelection();
    }
  }, [hasNext, navigableVehicles, currentIndex, setViewingVehicle, setOriginalVehicleData, setVehicleModalProjectView, setVehicleModalEditMode, clearImageSelection]);

  // Keyboard navigation (left/right arrow keys for vehicles, shift+arrows for images)
  useEffect(() => {
    if (!isOpen || vehicleModalEditMode || vehicleModalProjectView) return;

    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      const images = viewingVehicle?.images_resolved || [];
      const hasMultipleImages = images.length > 1;

      // Shift + Arrow keys: cycle through images
      if (e.shiftKey && hasMultipleImages) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSlideDirection('right');
          setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSlideDirection('left');
          setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
        }
        return;
      }

      // Arrow keys without shift: cycle through vehicles
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        goToPrevVehicle();
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        goToNextVehicle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, vehicleModalEditMode, vehicleModalProjectView, hasPrev, hasNext, goToPrevVehicle, goToNextVehicle, viewingVehicle?.images_resolved, setSlideDirection, setCurrentImageIndex]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    touchEndRef.current = null;
    isScrollingRef.current = false;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;

    const diffX = Math.abs(currentX - touchStartRef.current.x);
    const diffY = Math.abs(currentY - touchStartRef.current.y);

    // Detect if user is scrolling vertically
    if (diffY > diffX && diffY > 10) {
      isScrollingRef.current = true;
    }

    touchEndRef.current = { x: currentX, y: currentY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    if (vehicleModalEditMode || vehicleModalProjectView) return;

    // Don't trigger navigation if user was scrolling vertically
    if (isScrollingRef.current) {
      touchStartRef.current = null;
      touchEndRef.current = null;
      isScrollingRef.current = false;
      return;
    }

    const distance = touchStartRef.current.x - touchEndRef.current.x;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      goToNextVehicle();
    } else if (isRightSwipe && hasPrev) {
      goToPrevVehicle();
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
    isScrollingRef.current = false;
  };

  // Track if this modal was open (for close animation)
  const wasOpen = useRef(false);
  if (isOpen) wasOpen.current = true;

  // Get document state and actions from context
  const {
    documents,
    loadingDocuments,
    uploadingDocument,
    showAddDocumentModal,
    setShowAddDocumentModal,
    newDocumentTitle,
    setNewDocumentTitle,
    newDocumentFile,
    setNewDocumentFile,
    isDraggingDocument,
    loadDocuments,
    addDocument,
    deleteDocument,
    handleDocumentFileChange,
    openDocument,
    handleDocumentDragEnter,
    handleDocumentDragLeave,
    handleDocumentDragOver,
    handleDocumentDrop
  } = useDocuments();

  // Get service events state and actions from context
  const {
    serviceEvents,
    loadingServiceEvents,
    savingServiceEvent,
    showAddServiceEventModal,
    setShowAddServiceEventModal,
    newEventDate,
    setNewEventDate,
    newEventDescription,
    setNewEventDescription,
    newEventOdometer,
    setNewEventOdometer,
    newEventNotes,
    setNewEventNotes,
    newEventLinkedParts,
    setNewEventLinkedParts,
    editingServiceEvent,
    loadServiceEvents,
    addServiceEvent,
    updateServiceEvent,
    deleteServiceEvent,
    openAddServiceEventModal,
    openEditServiceEventModal,
    handleCloseServiceEventModal
  } = useServiceEvents();

  // Reset inline dropdown state when service event modal closes
  useEffect(() => {
    if (!showAddServiceEventModal) {
      setShowInlinePartsDropdown(false);
      setIsInlineDropdownClosing(false);
      setInlinePartsSearchTerm('');
    }
  }, [showAddServiceEventModal]);

  // Sorted service events for display
  const sortedServiceEvents = useMemo(() => {
    if (!serviceEvents) return [];
    return [...serviceEvents].sort((a, b) =>
      new Date(a.event_date + 'T00:00:00') - new Date(b.event_date + 'T00:00:00')
    );
  }, [serviceEvents]);

  const serviceEventsHiddenCount = Math.max(0, sortedServiceEvents.length - 3);

  // Load documents and service events when modal opens
  useEffect(() => {
    if (isOpen && viewingVehicle?.id) {
      loadDocuments(viewingVehicle.id);
      loadServiceEvents(viewingVehicle.id);
    }
  }, [isOpen, viewingVehicle?.id, loadDocuments, loadServiceEvents]);

  // Reset service event view when modal closes
  useEffect(() => {
    if (!isOpen) {
      handleCloseServiceEventModal();
    }
  }, [isOpen, handleCloseServiceEventModal]);

  // Reset document view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddDocumentModal(false);
      setNewDocumentFile(null);
      setNewDocumentTitle('');
    }
  }, [isOpen, setShowAddDocumentModal, setNewDocumentFile, setNewDocumentTitle]);

  // Reset info view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewingInfoEvent(null);
      setIsInfoModalClosing(false);
    }
  }, [isOpen]);

  // Handle generating vehicle report PDF
  const handleGenerateReport = async (saveToDocuments) => {
    if (!viewingVehicle || generatingReport) return;

    try {
      setGeneratingReport(true);

      // Generate the PDF
      const { blob, filename } = await generateVehicleReportPDF(
        viewingVehicle,
        projects,
        parts,
        serviceEvents
      );

      // Download the PDF immediately
      await downloadBlob(blob, filename);

      // Optionally save to documents section
      if (saveToDocuments) {
        // Create a File object from the blob for upload
        const file = new File([blob], filename, { type: 'application/pdf' });

        // Generate a title for the document (MM/DD/YY format)
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const title = `Report - ${month}/${day}/${year}`;

        // Upload to documents section
        const newDocument = await addDocument(viewingVehicle.id, title, file);

        // Only show success if document was created successfully
        // Note: addDocument already adds the document to local state on success
        if (newDocument) {
          toast?.success('Report generated and saved to documents');
        }
        // If addDocument failed, it already showed an error toast
      } else {
        toast?.success('Report generated');
      }

      // Close the export modal
      setShowExportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast?.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Keep modal mounted during closing animation only if THIS modal was open
  // Reset wasOpen when modal finishes closing
  if (!isOpen && !isModalClosing) {
    wasOpen.current = false;
  }
  if ((!isOpen && !(isModalClosing && wasOpen.current)) || !viewingVehicle) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(() => {
        // Check for unsaved changes
        if (hasUnsavedVehicleChanges()) {
          setConfirmDialog({
            isOpen: true,
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Are you sure you want to close without saving?',
            confirmText: 'Discard',
            cancelText: 'Go Back',
            onConfirm: () => {
              setShowVehicleDetailModal(false);
              setViewingVehicle(null);
              setOriginalVehicleData(null);
              setVehicleModalProjectView(null);
              setVehicleModalEditMode(null);
              clearImageSelection();
            }
          });
          return;
        }
        setShowVehicleDetailModal(false);
        setViewingVehicle(null);
        setOriginalVehicleData(null);
        setVehicleModalProjectView(null);
        setVehicleModalEditMode(null);
        clearImageSelection();
      })}
    >
      <div
        className={`rounded-lg shadow-xl max-w-5xl w-full overflow-hidden modal-content grid ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        style={{
          gridTemplateRows: 'auto 1fr auto',
          maxHeight: vehicleModalEditMode ? '90vh' : '85vh',
          transition: 'max-height 0.7s ease-in-out'
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Dismiss any visible overlay buttons when clicking anywhere in the modal
          setSelectedDocId(null);
          setSelectedEventId(null);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className={`font-bold whitespace-nowrap overflow-hidden text-ellipsis ${
                viewingInfoEvent && isMobile ? 'text-lg' : 'text-2xl'
              } ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`} style={{
                fontFamily: "'FoundationOne', 'Courier New', monospace",
                ...(viewingInfoEvent && isMobile && viewingInfoEvent.description?.length > 25
                  ? { fontSize: 'clamp(0.875rem, 4vw, 1.125rem)' }
                  : {})
              }}>
                {vehicleModalProjectView
                  ? vehicleModalProjectView.name
                  : showAddServiceEventModal && isMobile
                    ? (editingServiceEvent ? 'Edit Service Event' : 'Add Service Event')
                    : showAddDocumentModal && isMobile
                      ? 'Add Document'
                      : viewingInfoEvent && isMobile
                        ? viewingInfoEvent.description
                        : (viewingVehicle.nickname || viewingVehicle.name || 'Vehicle Details')}
              </h2>
              {viewingInfoEvent && isMobile && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {viewingInfoEvent.event_date && new Date(viewingInfoEvent.event_date).toLocaleDateString()}
                  {viewingInfoEvent.odometer && ` • ${viewingInfoEvent.odometer.toLocaleString()} mi`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Navigation buttons - hidden on mobile, hidden in edit/project view */}
              {!vehicleModalProjectView && !vehicleModalEditMode && navigableVehicles.length > 1 && currentIndex !== -1 && (
                <div className="hidden md:flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevVehicle();
                    }}
                    disabled={!hasPrev}
                    className={`nav-btn ${darkMode ? 'dark' : 'light'}`}
                    title="Previous vehicle (←)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className={`text-xs font-medium min-w-[4rem] text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {currentIndex + 1} of {navigableVehicles.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextVehicle();
                    }}
                    disabled={!hasNext}
                    className={`nav-btn ${darkMode ? 'dark' : 'light'}`}
                    title="Next vehicle (→)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {!vehicleModalProjectView && viewingVehicle.archived && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 border border-gray-600'
                    : 'bg-gray-200 text-gray-700 border border-gray-400'
                }`}>
                  Archived
                </span>
              )}
              <button
                onClick={() => handleCloseModal(() => {
                  // Check for unsaved changes
                  if (hasUnsavedVehicleChanges()) {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Unsaved Changes',
                      message: 'You have unsaved changes. Are you sure you want to close without saving?',
                      confirmText: 'Discard',
                      cancelText: 'Go Back',
                      onConfirm: () => {
                        setShowVehicleDetailModal(false);
                        setViewingVehicle(null);
                        setOriginalVehicleData(null);
                        setVehicleModalProjectView(null);
                        setVehicleModalEditMode(null);
                        clearImageSelection();
                      }
                    });
                    return;
                  }
                  setShowVehicleDetailModal(false);
                  setViewingVehicle(null);
                  setOriginalVehicleData(null);
                  setVehicleModalProjectView(null);
                  setVehicleModalEditMode(null);
                  clearImageSelection();
                })}
                className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - with slide animation */}
        <div className="relative min-h-[calc(90vh-180px)]">
          {/* Vehicle Details View */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              vehicleModalProjectView || vehicleModalEditMode || ((showAddServiceEventModal || showAddDocumentModal || viewingInfoEvent) && isMobile)
                ? 'absolute opacity-0 pointer-events-none'
                : 'relative opacity-100'
            }`}
          >
            <div
              key={viewingVehicle.id}
              className="p-6 pb-12 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto animate-fade-in"
            >
              {/* Top Section: Image (3/5) and Basic Info (2/5) side by side */}
              <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 md:items-start">
                {/* Basic Info Card - 2/5 width on desktop, aspect ratio calculated to match image height */}
                <div className={`order-last rounded-lg p-6 md:aspect-[8/9] ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      Basic Info
                    </h3>
                    {(() => {
                      const vehicleProjects = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                      // Count parts linked through projects
                      const projectLinkedPartsCount = vehicleProjects.reduce((count, project) => {
                        return count + parts.filter(part => part.projectId === project.id).length;
                      }, 0);
                      // Count parts directly linked to vehicle (not through a project)
                      const directlyLinkedPartsCount = parts.filter(part =>
                        part.vehicleId === viewingVehicle.id && !part.projectId
                      ).length;
                      const linkedPartsCount = projectLinkedPartsCount + directlyLinkedPartsCount;
                      return (vehicleProjects.length > 0 || linkedPartsCount > 0) && (
                        <div className={`flex items-center gap-3 text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {vehicleProjects.length > 0 && (
                            <span className="flex items-center gap-1">
                              <ListChecks className="w-3.5 h-3.5" />
                              {vehicleProjects.length}
                            </span>
                          )}
                          {linkedPartsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Package className="w-3.5 h-3.5" />
                              {linkedPartsCount}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {viewingVehicle.year && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Year</p>
                          <p className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>{viewingVehicle.year}</p>
                        </div>
                      )}
                      {viewingVehicle.make && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Make</p>
                          <p className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>{viewingVehicle.make}</p>
                        </div>
                      )}
                      {viewingVehicle.name && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Model</p>
                          <p className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>{viewingVehicle.name}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {viewingVehicle.license_plate && (
                        <div>
                          <p className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>License Plate</p>
                          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                            darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {viewingVehicle.license_plate}
                          </span>
                        </div>
                      )}
                      {viewingVehicle.vin && (
                        <div>
                          <p className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>VIN</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-900'
                          }`}>
                            {viewingVehicle.vin}
                          </span>
                        </div>
                      )}
                      {viewingVehicle.odometer_range && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Odometer Range</p>
                          <p className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>
                            ~{parseInt(viewingVehicle.odometer_range).toLocaleString()} {viewingVehicle.odometer_unit === 'mi' ? 'miles' : 'km'}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Budget Progress for Linked Projects */}
                    {(() => {
                      const vehicleProjects = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                      const totalSpent = calculateVehicleTotalSpent(viewingVehicle.id, projects, parts, serviceEvents);
                      const totalBudget = vehicleProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
                      const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                      return (
                        <div className={`col-span-2 pt-4 mt-4 border-t ${
                          darkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <p className={`text-sm font-semibold mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-slate-700'
                          }`}>Projects Budget</p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              <span className={
                                progress > 90
                                  ? (darkMode ? 'text-red-400' : 'text-red-600')
                                  : progress > 70
                                  ? (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                                  : (darkMode ? 'text-green-400' : 'text-green-600')
                              }>
                                ${totalSpent.toFixed(2)}
                              </span>
                              <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>
                                {' '}/ ${Math.round(totalBudget)}
                              </span>
                            </span>
                            <span className={`text-sm font-bold ${
                              darkMode ? 'text-gray-200' : 'text-gray-900'
                            }`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-4 ${
                            darkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <div
                              className={`h-4 rounded-full transition-all ${
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
                      );
                    })()}
                  </div>
                </div>
                {/* Vehicle Image Gallery - Half width on desktop - appears first */}
                {(() => {
                  const rawImages = viewingVehicle.images_resolved || [];
                  // Sort images so primary is always first
                  const images = [...rawImages].sort((a, b) => {
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return 0;
                  });
                  const hasImages = images.length > 0;
                  const hasMultipleImages = images.length > 1;
                  const safeIndex = Math.min(currentImageIndex, images.length - 1);
                  const currentImage = hasImages ? images[Math.max(0, safeIndex)] : null;

                  if (!hasImages) {
                    return (
                      <div className={`order-first rounded-lg border min-h-[300px] flex flex-col items-center justify-center ${
                        darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Camera className={`w-12 h-12 mx-auto mb-2 opacity-40 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          No image
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      className="order-first rounded-lg overflow-hidden relative group touch-pan-y aspect-[4/3]"
                      onTouchStart={(e) => {
                        if (!hasMultipleImages) return;
                        const touch = e.touches[0];
                        e.currentTarget.dataset.touchStartX = touch.clientX;
                      }}
                      onTouchEnd={(e) => {
                        if (!hasMultipleImages) return;
                        const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX);
                        const touchEndX = e.changedTouches[0].clientX;
                        const diff = touchStartX - touchEndX;
                        // Swipe threshold of 50px
                        if (Math.abs(diff) > 50) {
                          if (diff > 0) {
                            // Swipe left - next image (slide from right)
                            setSlideDirection('left');
                            setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                          } else {
                            // Swipe right - previous image (slide from left)
                            setSlideDirection('right');
                            setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                          }
                        }
                      }}
                    >
                      <FadeInImage
                        key={`${viewingVehicle.id}-${safeIndex}`}
                        src={currentImage.url}
                        alt={viewingVehicle.nickname || viewingVehicle.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover ${
                          slideDirection === 'left' ? 'slide-in-right' :
                          slideDirection === 'right' ? 'slide-in-left' : ''
                        }`}
                      />
                      {/* Navigation arrows - visible on mobile, hover on desktop */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={() => {
                              setSlideDirection('right');
                              setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            title="Previous image"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSlideDirection('left');
                              setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/70"
                            title="Next image"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          {/* Image indicators - larger touch targets on mobile */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 md:gap-1.5">
                            {images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  // Determine slide direction based on index difference
                                  if (idx > safeIndex) {
                                    setSlideDirection('left');
                                  } else if (idx < safeIndex) {
                                    setSlideDirection('right');
                                  }
                                  setCurrentImageIndex(idx);
                                }}
                                className={`rounded-full transition-all ${
                                  idx === safeIndex
                                    ? 'bg-white w-6 h-3 md:w-4 md:h-2'
                                    : 'bg-white/50 hover:bg-white/75 w-3 h-3 md:w-2 md:h-2'
                                }`}
                                title={img.isPrimary ? 'Primary image' : `Image ${idx + 1}`}
                              />
                            ))}
                          </div>
                          {/* Image counter */}
                          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/50 text-white text-xs">
                            {safeIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                      {/* Primary indicator */}
                      {currentImage.isPrimary && hasMultipleImages && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium">
                          Primary
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Service History and Maintenance - Side by side on desktop */}
              <div className={`pt-6 border-t grid grid-cols-1 md:grid-cols-[2fr_minmax(250px,3fr)] gap-6 ${
                darkMode ? 'border-gray-700' : 'border-slate-200'
              }`}>
                {/* Service Events Timeline Section */}
                <div className="order-2 md:order-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Service History
                  </h3>
                  {(() => {
                    const servicePartsTotal = calculateServicePartsTotal(viewingVehicle.id, parts, serviceEvents);
                    if (servicePartsTotal === 0) return null;
                    return (
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
                        darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        <Wrench className="w-3 h-3" />
                        ${servicePartsTotal.toFixed(2)}
                      </span>
                    );
                  })()}
                </div>
                <div className={`relative ${!loadingServiceEvents ? 'animate-fade-in' : ''}`} onClick={() => setSelectedEventId(null)}>
                    {/* Show more/less toggle button */}
                    {serviceEventsHiddenCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (serviceHistoryExpanded) {
                            // Collapsing: trigger animation first, then collapse after delay
                            setIsServiceHistoryCollapsing(true);
                            setTimeout(() => {
                              setServiceHistoryExpanded(false);
                              setIsServiceHistoryCollapsing(false);
                            }, 250);
                          } else {
                            // Expanding: just expand (animation handled via CSS class)
                            setServiceHistoryExpanded(true);
                          }
                        }}
                        className={`flex items-center gap-1 text-sm font-medium mb-2 ${
                          darkMode
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        {serviceHistoryExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show {serviceEventsHiddenCount} more
                          </>
                        )}
                      </button>
                    )}

                    {/* Service events container */}
                    <div className="flex flex-col gap-4">
                      {/* Show last 3 events when collapsed, all when expanded */}
                      {(serviceHistoryExpanded ? sortedServiceEvents : sortedServiceEvents.slice(-3)).map((event, index, arr) => {
                        const eventDate = new Date(event.event_date + 'T00:00:00');
                        const formattedDate = eventDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const isLast = index === arr.length - 1;

                        // Determine if this is a "hidden" event (not shown when collapsed)
                        const hiddenEventCount = sortedServiceEvents.length - 3;
                        const isHiddenEvent = serviceHistoryExpanded && index < hiddenEventCount;

                        // Calculate mileage difference from previous event (chronologically) with same description
                        let mileageDiff = null;
                        if (event.odometer) {
                          const chronologicalIndex = sortedServiceEvents.findIndex(e => e.id === event.id);
                          const previousSameEvent = sortedServiceEvents
                            .slice(0, chronologicalIndex)
                            .filter(e => e.description.toLowerCase() === event.description.toLowerCase() && e.odometer)
                            .pop();
                          if (previousSameEvent) {
                            mileageDiff = event.odometer - previousSameEvent.odometer;
                          }
                        }

                        // Apply animation class for hidden events during expand/collapse
                        const animationClass = isHiddenEvent
                          ? (isServiceHistoryCollapsing ? 'service-history-collapse' : 'service-history-expand')
                          : '';

                        return (
                          <div
                            key={event.id}
                            className={`relative flex items-stretch gap-4 group cursor-pointer ${animationClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventId(selectedEventId === event.id ? null : event.id);
                            }}
                          >
                            {/* Timeline column with icon and line */}
                            <div className="relative flex flex-col items-center">
                              {/* Timeline dot */}
                              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                darkMode
                                  ? `border-2 border-gray-600 ${selectedEventId !== event.id ? 'can-hover:group-hover:border-orange-500' : ''}`
                                  : `border-2 border-gray-300 ${selectedEventId !== event.id ? 'can-hover:group-hover:border-orange-500' : ''}`
                              }`}>
                                <Wrench className={`w-4 h-4 transition-colors ${
                                  darkMode
                                    ? `text-gray-400 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-orange-500' : ''}`
                                    : `text-gray-500 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-orange-500' : ''}`
                                }`} />
                              </div>
                              {/* Line extending down - mb-[-16px] extends into the gap to reach next icon */}
                              <div
                                className={`flex-1 w-0.5 -mb-4 ${
                                  isLast
                                    ? (darkMode ? 'border-l-2 border-dashed border-gray-600 bg-transparent' : 'border-l-2 border-dashed border-gray-300 bg-transparent')
                                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                                }`}
                              />
                            </div>

                            {/* Event content */}
                            <div className="flex-1 min-w-0 pb-0">
                              <div className={`relative rounded-lg p-3 border transition-colors ${
                                darkMode
                                  ? `bg-gray-700/50 border-gray-600 ${selectedEventId !== event.id ? 'can-hover:group-hover:border-white' : ''}`
                                  : `bg-gray-50 border-gray-200 ${selectedEventId !== event.id ? 'can-hover:group-hover:border-gray-400' : ''}`
                              }`}>
                                {/* Indicators for notes and linked parts */}
                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                  {event.linked_part_ids && event.linked_part_ids.length > 0 && (
                                    <Package className={`w-3.5 h-3.5 transition-colors ${
                                      darkMode
                                        ? `text-gray-500 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-gray-300' : ''}`
                                        : `text-gray-400 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-gray-600' : ''}`
                                    }`} />
                                  )}
                                  {event.notes && (
                                    <FileText className={`w-3.5 h-3.5 transition-colors ${
                                      darkMode
                                        ? `text-gray-500 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-gray-300' : ''}`
                                        : `text-gray-400 ${selectedEventId !== event.id ? 'can-hover:group-hover:text-gray-600' : ''}`
                                    }`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    {event.description}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${
                                      darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      <Calendar className="w-3 h-3 flex-shrink-0" />
                                      {formattedDate}
                                    </span>
                                    {event.odometer && (
                                      <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        <Gauge className="w-3 h-3 flex-shrink-0" />
                                        {event.odometer.toLocaleString()}{viewingVehicle.odometer_unit ? ` ${viewingVehicle.odometer_unit}` : ''}
                                        {mileageDiff !== null && (
                                          <span className={`${
                                            darkMode ? 'text-gray-500' : 'text-gray-400'
                                          }`}>
                                            (+{mileageDiff.toLocaleString()})
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Action overlay with fade animation */}
                                <div
                                  className={`absolute inset-0 rounded-lg flex items-center justify-center gap-3 transition-opacity duration-150 ${
                                    selectedEventId === event.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                  } ${darkMode ? 'bg-gray-800/95' : 'bg-gray-100/95'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventId(null);
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedEventId(null);
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Delete Service Event',
                                        message: `Are you sure you want to delete "${event.description}"? This action cannot be undone.`,
                                        confirmText: 'Delete',
                                        onConfirm: () => deleteServiceEvent(event.id)
                                      });
                                    }}
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                                      darkMode
                                        ? 'bg-gray-700 text-red-400 can-hover:hover:ring-2 can-hover:hover:ring-red-400'
                                        : 'bg-white text-red-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-red-600'
                                    }`}
                                  >
                                    <Trash2 className="w-5 h-5 mb-0.5" />
                                    <span className="text-[10px] font-medium">Delete</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEventId(null);
                                      openEditServiceEventModal(event);
                                    }}
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                                      darkMode
                                        ? 'bg-gray-700 text-blue-400 can-hover:hover:ring-2 can-hover:hover:ring-blue-400'
                                        : 'bg-white text-blue-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-blue-600'
                                    }`}
                                  >
                                    <Edit2 className="w-5 h-5 mb-0.5" />
                                    <span className="text-[10px] font-medium">Edit</span>
                                  </button>
                                  {(event.notes || (event.linked_part_ids && event.linked_part_ids.length > 0)) && (
                                    <button
                                      onClick={() => {
                                        setSelectedEventId(null);
                                        setViewingInfoEvent(event);
                                      }}
                                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                                        darkMode
                                          ? 'bg-gray-700 text-yellow-400 can-hover:hover:ring-2 can-hover:hover:ring-yellow-400'
                                          : 'bg-white text-yellow-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-yellow-600'
                                      }`}
                                    >
                                      <Info className="w-5 h-5 mb-0.5" />
                                      <span className="text-[10px] font-medium">Info</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })}

                      {/* Add service event card */}
                      <div
                        onClick={openAddServiceEventModal}
                        className="relative flex items-stretch gap-4 cursor-pointer group"
                      >
                        <div className="relative flex flex-col items-center">
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed ${
                            darkMode
                              ? 'bg-gray-800 border-gray-600 can-hover:group-hover:border-blue-500'
                              : 'bg-slate-200 border-gray-300 can-hover:group-hover:border-blue-500'
                          } transition-colors`}>
                            <Plus className={`w-4 h-4 ${
                              darkMode ? 'text-gray-500 can-hover:group-hover:text-blue-400' : 'text-gray-400 can-hover:group-hover:text-blue-600'
                            } transition-colors`} />
                          </div>
                        </div>
                        <div className={`flex-1 rounded-lg p-3 border-2 border-dashed transition-all ${
                          darkMode
                            ? 'border-gray-600 can-hover:group-hover:border-blue-500 can-hover:group-hover:bg-gray-700/30'
                            : 'border-gray-300 can-hover:group-hover:border-blue-500 can-hover:group-hover:bg-blue-50/30'
                        }`}>
                          <p className={`text-sm font-medium ${
                            darkMode ? 'text-gray-400 can-hover:group-hover:text-gray-200' : 'text-gray-500 can-hover:group-hover:text-gray-700'
                          } transition-colors`}>
                            Add service event
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            Track maintenance and repairs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Add Service Event Modal - Desktop only (mobile uses inline form) */}
                <AddServiceEventModal
                  isOpen={showAddServiceEventModal && !isMobile}
                  onClose={handleCloseServiceEventModal}
                  darkMode={darkMode}
                  eventDate={newEventDate}
                  setEventDate={setNewEventDate}
                  description={newEventDescription}
                  setDescription={setNewEventDescription}
                  odometer={newEventOdometer}
                  setOdometer={setNewEventOdometer}
                  notes={newEventNotes}
                  setNotes={setNewEventNotes}
                  linkedPartIds={newEventLinkedParts}
                  setLinkedPartIds={setNewEventLinkedParts}
                  parts={parts}
                  vendorColors={vendorColors}
                  editingEvent={editingServiceEvent}
                  onSave={async () => {
                    if (editingServiceEvent) {
                      const result = await updateServiceEvent(editingServiceEvent.id, {
                        event_date: newEventDate,
                        description: newEventDescription.trim(),
                        odometer: newEventOdometer ? parseInt(newEventOdometer, 10) : null,
                        notes: newEventNotes.trim() || null,
                        linked_part_ids: newEventLinkedParts.length > 0 ? newEventLinkedParts : null
                      });
                      return result;
                    } else {
                      const result = await addServiceEvent(
                        viewingVehicle.id,
                        newEventDate,
                        newEventDescription,
                        newEventOdometer,
                        newEventNotes,
                        newEventLinkedParts
                      );
                      return result;
                    }
                  }}
                  onDelete={editingServiceEvent ? () => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Delete Service Event',
                      message: `Are you sure you want to delete "${editingServiceEvent.description}"? This action cannot be undone.`,
                      confirmText: 'Delete',
                      onConfirm: () => deleteServiceEvent(editingServiceEvent.id)
                    });
                  } : null}
                  saving={savingServiceEvent}
                />
                </div>

                {/* Maintenance Section (includes filters, oil, battery) */}
                <div className="order-1 md:order-1">
                  <h3 className={`text-lg font-semibold mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Maintenance
                </h3>
                {(viewingVehicle.fuel_filter || viewingVehicle.air_filter || viewingVehicle.oil_filter || viewingVehicle.oil_type || viewingVehicle.oil_capacity || viewingVehicle.oil_brand || viewingVehicle.drain_plug || viewingVehicle.battery) ? (
                  <div className="grid grid-cols-2 gap-4 px-4">
                    {/* Mobile two-column layout: Left (fuel filter, air filter, battery, drain plug) | Right (oil filter, oil capacity, oil type, oil brand) */}
                    {viewingVehicle.fuel_filter && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Fuel Filter</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.fuel_filter}</p>
                      </div>
                    )}
                    {viewingVehicle.oil_filter && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Oil Filter</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.oil_filter}</p>
                      </div>
                    )}
                    {viewingVehicle.air_filter && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Air Filter</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.air_filter}</p>
                      </div>
                    )}
                    {viewingVehicle.oil_capacity && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Oil Capacity</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.oil_capacity}</p>
                      </div>
                    )}
                    {viewingVehicle.battery && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Battery</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.battery}</p>
                      </div>
                    )}
                    {viewingVehicle.oil_type && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Oil Type</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.oil_type}</p>
                      </div>
                    )}
                    {viewingVehicle.drain_plug && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Drain Plug</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.drain_plug}</p>
                      </div>
                    )}
                    {viewingVehicle.oil_brand && (
                      <div>
                        <p className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Oil Brand</p>
                        <p className={`text-base ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{viewingVehicle.oil_brand}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-8 rounded-lg border ${
                    darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    <Gauge className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      No maintenance information added yet
                    </p>
                  </div>
                )}
                </div>
              </div>

              {/* Documents Section */}
              <div className={`pt-6 border-t ${
                darkMode ? 'border-gray-700' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Documents
                  </h3>
                </div>
                <div
                    className={`grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 ${!loadingDocuments ? 'animate-fade-in' : ''}`}
                    onClick={() => setSelectedDocId(null)}
                  >
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`group relative rounded-lg p-3 border cursor-pointer transition-colors ${
                          darkMode
                            ? `bg-gray-700 border-gray-600 ${selectedDocId !== doc.id ? 'can-hover:hover:border-white' : ''}`
                            : `bg-gray-50 border-gray-200 ${selectedDocId !== doc.id ? 'can-hover:hover:border-gray-400' : ''}`
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocId(selectedDocId === doc.id ? null : doc.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className={`w-8 h-8 flex-shrink-0 transition-colors ${
                            darkMode
                              ? `text-blue-400 ${selectedDocId !== doc.id ? 'can-hover:group-hover:text-blue-300' : ''}`
                              : `text-blue-600 ${selectedDocId !== doc.id ? 'can-hover:group-hover:text-blue-700' : ''}`
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium line-clamp-2 md:truncate ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`} title={doc.title}>
                              {doc.title}
                            </p>
                            <p className={`text-xs truncate ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`} title={doc.file_name}>
                              {doc.file_name}
                            </p>
                          </div>
                        </div>
                        {/* Action overlay with fade animation */}
                        <div
                          className={`absolute inset-0 rounded-lg flex items-center justify-center gap-3 transition-opacity duration-150 ${
                            selectedDocId === doc.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          } ${darkMode ? 'bg-gray-800/95' : 'bg-gray-100/95'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(null);
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedDocId(null);
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Delete Document',
                                message: `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
                                confirmText: 'Delete',
                                onConfirm: () => deleteDocument(doc.id, doc.file_url)
                              });
                            }}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                              darkMode
                                ? 'bg-gray-700 text-red-400 can-hover:hover:ring-2 can-hover:hover:ring-red-400'
                                : 'bg-white text-red-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-red-600'
                            }`}
                          >
                            <Trash2 className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-medium">Delete</span>
                          </button>
                          <button
                            onClick={() => {
                              openDocument(doc);
                              setSelectedDocId(null);
                            }}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                              darkMode
                                ? 'bg-gray-700 text-blue-400 can-hover:hover:ring-2 can-hover:hover:ring-blue-400'
                                : 'bg-white text-blue-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-blue-600'
                            }`}
                          >
                            <ExternalLink className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-medium">Open</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Add new document card */}
                    <div
                      onClick={() => setShowAddDocumentModal(true)}
                      className={`group relative rounded-lg p-3 border-2 border-dashed transition-all cursor-pointer can-hover:hover:shadow-md ${
                        darkMode
                          ? 'border-gray-600 can-hover:hover:border-blue-500 can-hover:hover:bg-gray-700/50'
                          : 'border-gray-300 can-hover:hover:border-blue-500 can-hover:hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Plus className={`w-8 h-8 flex-shrink-0 ${
                          darkMode ? 'text-gray-500 can-hover:group-hover:text-blue-400' : 'text-gray-400 can-hover:group-hover:text-blue-600'
                        } transition-colors`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            darkMode ? 'text-gray-400 can-hover:group-hover:text-gray-200' : 'text-gray-500 can-hover:group-hover:text-gray-700'
                          } transition-colors`}>
                            Add document
                          </p>
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            Click to upload
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Add Document Modal - Desktop only (mobile uses inline form) */}
                <AddDocumentModal
                  isOpen={showAddDocumentModal && !isMobile}
                  onClose={() => setShowAddDocumentModal(false)}
                  darkMode={darkMode}
                  newDocumentTitle={newDocumentTitle}
                  setNewDocumentTitle={setNewDocumentTitle}
                  newDocumentFile={newDocumentFile}
                  setNewDocumentFile={setNewDocumentFile}
                  onUpload={async () => {
                    const result = await addDocument(
                      viewingVehicle.id,
                      newDocumentTitle.trim(),
                      newDocumentFile
                    );
                    return result;
                  }}
                  uploading={uploadingDocument}
                  handleDocumentFileChange={handleDocumentFileChange}
                  isDraggingDocument={isDraggingDocument}
                  handleDocumentDragEnter={handleDocumentDragEnter}
                  handleDocumentDragLeave={handleDocumentDragLeave}
                  handleDocumentDragOver={handleDocumentDragOver}
                  handleDocumentDrop={handleDocumentDrop}
                />
              </div>

              {/* Projects Section */}
              {(() => {
                const vehicleProjects = getVehicleProjects(viewingVehicle.id);
                return (
                  <div className={`pt-6 border-t ${
                    darkMode ? 'border-gray-700' : 'border-slate-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-5 h-5" />
                        <span>Projects</span>
                      </div>
                    </h3>
                    {vehicleProjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {vehicleProjects.map((project) => {
                          const projectParts = parts.filter(p => p.projectId === project.id);
                          const projectTotal = projectParts.reduce((sum, part) => sum + part.total, 0);
                          const completedTodos = project.todos ? project.todos.filter(t => t.completed).length : 0;
                          const uncompletedTodos = project.todos ? project.todos.filter(t => !t.completed).length : 0;

                          return (
                            <button
                              key={project.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVehicleModalProjectView(project);
                              }}
                              className={`flex flex-col rounded-lg p-4 border-l-4 text-left transition-all duration-200 cursor-pointer can-hover:hover:shadow-2xl can-hover:hover:scale-[1.03] ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}
                              style={{ borderLeftColor: getPriorityBorderColor(project.priority) }}
                            >
                              <h4 className={`font-semibold mb-2 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {project.name}
                              </h4>
                              <p className={`text-sm mb-3 line-clamp-3 overflow-hidden ${
                                project.description
                                  ? (darkMode ? 'text-gray-400' : 'text-slate-600')
                                  : (darkMode ? 'text-gray-500 italic' : 'text-gray-500 italic')
                              }`}
                              style={{ height: '3.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {project.description || 'No description added'}
                              </p>
                              <div className="flex flex-wrap gap-4 text-xs mt-auto">
                                <div className="flex items-center gap-1">
                                  <Package className={`w-3 h-3 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                  }`} />
                                  <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                    {projectParts.length} parts
                                  </span>
                                </div>
                                <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                <div className="flex items-center gap-1">
                                  <BadgeDollarSign className={`w-3 h-3 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-400'
                                  }`} />
                                  <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                    ${projectTotal.toFixed(2)}
                                  </span>
                                </div>
                                {project.todos && project.todos.length > 0 && (
                                  <>
                                    <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className={`w-3 h-3 ${
                                          darkMode ? 'text-green-400' : 'text-green-600'
                                        }`} />
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                          {completedTodos}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className={`w-3 h-3 ${
                                          darkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`} />
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                          {uncompletedTodos}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`text-center py-8 rounded-lg border ${
                        darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        <ListChecks className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">
                          No projects linked
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Project Details View - Slides in from right */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              vehicleModalProjectView && !vehicleModalEditMode
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {vehicleModalProjectView && !vehicleModalEditMode && (
              <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                <ProjectDetailView
                  project={vehicleModalProjectView}
                  parts={parts}
                  darkMode={darkMode}
                  updateProject={(projectId, updates) => {
                    // Optimistic update: update vehicleModalProjectView immediately for snappy UI
                    setVehicleModalProjectView(prev => ({ ...prev, ...updates }));
                    // Persist to database in background (hook handles optimistic update on projects array)
                    updateProject(projectId, updates);
                  }}
                  getStatusColors={getStatusColors}
                  getPriorityColors={getPriorityColors}
                  getStatusText={getStatusText}
                  getStatusTextColor={getStatusTextColor}
                  getVendorColor={getVendorColor}
                  vendorColors={vendorColors}
                  calculateProjectTotal={calculateProjectTotal}
                  editingTodoId={editingTodoId}
                  setEditingTodoId={setEditingTodoId}
                  editingTodoText={editingTodoText}
                  setEditingTodoText={setEditingTodoText}
                  newTodoText={newTodoText}
                  setNewTodoText={setNewTodoText}
                />
              </div>
            )}
          </div>

          {/* Edit Project View - Slides in for editing */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              vehicleModalEditMode === 'project'
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {vehicleModalProjectView && (
              <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                <ProjectEditForm
                  project={vehicleModalProjectView}
                  onProjectChange={setVehicleModalProjectView}
                  vehicles={vehicles}
                  parts={parts}
                  unlinkPartFromProject={unlinkPartFromProject}
                  getVendorColor={getVendorColor}
                  vendorColors={vendorColors}
                  darkMode={darkMode}
                />

                <LinkedPartsSection
                  projectId={vehicleModalProjectView.id}
                  parts={parts}
                  unlinkPartFromProject={unlinkPartFromProject}
                  getVendorColor={getVendorColor}
                  vendorColors={vendorColors}
                  darkMode={darkMode}
                  setConfirmDialog={setConfirmDialog}
                />
              </div>
            )}
          </div>

          {/* Edit Vehicle View - Slides in for editing */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              vehicleModalEditMode === 'vehicle'
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {viewingVehicle && (
              <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information - Right on desktop */}
                  <div className="order-last space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Nickname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={viewingVehicle.nickname || ''}
                        onChange={(e) => setViewingVehicle({ ...viewingVehicle, nickname: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="e.g. Blue Beast"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Vehicle Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={viewingVehicle.color || '#3B82F6'}
                            onChange={(e) => setViewingVehicle({ ...viewingVehicle, color: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer border-2 border-gray-300"
                          />
                          <span className={`text-sm font-mono ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>{viewingVehicle.color || '#3B82F6'}</span>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Year
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={viewingVehicle.year || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, year: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. 1995"
                          min="1900"
                          max="2100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Make
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.make || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, make: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. Toyota"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Model
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.name}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, name: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. Supra"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          License Plate
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.license_plate || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, license_plate: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. ABC-1234"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          VIN
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.vin || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, vin: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. JT2JA82J..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Odometer Range
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={viewingVehicle.odometer_range || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, odometer_range: e.target.value })}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const rounded = Math.round(value / 10000) * 10000;
                            setViewingVehicle({ ...viewingVehicle, odometer_range: rounded || '' });
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. 150000"
                          min="0"
                          step="10000"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Unit
                        </label>
                        <select
                          value={viewingVehicle.odometer_unit || 'km'}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, odometer_unit: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100'
                              : 'bg-slate-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="km">Kilometers</option>
                          <option value="mi">Miles</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Image Upload - Left on desktop */}
                  <div className="order-first space-y-4 flex flex-col">
                    <div className="flex flex-col flex-1">
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Vehicle Images
                        <span className={`ml-2 text-xs font-normal ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          ({(viewingVehicle.images_resolved?.length || 0) + vehicleImageFiles.length} / {MAX_VEHICLE_IMAGES})
                        </span>
                      </label>

                      {/* Combined Images Grid - existing and new images together */}
                      {((viewingVehicle.images_resolved?.length || 0) + vehicleImageFiles.length > 0) && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {/* Existing Images */}
                          {viewingVehicle.images_resolved?.map((img, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <div className="aspect-square">
                                <FadeInImage
                                  src={img.url}
                                  alt={`Vehicle image ${index + 1}`}
                                  className={`w-full h-full object-cover rounded-t-lg md:rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                  }`}
                                />
                              </div>
                              {/* Primary badge */}
                              {img.isPrimary && (
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
                                  Primary
                                </div>
                              )}
                              {/* Action buttons - always visible on mobile, hover on desktop */}
                              {/* Mobile: bottom bar */}
                              <div className={`md:hidden flex rounded-b-lg overflow-hidden ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                {!img.isPrimary && (
                                  <button
                                    onClick={() => {
                                      const updatedImages = viewingVehicle.images_resolved.map((i, idx) => ({
                                        ...i,
                                        isPrimary: idx === index
                                      }));
                                      setViewingVehicle({
                                        ...viewingVehicle,
                                        images_resolved: updatedImages,
                                        images: viewingVehicle.images?.map((i, idx) => ({
                                          ...i,
                                          isPrimary: idx === index
                                        }))
                                      });
                                      // Clear primary from new images
                                      setVehicleImageFiles(prev => prev.map(img => ({ ...img, isPrimary: false })));
                                    }}
                                    className={`flex-1 py-2 text-xs font-medium ${
                                      darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                    }`}
                                  >
                                    Set Primary
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const wasPrimary = img.isPrimary;
                                    const updatedImages = viewingVehicle.images_resolved.filter((_, idx) => idx !== index);
                                    const updatedDbImages = viewingVehicle.images?.filter((_, idx) => idx !== index);
                                    if (wasPrimary && updatedImages.length > 0) {
                                      updatedImages[0].isPrimary = true;
                                      if (updatedDbImages && updatedDbImages.length > 0) {
                                        updatedDbImages[0].isPrimary = true;
                                      }
                                    }
                                    setViewingVehicle({
                                      ...viewingVehicle,
                                      images_resolved: updatedImages,
                                      images: updatedDbImages,
                                      image_url: updatedImages.length > 0 ? viewingVehicle.image_url : '',
                                      image_url_resolved: updatedImages.length > 0 ? viewingVehicle.image_url_resolved : ''
                                    });
                                  }}
                                  className={`flex-1 py-2 text-xs font-medium ${
                                    darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                                  }`}
                                >
                                  Remove
                                </button>
                              </div>
                              {/* Desktop: hover overlay */}
                              <div className="hidden md:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg items-center justify-center gap-2">
                                {!img.isPrimary && (
                                  <button
                                    onClick={() => {
                                      const updatedImages = viewingVehicle.images_resolved.map((i, idx) => ({
                                        ...i,
                                        isPrimary: idx === index
                                      }));
                                      setViewingVehicle({
                                        ...viewingVehicle,
                                        images_resolved: updatedImages,
                                        images: viewingVehicle.images?.map((i, idx) => ({
                                          ...i,
                                          isPrimary: idx === index
                                        }))
                                      });
                                      // Clear primary from new images
                                      setVehicleImageFiles(prev => prev.map(img => ({ ...img, isPrimary: false })));
                                    }}
                                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    title="Set as primary"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const wasPrimary = img.isPrimary;
                                    const updatedImages = viewingVehicle.images_resolved.filter((_, idx) => idx !== index);
                                    const updatedDbImages = viewingVehicle.images?.filter((_, idx) => idx !== index);
                                    if (wasPrimary && updatedImages.length > 0) {
                                      updatedImages[0].isPrimary = true;
                                      if (updatedDbImages && updatedDbImages.length > 0) {
                                        updatedDbImages[0].isPrimary = true;
                                      }
                                    }
                                    setViewingVehicle({
                                      ...viewingVehicle,
                                      images_resolved: updatedImages,
                                      images: updatedDbImages,
                                      image_url: updatedImages.length > 0 ? viewingVehicle.image_url : '',
                                      image_url_resolved: updatedImages.length > 0 ? viewingVehicle.image_url_resolved : ''
                                    });
                                  }}
                                  className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                                  title="Remove image"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* New Images to Upload */}
                          {vehicleImageFiles.map((imgFile, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <div className="aspect-square">
                                <FadeInImage
                                  src={imgFile.preview}
                                  alt={`New image ${index + 1}`}
                                  className={`w-full h-full object-cover rounded-t-lg md:rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                  }`}
                                />
                              </div>
                              {/* New badge */}
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-green-600 text-white text-xs font-medium">
                                New
                              </div>
                              {/* Primary badge for new images */}
                              {imgFile.isPrimary && (
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
                                  Primary
                                </div>
                              )}
                              {/* Mobile: bottom bar */}
                              <div className={`md:hidden flex rounded-b-lg overflow-hidden ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                                {!imgFile.isPrimary && (
                                  <button
                                    onClick={() => {
                                      // Unset primary from existing images
                                      if (viewingVehicle.images_resolved?.length > 0) {
                                        setViewingVehicle({
                                          ...viewingVehicle,
                                          images_resolved: viewingVehicle.images_resolved.map(img => ({ ...img, isPrimary: false })),
                                          images: viewingVehicle.images?.map(img => ({ ...img, isPrimary: false }))
                                        });
                                      }
                                      setPrimaryImageFile(index);
                                    }}
                                    className={`flex-1 py-2 text-xs font-medium ${
                                      darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                    }`}
                                  >
                                    Set Primary
                                  </button>
                                )}
                                <button
                                  onClick={() => removeImageFile(index)}
                                  className={`flex-1 py-2 text-xs font-medium ${
                                    darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                                  }`}
                                >
                                  Remove
                                </button>
                              </div>
                              {/* Desktop: hover overlay */}
                              <div className="hidden md:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg items-center justify-center gap-2">
                                {!imgFile.isPrimary && (
                                  <button
                                    onClick={() => {
                                      // Unset primary from existing images
                                      if (viewingVehicle.images_resolved?.length > 0) {
                                        setViewingVehicle({
                                          ...viewingVehicle,
                                          images_resolved: viewingVehicle.images_resolved.map(img => ({ ...img, isPrimary: false })),
                                          images: viewingVehicle.images?.map(img => ({ ...img, isPrimary: false }))
                                        });
                                      }
                                      setPrimaryImageFile(index);
                                    }}
                                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                    title="Set as primary"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => removeImageFile(index)}
                                  className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                                  title="Remove image"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Button - Show if under limit */}
                      {(viewingVehicle.images_resolved?.length || 0) + vehicleImageFiles.length < MAX_VEHICLE_IMAGES && (
                        <label
                          onDragEnter={handleImageDragEnter}
                          onDragLeave={handleImageDragLeave}
                          onDragOver={handleImageDragOver}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file) {
                              addImageFile(file, viewingVehicle.images_resolved || []);
                            }
                          }}
                          className={`flex flex-col items-center justify-center w-full flex-1 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                            isDraggingImage
                              ? darkMode
                                ? 'border-blue-500 bg-blue-900/20 scale-105'
                                : 'border-blue-500 bg-blue-50 scale-105'
                              : darkMode
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700'
                                : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                          }`}
                          style={{ minHeight: (viewingVehicle.images_resolved?.length || 0) + vehicleImageFiles.length === 0 ? '400px' : '120px' }}
                        >
                          <div className="flex flex-col items-center justify-center py-4">
                            <Camera className={`w-8 h-8 mb-2 ${
                              isDraggingImage
                                ? 'text-blue-500'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <p className={`mb-1 text-sm ${
                              isDraggingImage
                                ? 'text-blue-600 font-semibold'
                                : darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>
                              {isDraggingImage ? (
                                'Drop image here'
                              ) : (
                                <>
                                  <span className="font-semibold">Click to add</span> or drag and drop
                                </>
                              )}
                            </p>
                            <p className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              PNG, JPG, WEBP (MAX. 5MB each)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                addImageFile(file, viewingVehicle.images_resolved || []);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Maintenance Section - Full Width */}
                <div className="mt-6">
                  <div className={`pt-4 border-t ${
                    darkMode ? 'border-gray-700' : 'border-slate-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      Maintenance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Fuel Filter
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.fuel_filter || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, fuel_filter: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. Bosch 0450905316"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Air Filter
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.air_filter || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, air_filter: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. K&N 33-2050"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Oil Filter
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.oil_filter || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_filter: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. Mobil 1 M1-110A"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Oil Type
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.oil_type || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_type: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. 5W-30"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Oil Capacity
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.oil_capacity || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_capacity: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. 5.7L"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Oil Brand
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.oil_brand || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_brand: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. Mobil 1"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Drain Plug
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.drain_plug || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, drain_plug: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="e.g. M14x1.5"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Battery
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.battery || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, battery: e.target.value })}
                          className={inputClasses(darkMode)}
                          placeholder="e.g. Group 35, 650 CCA"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inline Service Event Form View - Mobile only */}
          <div
            className={`w-full transition-all duration-500 ease-in-out md:hidden ${
              showAddServiceEventModal && isMobile && !vehicleModalProjectView && !vehicleModalEditMode
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {showAddServiceEventModal && isMobile && (
              <div className="p-6 pb-24 space-y-4 max-h-[calc(90vh-164px)] overflow-y-auto">
                {/* Date field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className={`w-full max-w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>

                {/* Description field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="e.g., Oil change, Brake pads replaced"
                  />
                </div>

                {/* Odometer field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Odometer
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newEventOdometer}
                    onChange={(e) => setNewEventOdometer(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="e.g., 125000"
                  />
                </div>

                {/* Notes field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    value={newEventNotes}
                    onChange={(e) => setNewEventNotes(e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="Additional details, parts used, costs, etc."
                  />
                </div>

                {/* Linked Parts field */}
                <div ref={inlinePartsDropdownRef} className="relative">
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Linked Parts</span>
                    </div>
                  </label>

                  {/* Selected parts pills */}
                  {newEventLinkedParts && newEventLinkedParts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {parts.filter(part => newEventLinkedParts.includes(part.id)).map(part => {
                        const vendorColor = part.vendor && vendorColors[part.vendor];
                        const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                        return (
                          <span
                            key={part.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{part.part}</span>
                            {part.vendor && (
                              <span
                                className="opacity-70"
                                style={colors ? { color: colors.text } : undefined}
                              >
                                ({part.vendor})
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setNewEventLinkedParts(newEventLinkedParts.filter(id => id !== part.id))}
                              className={`ml-1 hover:text-red-500 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={toggleInlinePartsDropdown}
                      className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between transition-colors ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <span>{!newEventLinkedParts || newEventLinkedParts.length === 0 ? 'Select parts...' : `${newEventLinkedParts.length} part${newEventLinkedParts.length !== 1 ? 's' : ''} selected`}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showInlinePartsDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown menu - opens upward since this field is at the bottom */}
                    {showInlinePartsDropdown && (
                      <div
                        className={`absolute z-50 bottom-full mb-1 w-full max-h-64 overflow-y-auto rounded-lg border shadow-lg transition-all duration-150 ${
                          isInlineDropdownClosing
                            ? 'opacity-0 translate-y-2'
                            : 'opacity-100 translate-y-0'
                        } ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                        style={{ animation: isInlineDropdownClosing ? 'none' : 'slideUp 150ms ease-out' }}
                      >
                        {/* Search input */}
                        <div className={`sticky top-0 p-2 border-b ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}>
                          <div className="relative">
                            <input
                              type="text"
                              value={inlinePartsSearchTerm}
                              onChange={(e) => setInlinePartsSearchTerm(e.target.value)}
                              placeholder="Search parts..."
                              className={`w-full px-3 py-1.5 pr-8 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode
                                  ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400'
                                  : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                              }`}
                            />
                            {inlinePartsSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setInlinePartsSearchTerm('')}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                                  darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Parts list */}
                        {(() => {
                          const filteredParts = parts.filter(part =>
                            part.part.toLowerCase().includes(inlinePartsSearchTerm.toLowerCase()) ||
                            (part.vendor && part.vendor.toLowerCase().includes(inlinePartsSearchTerm.toLowerCase()))
                          );
                          return filteredParts.length === 0 ? (
                            <div className={`p-3 text-sm text-center ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              No parts found
                            </div>
                          ) : (
                            filteredParts.map(part => {
                              const vendorColor = part.vendor && vendorColors[part.vendor];
                              const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                              const isSelected = newEventLinkedParts && newEventLinkedParts.includes(part.id);
                              return (
                                <button
                                  key={part.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setNewEventLinkedParts(newEventLinkedParts.filter(id => id !== part.id));
                                    } else {
                                      setNewEventLinkedParts([...(newEventLinkedParts || []), part.id]);
                                    }
                                  }}
                                  className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${
                                    isSelected
                                      ? darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                                      : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-500 border-blue-500'
                                      : darkMode ? 'border-gray-500' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-medium truncate block ${
                                      darkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                      {part.part}
                                    </span>
                                    {part.vendor && (
                                      <span
                                        className="text-xs"
                                        style={colors ? { color: colors.text } : { color: darkMode ? '#9CA3AF' : '#6B7280' }}
                                      >
                                        {part.vendor}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-xs font-medium ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    ${part.total?.toFixed(2) || '0.00'}
                                  </span>
                                </button>
                              );
                            })
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inline Add Document Form View - Mobile only */}
          <div
            className={`w-full transition-all duration-500 ease-in-out md:hidden ${
              showAddDocumentModal && isMobile && !vehicleModalProjectView && !vehicleModalEditMode && !showAddServiceEventModal
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {showAddDocumentModal && isMobile && (
              <div className="p-6 pb-24 space-y-4 max-h-[calc(90vh-164px)] overflow-y-auto">
                {/* Document Title field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocumentTitle}
                    onChange={(e) => setNewDocumentTitle(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                    placeholder="e.g., Insurance Certificate"
                  />
                </div>

                {/* File field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    File <span className="text-red-500">*</span>
                  </label>
                  {newDocumentFile ? (
                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <FileText className={`w-8 h-8 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {newDocumentFile.name}
                        </p>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {(newDocumentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setNewDocumentFile(null)}
                        className={`p-1 rounded ${
                          darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      onDragEnter={handleDocumentDragEnter}
                      onDragLeave={handleDocumentDragLeave}
                      onDragOver={handleDocumentDragOver}
                      onDrop={handleDocumentDrop}
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        isDraggingDocument
                          ? darkMode
                            ? 'border-blue-400 bg-blue-900/20'
                            : 'border-blue-500 bg-blue-50'
                          : darkMode
                            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <Upload className={`w-8 h-8 mb-2 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Click to upload or drag and drop
                      </p>
                      <p className={`text-xs mt-1 ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        PDF, DOC, Images, ZIP (max 10MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                        onChange={handleDocumentFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Inline Service Event Info View - Mobile only */}
          <div
            className={`w-full transition-all duration-500 ease-in-out md:hidden ${
              viewingInfoEvent && isMobile && !vehicleModalProjectView && !vehicleModalEditMode && !showAddServiceEventModal && !showAddDocumentModal
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            {viewingInfoEvent && isMobile && (
              <div className="p-6 pb-24 space-y-5 max-h-[calc(90vh-164px)] overflow-y-auto">
                {/* Notes Section */}
                {viewingInfoEvent.notes && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Notes
                    </h4>
                    <p className={`text-sm whitespace-pre-wrap ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {viewingInfoEvent.notes}
                    </p>
                  </div>
                )}

                {/* Linked Parts Section */}
                {(() => {
                  const linkedParts = viewingInfoEvent.linked_part_ids
                    ? parts.filter(p => viewingInfoEvent.linked_part_ids.includes(p.id))
                    : [];

                  if (linkedParts.length === 0) return null;

                  return (
                    <div>
                      <h4 className={`text-sm font-semibold mb-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Linked Parts ({linkedParts.length})
                      </h4>
                      <div className="flex flex-col gap-4">
                        {linkedParts.map((part) => {
                          const vendorColor = part.vendor && vendorColors[part.vendor];
                          const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                          return (
                            <div
                              key={part.id}
                              className={`p-4 rounded-lg border flex flex-col ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${
                                    darkMode ? 'text-gray-100' : 'text-slate-800'
                                  }`}>
                                    {part.part}
                                  </h4>
                                  {part.vendor && (
                                    colors ? (
                                      <span
                                        className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                        style={{
                                          backgroundColor: colors.bg,
                                          color: colors.text,
                                          borderColor: colors.border
                                        }}
                                      >
                                        {part.vendor}
                                      </span>
                                    ) : (
                                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                        darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {part.vendor}
                                      </span>
                                    )
                                  )}
                                </div>
                                <div className={`text-xs font-medium ${getStatusTextColor(part)}`}>
                                  {getStatusText(part)}
                                </div>
                              </div>
                              {part.partNumber && part.partNumber !== '-' && (
                                <p className={`text-xs font-mono mb-3 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>
                                  Part #: {part.partNumber}
                                </p>
                              )}
                              <div className={`border-t flex-1 flex flex-col justify-end ${
                                darkMode ? 'border-gray-600' : 'border-gray-200'
                              }`}>
                                <div className="pt-3 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                      Part Price:
                                    </span>
                                    <span className={`font-medium ${
                                      darkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                      ${(part.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  {part.shipping > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                        Shipping:
                                      </span>
                                      <span className={`font-medium ${
                                        darkMode ? 'text-gray-200' : 'text-gray-800'
                                      }`}>
                                        ${part.shipping.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  {part.duties > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                        Duties:
                                      </span>
                                      <span className={`font-medium ${
                                        darkMode ? 'text-gray-200' : 'text-gray-800'
                                      }`}>
                                        ${part.duties.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`flex justify-between text-base font-bold pt-2 border-t ${
                                    darkMode ? 'border-gray-600' : 'border-gray-200'
                                  }`}>
                                    <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                                      Total:
                                    </span>
                                    <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                                      ${(part.total || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Edit Button */}
        <div className={`sticky bottom-0 z-10 border-t p-4 flex items-center justify-between ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          {vehicleModalEditMode ? (
            <div className="flex items-center justify-between sm:justify-start w-full gap-2">
              <button
                onClick={() => {
                  // Check for unsaved changes before going back
                  if (hasUnsavedVehicleChanges()) {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Unsaved Changes',
                      message: 'You have unsaved changes. Are you sure you want to go back without saving?',
                      confirmText: 'Discard',
                      cancelText: 'Keep Editing',
                      onConfirm: () => {
                        // Restore original data
                        if (originalVehicleData) {
                          setViewingVehicle({ ...originalVehicleData });
                        }
                        clearImageSelection();
                        setVehicleModalEditMode(null);
                      }
                    });
                    return;
                  }
                  setVehicleModalEditMode(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                title="Back"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="flex items-center gap-1 sm:gap-2 sm:ml-auto sm:mr-2">
                {vehicleModalEditMode === 'vehicle' && (
                  <>
                    <button
                      onClick={async () => {
                        const projectsForVehicle = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                        const projectIds = projectsForVehicle.map(p => p.id);
                        const partsForVehicle = parts.filter(part => projectIds.includes(part.projectId));
                        const hasProjects = projectsForVehicle.length > 0;
                        const hasParts = partsForVehicle.length > 0;
                        const hasDocuments = documents.length > 0;
                        let message = 'Are you sure you want to permanently delete this vehicle? This action cannot be undone.';
                        if (hasProjects || hasParts || hasDocuments) {
                          const items = [];
                          if (hasProjects) items.push(`${projectsForVehicle.length} project(s)`);
                          if (hasParts) items.push(`${partsForVehicle.length} part(s)`);
                          if (hasDocuments) items.push(`${documents.length} document(s)`);
                          message = `This vehicle has ${items.join(', ')} linked to it. Deleting it will ${hasDocuments ? 'permanently delete documents and ' : ''}unlink other items. This action cannot be undone.`;
                        }
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Delete Vehicle',
                          message: message,
                          confirmText: 'Delete',
                          onConfirm: async () => {
                            await deleteVehicle(viewingVehicle.id);
                            setViewingVehicle(null);
                            setOriginalVehicleData(null);
                            setVehicleModalEditMode(null);
                          }
                        });
                      }}
                      className={`h-10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                        darkMode
                          ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                          : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                    <button
                      onClick={async () => {
                        setConfirmDialog({
                          isOpen: true,
                          title: viewingVehicle.archived ? 'Unarchive Vehicle' : 'Archive Vehicle',
                          message: viewingVehicle.archived
                            ? 'Are you sure you want to unarchive this vehicle?'
                            : 'Are you sure you want to archive this vehicle? It will still be visible but with limited information.',
                          confirmText: viewingVehicle.archived ? 'Unarchive' : 'Archive',
                          isDangerous: false,
                          onConfirm: async () => {
                            // When archiving, set display_order to a high number to move to end
                            // When unarchiving, keep current display_order
                            const updates = {
                              archived: !viewingVehicle.archived
                            };
                            if (!viewingVehicle.archived) {
                              // Archiving: set display_order to max + 1
                              const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
                              updates.display_order = maxOrder + 1;
                            }
                            const updatedVehicle = {
                              ...viewingVehicle,
                              ...updates
                            };
                            await updateVehicle(viewingVehicle.id, updates);
                            setViewingVehicle(updatedVehicle);
                            setOriginalVehicleData({ ...updatedVehicle });
                          }
                        });
                      }}
                      className={`h-10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                        viewingVehicle.archived
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                      }`}
                    >
                      <Archive className="w-4 h-4" />
                      <span className="hidden sm:inline">{viewingVehicle.archived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                  </>
                )}
                {vehicleModalEditMode === 'project' && (
                  <button
                    onClick={async () => {
                      // Toggle on_hold status
                      const newStatus = vehicleModalProjectView.status === 'on_hold' ? 'in_progress' : 'on_hold';
                      const updatedProject = { ...vehicleModalProjectView, status: newStatus };
                      await updateProject(vehicleModalProjectView.id, {
                        status: newStatus
                      });
                      setVehicleModalProjectView(updatedProject);
                    }}
                    className={`h-10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                      vehicleModalProjectView.status === 'on_hold'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {vehicleModalProjectView.status === 'on_hold' ? (
                      <>
                        <Play className="w-4 h-4" />
                        <span className="hidden sm:inline">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        <span className="hidden sm:inline">Pause</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={async () => {
                  // Save logic based on what's being edited
                  if (vehicleModalEditMode === 'vehicle') {
                    let updatedVehicle = { ...viewingVehicle };

                    // Handle multi-image upload and management
                    // Start with existing images (from the database format, not resolved)
                    let finalImages = [...(viewingVehicle.images || [])];

                    // Upload any new images
                    if (vehicleImageFiles.length > 0) {
                      const uploadedImages = await uploadMultipleVehicleImages(vehicleImageFiles);
                      if (uploadedImages.length > 0) {
                        // If no existing images and we're uploading, first one should be primary
                        const shouldSetFirstPrimary = finalImages.length === 0 && !uploadedImages.some(img => img.isPrimary);
                        if (shouldSetFirstPrimary) {
                          uploadedImages[0].isPrimary = true;
                        }
                        finalImages = [...finalImages, ...uploadedImages];
                      }
                    }

                    // Update images array
                    updatedVehicle.images = finalImages;

                    // Set primary image as image_url for backwards compatibility
                    const primaryImage = finalImages.find(img => img.isPrimary) || finalImages[0];
                    if (primaryImage) {
                      updatedVehicle.image_url = primaryImage.url;
                    } else {
                      updatedVehicle.image_url = '';
                    }

                    // Remove resolved URLs before saving (they're client-side only)
                    const { images_resolved, image_url_resolved, ...dataToSave } = updatedVehicle;

                    await updateVehicle(viewingVehicle.id, dataToSave);

                    // Build images_resolved for immediate display
                    const newImagesResolved = vehicleImageFiles.map((imgFile, idx) => ({
                      url: imgFile.preview,
                      isPrimary: imgFile.isPrimary
                    }));

                    // Combine existing resolved with new previews
                    updatedVehicle.images_resolved = [
                      ...(viewingVehicle.images_resolved || []),
                      ...newImagesResolved
                    ];

                    // Set primary URL resolved for backwards compat display
                    const primaryResolved = updatedVehicle.images_resolved.find(img => img.isPrimary) || updatedVehicle.images_resolved[0];
                    if (primaryResolved) {
                      updatedVehicle.image_url_resolved = primaryResolved.url;
                    }

                    clearImageSelection();
                    // Update viewing data with saved changes
                    setViewingVehicle(updatedVehicle);
                    setOriginalVehicleData({ ...updatedVehicle });
                  } else if (vehicleModalEditMode === 'project') {
                    await updateProject(vehicleModalProjectView.id, {
                      name: vehicleModalProjectView.name,
                      description: vehicleModalProjectView.description,
                      budget: parseFloat(vehicleModalProjectView.budget),
                      priority: vehicleModalProjectView.priority,
                      vehicle_id: vehicleModalProjectView.vehicle_id || null,
                      todos: vehicleModalProjectView.todos || []
                    });
                  }
                  setVehicleModalEditMode(null);
                }}
                disabled={uploadingImage}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  uploadingImage
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {uploadingImage ? (
                  'Saving...'
                ) : (
                  <>
                    <span className="sm:hidden">Save</span>
                    <span className="hidden sm:inline">Save Changes</span>
                  </>
                )}
              </button>
            </div>
          ) : vehicleModalProjectView ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => {
                  setVehicleModalProjectView(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                title="Back to vehicle"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <button
                onClick={() => {
                  setVehicleModalEditMode('project');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Edit2 className="w-3 h-3" />
                Edit Project
              </button>
            </div>
          ) : showAddServiceEventModal && isMobile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={handleCloseServiceEventModal}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                title="Back to vehicle"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="flex items-center gap-2">
                {editingServiceEvent && (
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete Service Event',
                        message: `Are you sure you want to delete "${editingServiceEvent.description}"? This action cannot be undone.`,
                        confirmText: 'Delete',
                        onConfirm: () => {
                          deleteServiceEvent(editingServiceEvent.id);
                          handleCloseServiceEventModal();
                        }
                      });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-red-900/50 hover:bg-red-900 text-red-400'
                        : 'bg-red-100 hover:bg-red-200 text-red-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!newEventDate) {
                      toast?.warning('Please select a date');
                      return;
                    }
                    if (!newEventDescription.trim()) {
                      toast?.warning('Please enter a description');
                      return;
                    }
                    let result;
                    if (editingServiceEvent) {
                      result = await updateServiceEvent(editingServiceEvent.id, {
                        event_date: newEventDate,
                        description: newEventDescription.trim(),
                        odometer: newEventOdometer ? parseInt(newEventOdometer, 10) : null,
                        notes: newEventNotes.trim() || null,
                        linked_part_ids: newEventLinkedParts.length > 0 ? newEventLinkedParts : null
                      });
                    } else {
                      result = await addServiceEvent(
                        viewingVehicle.id,
                        newEventDate,
                        newEventDescription,
                        newEventOdometer,
                        newEventNotes,
                        newEventLinkedParts
                      );
                    }
                    if (result) {
                      handleCloseServiceEventModal();
                    }
                  }}
                  disabled={savingServiceEvent || !newEventDate || !newEventDescription.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                    savingServiceEvent || !newEventDate || !newEventDescription.trim()
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {savingServiceEvent ? 'Saving...' : (editingServiceEvent ? 'Update' : 'Add')}
                </button>
              </div>
            </div>
          ) : showAddDocumentModal && isMobile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => {
                  setShowAddDocumentModal(false);
                  setNewDocumentFile(null);
                  setNewDocumentTitle('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                title="Back to vehicle"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <button
                onClick={async () => {
                  if (!newDocumentTitle.trim()) {
                    toast?.warning('Please enter a document title');
                    return;
                  }
                  if (!newDocumentFile) {
                    toast?.warning('Please select a file to upload');
                    return;
                  }
                  const result = await addDocument(
                    viewingVehicle.id,
                    newDocumentTitle.trim(),
                    newDocumentFile
                  );
                  if (result) {
                    setShowAddDocumentModal(false);
                    setNewDocumentFile(null);
                    setNewDocumentTitle('');
                  }
                }}
                disabled={uploadingDocument || !newDocumentTitle.trim() || !newDocumentFile}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  uploadingDocument || !newDocumentTitle.trim() || !newDocumentFile
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {uploadingDocument ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          ) : viewingInfoEvent && isMobile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => {
                  setViewingInfoEvent(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                title="Back to vehicle"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <button
                onClick={() => {
                  openEditServiceEventModal(viewingInfoEvent);
                  setViewingInfoEvent(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            </div>
          ) : (
            <>
              {/* Navigation controls on the left - mobile only */}
              {navigableVehicles.length > 1 && currentIndex !== -1 && (
                <div className="flex md:hidden items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevVehicle();
                    }}
                    disabled={!hasPrev}
                    className={`nav-btn ${darkMode ? 'dark' : 'light'}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className={`text-xs font-medium min-w-[3rem] text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {currentIndex + 1} / {navigableVehicles.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextVehicle();
                    }}
                    disabled={!hasNext}
                    className={`nav-btn ${darkMode ? 'dark' : 'light'}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {/* Report and Edit buttons on the right */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FileDown className="w-4 h-4" />
                  <span className="sm:hidden">Report</span>
                  <span className="hidden sm:inline">Generate Report</span>
                </button>
                <button
                  onClick={() => {
                    setVehicleModalEditMode('vehicle');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleGenerateReport}
        darkMode={darkMode}
        vehicleName={viewingVehicle?.nickname || `${viewingVehicle?.year || ''} ${viewingVehicle?.make || ''} ${viewingVehicle?.name || ''}`.trim()}
        generating={generatingReport}
      />

      {/* Service Event Info Modal (Notes + Parts) - Desktop only */}
      {(viewingInfoEvent || isInfoModalClosing) && !isMobile && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] modal-backdrop ${
            isInfoModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseInfoModal();
          }}
        >
          <div
            className={`rounded-lg shadow-xl max-w-lg w-full mx-4 modal-content ${
              isInfoModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
            } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div>
                <h3 className={`text-base font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                  {viewingInfoEvent?.description}
                </h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {viewingInfoEvent && new Date(viewingInfoEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {viewingInfoEvent?.odometer && ` • ${parseInt(viewingInfoEvent.odometer).toLocaleString()}${viewingVehicle.odometer_unit ? ` ${viewingVehicle.odometer_unit}` : ''}`}
                </p>
              </div>
              <button
                onClick={handleCloseInfoModal}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
              {/* Notes Section */}
              {viewingInfoEvent?.notes && (
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </h4>
                  <p className={`text-sm whitespace-pre-wrap ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {viewingInfoEvent.notes}
                  </p>
                </div>
              )}

              {/* Linked Parts Section */}
              {(() => {
                const linkedParts = viewingInfoEvent?.linked_part_ids
                  ? parts.filter(p => viewingInfoEvent.linked_part_ids.includes(p.id))
                  : [];

                if (linkedParts.length === 0) return null;

                return (
                  <div>
                    <h4 className={`text-sm font-semibold mb-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Linked Parts ({linkedParts.length})
                    </h4>
                    <div className="flex flex-col gap-4">
                      {linkedParts.map((part) => {
                        const vendorColor = part.vendor && vendorColors[part.vendor];
                        const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                        return (
                          <div
                            key={part.id}
                            className={`p-4 rounded-lg border flex flex-col ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>
                                  {part.part}
                                </h4>
                                {part.vendor && (
                                  colors ? (
                                    <span
                                      className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                                      style={{
                                        backgroundColor: colors.bg,
                                        color: colors.text,
                                        borderColor: colors.border
                                      }}
                                    >
                                      {part.vendor}
                                    </span>
                                  ) : (
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                      {part.vendor}
                                    </span>
                                  )
                                )}
                              </div>
                              <div className={`text-xs font-medium ${getStatusTextColor(part)}`}>
                                {getStatusText(part)}
                              </div>
                            </div>
                            {part.partNumber && part.partNumber !== '-' && (
                              <p className={`text-xs font-mono mb-3 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>
                                Part #: {part.partNumber}
                              </p>
                            )}
                            <div className={`border-t flex-1 flex flex-col justify-end ${
                              darkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}>
                              <div className="pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                    Part Price:
                                  </span>
                                  <span className={`font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    ${(part.price || 0).toFixed(2)}
                                  </span>
                                </div>
                                {part.shipping > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                      Shipping:
                                    </span>
                                    <span className={`font-medium ${
                                      darkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                      ${part.shipping.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                {part.duties > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                      Duties:
                                    </span>
                                    <span className={`font-medium ${
                                      darkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                      ${part.duties.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                <div className={`flex justify-between text-base font-bold pt-2 border-t ${
                                  darkMode ? 'border-gray-600' : 'border-gray-200'
                                }`}>
                                  <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                                    Total:
                                  </span>
                                  <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                                    ${(part.total || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetailModal;
