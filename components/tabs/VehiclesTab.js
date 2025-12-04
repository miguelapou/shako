import React from 'react';
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
  Upload,
  Pause,
  Play,
  Camera
} from 'lucide-react';
import ProjectDetailView from '../ui/ProjectDetailView';
import ProjectEditForm from '../ui/ProjectEditForm';
import LinkedPartsSection from '../ui/LinkedPartsSection';
import {
  calculateVehicleTotalSpent,
  calculateProjectTotal
} from '../../utils/dataUtils';
import {
  getPriorityBorderColor,
  getStatusColors,
  getPriorityColors,
  getVendorColor
} from '../../utils/colorUtils';
import { inputClasses } from '../../utils/styleUtils';

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
  calculateProjectTotal
}) => {
  if (!isOpen || !viewingVehicle) return null;

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
        className={`rounded-lg shadow-xl max-w-5xl w-full overflow-hidden modal-content transition-all duration-700 ease-in-out grid ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
        style={{
          gridTemplateRows: 'auto 1fr auto',
          maxHeight: vehicleModalEditMode ? '90vh' : '85vh',
          transition: 'max-height 0.7s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-slate-800'
            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
              {vehicleModalProjectView ? vehicleModalProjectView.name : (viewingVehicle.nickname || viewingVehicle.name || 'Vehicle Details')}
            </h2>
            {!vehicleModalProjectView && viewingVehicle.archived && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 border border-gray-600'
                  : 'bg-gray-200 text-gray-700 border border-gray-400'
              }`}>
                Archived
              </span>
            )}
          </div>
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
            className={`p-2 rounded-md transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
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
            <div className="p-6 pb-12 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
              {/* Top Section: Image and Basic Info side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info Card - Half width on desktop, two column layout - appears second on mobile */}
                <div className={`order-last md:order-first rounded-lg p-6 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Basic Info
                  </h3>
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
                      {viewingVehicle.insurance_policy && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Insurance Policy</p>
                          <p className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>{viewingVehicle.insurance_policy}</p>
                        </div>
                      )}
                    </div>
                    {/* Total Spent on Linked Projects */}
                    {(() => {
                      const vehicleProjects = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                      const totalSpent = calculateVehicleTotalSpent(viewingVehicle.id, projects, parts);
                      const totalBudget = vehicleProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
                      const linkedPartsCount = vehicleProjects.reduce((count, project) => {
                        return count + parts.filter(part => part.projectId === project.id).length;
                      }, 0);
                      return (
                        <div className={`col-span-2 pt-4 mt-4 border-t ${
                          darkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className={`text-sm font-medium mb-2 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Total Spent</p>
                              <p className={`text-2xl font-bold ${
                                darkMode ? 'text-green-400' : 'text-green-600'
                              }`}>${totalSpent.toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex-1">
                                <p className={`text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>Total Budget</p>
                                <p className={`text-2xl font-bold ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>${Math.round(totalBudget)}</p>
                              </div>
                              <div className={`flex items-center justify-end gap-4 mt-4 text-xs ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {vehicleProjects.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Wrench className="w-3.5 h-3.5" />
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
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* Vehicle Image - Half width on desktop - appears first on mobile */}
                {viewingVehicle.image_url ? (
                  <div className="order-first md:order-last rounded-lg overflow-hidden">
                    <img
                      src={viewingVehicle.image_url}
                      alt={viewingVehicle.nickname || viewingVehicle.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover min-h-[300px]"
                    />
                  </div>
                ) : (
                  <div className={`order-first md:order-last rounded-lg border min-h-[300px] flex flex-col items-center justify-center ${
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

              {/* Maintenance Section (includes filters, oil, battery) */}
              <div className={`pt-6 border-t ${
                darkMode ? 'border-gray-700' : 'border-slate-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  Maintenance
                </h3>
                {(viewingVehicle.fuel_filter || viewingVehicle.air_filter || viewingVehicle.oil_filter || viewingVehicle.oil_type || viewingVehicle.oil_capacity || viewingVehicle.oil_brand || viewingVehicle.drain_plug || viewingVehicle.battery) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Mobile order: fuel filter, air filter, battery, oil filter, oil capacity, oil type, oil brand, drain plug */}
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
                        <Wrench className="w-5 h-5" />
                        <span>Projects ({vehicleProjects.length})</span>
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
                              className={`flex flex-col rounded-lg p-4 border-l-4 text-left transition-all hover:shadow-md cursor-pointer ${
                                darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
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
                        <Wrench className="w-12 h-12 mx-auto mb-2 opacity-40" />
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
          {vehicleModalProjectView && !vehicleModalEditMode && (
            <div
              className={`w-full transition-all duration-500 ease-in-out ${
                vehicleModalProjectView && !vehicleModalEditMode
                  ? 'relative opacity-100'
                  : 'absolute opacity-0 pointer-events-none'
              }`}
            >
              <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                <ProjectDetailView
                  project={vehicleModalProjectView}
                  parts={parts}
                  darkMode={darkMode}
                  updateProject={async (projectId, updates) => {
                    await updateProject(projectId, updates);
                    // Refresh the viewing project with the latest data
                    await loadProjects();
                    const updatedProject = projects.find(p => p.id === projectId);
                    if (updatedProject) {
                      setVehicleModalProjectView({ ...updatedProject, ...updates });
                    }
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
            </div>
          )}

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
                  {/* Left Column - Basic Information */}
                  <div className="space-y-4">
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

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Insurance Policy
                      </label>
                      <input
                        type="text"
                        value={viewingVehicle.insurance_policy || ''}
                        onChange={(e) => setViewingVehicle({ ...viewingVehicle, insurance_policy: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Right Column - Image Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Vehicle Image
                      </label>
                      {/* Current Image or Preview */}
                      {(vehicleImagePreview || viewingVehicle.image_url) && (
                        <div className="mb-3 relative">
                          <img
                            src={vehicleImagePreview || viewingVehicle.image_url}
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
                                setViewingVehicle({ ...viewingVehicle, image_url: '' });
                              }
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {/* File Upload Button */}
                      {!vehicleImagePreview && !viewingVehicle.image_url && (
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
        <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
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
                        let message = 'Are you sure you want to permanently delete this vehicle? This action cannot be undone.';
                        if (hasProjects || hasParts) {
                          const items = [];
                          if (hasProjects) items.push(`${projectsForVehicle.length} project(s)`);
                          if (hasParts) items.push(`${partsForVehicle.length} part(s)`);
                          message = `This vehicle has ${items.join(' and ')} linked to it. Deleting it will unlink these items. This action cannot be undone.`;
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
            <div className="ml-auto">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailModal;
