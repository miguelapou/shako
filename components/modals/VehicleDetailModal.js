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
  BookOpen
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
  calculateProjectTotal
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
  // State for report generation
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  // State for document/service event action overlays
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  // State for viewing service event notes
  const [viewingNoteEvent, setViewingNoteEvent] = useState(null);
  const [isNotesModalClosing, setIsNotesModalClosing] = useState(false);
  // State for viewing service event linked parts
  const [viewingPartsEvent, setViewingPartsEvent] = useState(null);
  const [isPartsModalClosing, setIsPartsModalClosing] = useState(false);
  // State for service history expansion
  const [serviceHistoryExpanded, setServiceHistoryExpanded] = useState(false);

  // Reset service history expansion when viewing a different vehicle
  useEffect(() => {
    setServiceHistoryExpanded(false);
  }, [viewingVehicle?.id]);

  // Handle closing the notes modal with animation
  const handleCloseNotesModal = () => {
    setIsNotesModalClosing(true);
    setTimeout(() => {
      setViewingNoteEvent(null);
      setIsNotesModalClosing(false);
    }, 150);
  };

  // Handle closing the parts modal with animation
  const handleClosePartsModal = () => {
    setIsPartsModalClosing(true);
    setTimeout(() => {
      setViewingPartsEvent(null);
      setIsPartsModalClosing(false);
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

  // Keyboard navigation (left/right arrow keys)
  useEffect(() => {
    if (!isOpen || vehicleModalEditMode || vehicleModalProjectView) return;

    const handleKeyDown = (e) => {
      // Don't navigate if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

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
  }, [isOpen, vehicleModalEditMode, vehicleModalProjectView, hasPrev, hasNext, goToPrevVehicle, goToNextVehicle]);

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

  // Load documents and service events when modal opens
  useEffect(() => {
    if (isOpen && viewingVehicle?.id) {
      loadDocuments(viewingVehicle.id);
      loadServiceEvents(viewingVehicle.id);
    }
  }, [isOpen, viewingVehicle?.id, loadDocuments, loadServiceEvents]);

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
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-slate-800'
            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
              {vehicleModalProjectView ? vehicleModalProjectView.name : (viewingVehicle.nickname || viewingVehicle.name || 'Vehicle Details')}
            </h2>
            <div className="flex items-center gap-3">
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
              vehicleModalProjectView || vehicleModalEditMode
                ? 'absolute opacity-0 pointer-events-none'
                : 'relative opacity-100'
            }`}
          >
            <div
              key={viewingVehicle.id}
              className="p-6 pb-12 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto animate-fade-in"
            >
              {/* Top Section: Image and Basic Info side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Card - Half width on desktop, two column layout - appears second */}
                <div className={`order-last rounded-lg p-6 ${
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
                      const totalSpent = calculateVehicleTotalSpent(viewingVehicle.id, projects, parts);
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
                {/* Vehicle Image - Half width on desktop - appears first */}
                {(viewingVehicle.image_url_resolved || viewingVehicle.image_url) ? (
                  <div className="order-first rounded-lg overflow-hidden">
                    <FadeInImage
                      src={viewingVehicle.image_url_resolved || viewingVehicle.image_url}
                      alt={viewingVehicle.nickname || viewingVehicle.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover min-h-[300px]"
                    />
                  </div>
                ) : (
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
                )}
              </div>

              {/* Service History and Maintenance - Side by side on desktop */}
              <div className={`pt-6 border-t grid grid-cols-1 lg:grid-cols-2 gap-6 ${
                darkMode ? 'border-gray-700' : 'border-slate-200'
              }`}>
                {/* Service Events Timeline Section */}
                <div className="order-2 lg:order-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Service History
                  </h3>
                </div>
                <div className={`relative ${!loadingServiceEvents ? 'animate-fade-in' : ''}`} onClick={() => setSelectedEventId(null)}>
                    {/* Timeline items */}
                    <div className="flex flex-col gap-4">
                      {(() => {
                        const sortedEvents = serviceEvents ? [...serviceEvents].sort((a, b) =>
                          new Date(a.event_date + 'T00:00:00') - new Date(b.event_date + 'T00:00:00')
                        ) : [];
                        const totalEvents = sortedEvents.length;
                        const hiddenCount = Math.max(0, totalEvents - 4);
                        const visibleEvents = serviceHistoryExpanded ? sortedEvents : sortedEvents.slice(-4);

                        return (
                          <>
                            {/* Show more button - appears when collapsed and there are hidden events */}
                            {!serviceHistoryExpanded && hiddenCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setServiceHistoryExpanded(true);
                                }}
                                className={`flex items-center gap-1 text-sm font-medium mb-2 ${
                                  darkMode
                                    ? 'text-blue-400 hover:text-blue-300'
                                    : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                                Show {hiddenCount} more
                              </button>
                            )}

                            {/* Show less button - appears when expanded and there are hidden events */}
                            {serviceHistoryExpanded && hiddenCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setServiceHistoryExpanded(false);
                                }}
                                className={`flex items-center gap-1 text-sm font-medium mb-2 ${
                                  darkMode
                                    ? 'text-blue-400 hover:text-blue-300'
                                    : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                <ChevronUp className="w-4 h-4" />
                                Show less
                              </button>
                            )}

                            {visibleEvents.map((event, index) => {
                              // Use full sorted array for proper calculations
                              const fullIndex = serviceHistoryExpanded ? index : (totalEvents - visibleEvents.length + index);
                              const arr = sortedEvents;
                              const eventDate = new Date(event.event_date + 'T00:00:00');
                              const formattedDate = eventDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              });
                              // isLast checks if this is the last visible event (shows dashed line to "add" card)
                              const isLast = index === visibleEvents.length - 1;

                              // Calculate mileage difference from previous event with same description
                              // Use fullIndex to look at all events before this one in the full sorted array
                              let mileageDiff = null;
                              if (event.odometer) {
                                const previousSameEvent = arr
                                  .slice(0, fullIndex)
                                  .filter(e => e.description.toLowerCase() === event.description.toLowerCase() && e.odometer)
                                  .pop();
                                if (previousSameEvent) {
                                  mileageDiff = event.odometer - previousSameEvent.odometer;
                                }
                              }

                              // Items that were hidden get animation when expanded
                              const wasHidden = serviceHistoryExpanded && fullIndex < hiddenCount;

                              return (
                                <div
                                  key={event.id}
                                  className={`relative flex items-stretch gap-4 group cursor-pointer ${wasHidden ? 'service-history-expand' : ''}`}
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
                                  {event.notes && (
                                    <button
                                      onClick={() => {
                                        setSelectedEventId(null);
                                        setViewingNoteEvent(event);
                                      }}
                                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                                        darkMode
                                          ? 'bg-gray-700 text-gray-300 can-hover:hover:ring-2 can-hover:hover:ring-gray-300'
                                          : 'bg-white text-gray-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-gray-600'
                                      }`}
                                    >
                                      <BookOpen className="w-5 h-5 mb-0.5" />
                                      <span className="text-[10px] font-medium">Notes</span>
                                    </button>
                                  )}
                                  {event.linked_part_ids && event.linked_part_ids.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedEventId(null);
                                        setViewingPartsEvent(event);
                                      }}
                                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-all ${
                                        darkMode
                                          ? 'bg-gray-700 text-orange-400 can-hover:hover:ring-2 can-hover:hover:ring-orange-400'
                                          : 'bg-white text-orange-600 shadow-sm can-hover:hover:ring-2 can-hover:hover:ring-orange-600'
                                      }`}
                                    >
                                      <Package className="w-5 h-5 mb-0.5" />
                                      <span className="text-[10px] font-medium">Parts</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                              );
                            })}

                            {/* Add new service event card */}
                            <div
                              onClick={openAddServiceEventModal}
                              className="relative flex items-stretch gap-4 cursor-pointer group"
                            >
                              {/* Timeline column with icon */}
                              <div className="relative flex flex-col items-center">
                                {/* Timeline dot for add card - with background to cover line */}
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

                              {/* Add card content */}
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
                          </>
                        );
                      })()}
                    </div>
                  </div>

                {/* Add Service Event Modal */}
                <AddServiceEventModal
                  isOpen={showAddServiceEventModal}
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
                <div className="order-1 lg:order-1">
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
                        }`}>Battery Type</p>
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
                    className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!loadingDocuments ? 'animate-fade-in' : ''}`}
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

                {/* Add Document Modal */}
                <AddDocumentModal
                  isOpen={showAddDocumentModal}
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
                        Nickname *
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
                        placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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

                  {/* Image Upload - Left on desktop */}
                  <div className="order-first space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Vehicle Image
                      </label>
                      {/* Current Image or Preview */}
                      {(vehicleImagePreview || viewingVehicle.image_url_resolved || viewingVehicle.image_url) && (
                        <div className="mb-3 relative">
                          <FadeInImage
                            src={vehicleImagePreview || viewingVehicle.image_url_resolved || viewingVehicle.image_url}
                            alt="Vehicle"
                            className={`w-full h-full object-cover rounded-lg ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}
                            style={{ minHeight: '400px' }}
                          />
                          <button
                            onClick={() => {
                              if (vehicleImagePreview) {
                                clearImageSelection();
                              } else {
                                setViewingVehicle({ ...viewingVehicle, image_url: '', image_url_resolved: '' });
                              }
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {/* File Upload Button */}
                      {!vehicleImagePreview && !viewingVehicle.image_url_resolved && !viewingVehicle.image_url && (
                        <label
                          onDragEnter={handleImageDragEnter}
                          onDragLeave={handleImageDragLeave}
                          onDragOver={handleImageDragOver}
                          onDrop={handleImageDrop}
                          className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                          isDraggingImage
                            ? darkMode
                              ? 'border-blue-500 bg-blue-900/20 scale-105'
                              : 'border-blue-500 bg-blue-50 scale-105'
                            : darkMode
                              ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700'
                              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                        }`} style={{ minHeight: '400px' }}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className={`w-12 h-12 mb-3 ${
                              isDraggingImage
                                ? 'text-blue-500'
                                : darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <p className={`mb-2 text-sm ${
                              isDraggingImage
                                ? 'text-blue-600 font-semibold'
                                : darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>
                              {isDraggingImage ? (
                                'Drop image here'
                              ) : (
                                <>
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </>
                              )}
                            </p>
                            <p className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              PNG, JPG, WEBP (MAX. 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageFileChange}
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
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
                          placeholder=""
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Battery Type
                        </label>
                        <input
                          type="text"
                          value={viewingVehicle.battery || ''}
                          onChange={(e) => setViewingVehicle({ ...viewingVehicle, battery: e.target.value })}
                          className={inputClasses(darkMode)}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
                    // Upload new image if one is selected
                    let updatedVehicle = { ...viewingVehicle };
                    if (vehicleImageFile) {
                      const imageUrl = await uploadVehicleImage(vehicleImageFile);
                      if (imageUrl) {
                        updatedVehicle.image_url = imageUrl;
                      }
                    }
                    await updateVehicle(viewingVehicle.id, updatedVehicle);
                    // Use the local preview as resolved URL so image shows immediately
                    if (vehicleImagePreview) {
                      updatedVehicle.image_url_resolved = vehicleImagePreview;
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

      {/* Notes Viewing Modal */}
      {(viewingNoteEvent || isNotesModalClosing) && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] modal-backdrop ${
            isNotesModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseNotesModal();
          }}
        >
          <div
            className={`rounded-lg shadow-xl max-w-md w-full mx-4 modal-content ${
              isNotesModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
            } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div>
                <h3 className={`text-base font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {viewingNoteEvent?.description}
                </h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {viewingNoteEvent && new Date(viewingNoteEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={handleCloseNotesModal}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className={`text-sm whitespace-pre-wrap ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {viewingNoteEvent?.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Parts Viewing Modal */}
      {(viewingPartsEvent || isPartsModalClosing) && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] modal-backdrop ${
            isPartsModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleClosePartsModal();
          }}
        >
          <div
            className={`rounded-lg shadow-xl max-w-lg w-full mx-4 modal-content ${
              isPartsModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
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
                  Linked Parts
                </h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {viewingPartsEvent?.description} • {viewingPartsEvent && new Date(viewingPartsEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={handleClosePartsModal}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {(() => {
                const linkedParts = viewingPartsEvent?.linked_part_ids
                  ? parts.filter(p => viewingPartsEvent.linked_part_ids.includes(p.id))
                  : [];

                if (linkedParts.length === 0) {
                  return (
                    <div className={`text-center py-8 rounded-lg border ${
                      darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No parts linked</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-3">
                    {linkedParts.map((part) => {
                      const vendorColor = part.vendor && vendorColors[part.vendor];
                      const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                      return (
                        <div
                          key={part.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium truncate ${
                              darkMode ? 'text-gray-100' : 'text-slate-800'
                            }`}>
                              {part.part}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {part.vendor && (
                                colors ? (
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
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {part.vendor}
                                  </span>
                                )
                              )}
                              <span className={`text-sm font-bold ${
                                darkMode ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                                ${part.total?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
