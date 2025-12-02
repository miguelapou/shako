import React from 'react';
import { X, Edit2, Trash2, Archive, Pause, Play, ChevronDown } from 'lucide-react';
import ProjectDetailView from '../ui/ProjectDetailView';
import ProjectEditForm from '../ui/ProjectEditForm';
import LinkedPartsSection from '../ui/LinkedPartsSection';
import PrimaryButton from '../ui/PrimaryButton';

const ProjectDetailModal = ({
  isOpen,
  darkMode,
  viewingProject,
  projectModalEditMode,
  setProjectModalEditMode,
  originalProjectData,
  setOriginalProjectData,
  isModalClosing,
  projects,
  parts,
  vehicles,
  vendorColors,
  editingTodoId,
  setEditingTodoId,
  editingTodoText,
  setEditingTodoText,
  newTodoText,
  setNewTodoText,
  handleCloseModal,
  hasUnsavedProjectChanges,
  updateProject,
  deleteProject,
  unlinkPartFromProject,
  loadProjects,
  getStatusColors,
  getPriorityColors,
  getStatusText,
  getStatusTextColor,
  getVendorColor,
  calculateProjectTotal,
  setConfirmDialog,
  onClose
}) => {
  if (!isOpen || !viewingProject) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(() => {
        // Check for unsaved changes
        if (hasUnsavedProjectChanges()) {
          setConfirmDialog({
            isOpen: true,
            title: 'Unsaved Changes',
            message: 'You have unsaved changes. Are you sure you want to close without saving?',
            confirmText: 'Discard',
            cancelText: 'Go Back',
            onConfirm: () => {
              setProjectModalEditMode(false);
              setOriginalProjectData(null);
              onClose();
            }
          });
          return;
        }
        setProjectModalEditMode(false);
        setOriginalProjectData(null);
        onClose();
      })}
    >
      <div
        className={`rounded-lg shadow-xl max-w-5xl w-full overflow-hidden modal-content transition-all duration-700 ease-in-out grid ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
        style={{
          gridTemplateRows: 'auto 1fr auto',
          maxHeight: projectModalEditMode ? '90vh' : '85vh',
          transition: 'max-height 0.7s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`text-2xl font-bold ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
              {viewingProject.name}
            </h2>
            <button
              onClick={() => handleCloseModal(() => {
                // Check for unsaved changes
                if (hasUnsavedProjectChanges()) {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Unsaved Changes',
                    message: 'You have unsaved changes. Are you sure you want to close without saving?',
                    confirmText: 'Discard',
                    cancelText: 'Go Back',
                    onConfirm: () => {
                      setProjectModalEditMode(false);
                      setOriginalProjectData(null);
                      onClose();
                    }
                  });
                  return;
                }
                setProjectModalEditMode(false);
                setOriginalProjectData(null);
                onClose();
              })}
              className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - with slide animation */}
        <div className="relative min-h-[calc(90vh-180px)]">
          {/* Project Details View */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              projectModalEditMode
                ? 'absolute opacity-0 pointer-events-none'
                : 'relative opacity-100'
            }`}
          >
            <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              <ProjectDetailView
                project={viewingProject}
                parts={parts}
                darkMode={darkMode}
                vehicle={viewingProject.vehicle_id ? vehicles.find(v => v.id === viewingProject.vehicle_id) : null}
                updateProject={async (projectId, updates) => {
                  await updateProject(projectId, updates);
                  // Refresh the viewing project with the latest data
                  await loadProjects();
                  const updatedProject = projects.find(p => p.id === projectId);
                  if (updatedProject) {
                    setViewingProject({ ...updatedProject, ...updates });
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

          {/* Edit Project View - Slides in for editing */}
          <div
            className={`w-full transition-all duration-500 ease-in-out ${
              projectModalEditMode
                ? 'relative opacity-100'
                : 'absolute opacity-0 pointer-events-none'
            }`}
          >
            <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              <ProjectEditForm
                project={viewingProject}
                onProjectChange={setViewingProject}
                vehicles={vehicles}
                parts={parts}
                unlinkPartFromProject={unlinkPartFromProject}
                getVendorColor={getVendorColor}
                vendorColors={vendorColors}
                darkMode={darkMode}
              />

              <LinkedPartsSection
                projectId={viewingProject.id}
                parts={parts}
                unlinkPartFromProject={unlinkPartFromProject}
                getVendorColor={getVendorColor}
                vendorColors={vendorColors}
                darkMode={darkMode}
                setConfirmDialog={setConfirmDialog}
              />
            </div>
          </div>
        </div>

        {/* Footer with conditional buttons */}
        <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          {projectModalEditMode ? (
            <div className="flex items-center justify-between sm:justify-start w-full gap-2">
              <button
                onClick={() => {
                  // Check for unsaved changes before going back
                  if (hasUnsavedProjectChanges()) {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Unsaved Changes',
                      message: 'You have unsaved changes. Are you sure you want to go back without saving?',
                      confirmText: 'Discard',
                      cancelText: 'Keep Editing',
                      onConfirm: () => {
                        // Restore original data
                        if (originalProjectData) {
                          setViewingProject({ ...originalProjectData });
                        }
                        setProjectModalEditMode(false);
                      }
                    });
                    return;
                  }
                  setProjectModalEditMode(false);
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
                <button
                  onClick={async () => {
                    const partsForProject = parts.filter(p => p.projectId === viewingProject.id);
                    const hasParts = partsForProject.length > 0;
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Delete Project',
                      message: hasParts
                        ? `This project has ${partsForProject.length} part(s) linked to it. Deleting it will unlink these parts. This action cannot be undone.`
                        : 'Are you sure you want to permanently delete this project? This action cannot be undone.',
                      confirmText: 'Delete',
                      onConfirm: async () => {
                        await deleteProject(viewingProject.id);
                        setProjectModalEditMode(false);
                        setOriginalProjectData(null);
                        onClose();
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
                      title: viewingProject.archived ? 'Unarchive Project' : 'Archive Project',
                      message: viewingProject.archived
                        ? 'Are you sure you want to unarchive this project?'
                        : 'Are you sure you want to archive this project? It will still be visible but with limited information.',
                      confirmText: viewingProject.archived ? 'Unarchive' : 'Archive',
                      isDangerous: false,
                      onConfirm: async () => {
                        const updatedProject = {
                          ...viewingProject,
                          archived: !viewingProject.archived
                        };
                        await updateProject(viewingProject.id, { archived: !viewingProject.archived });
                        setViewingProject(updatedProject);
                        setOriginalProjectData({ ...updatedProject });
                      }
                    });
                  }}
                  className={`h-10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                    viewingProject.archived
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">{viewingProject.archived ? 'Unarchive' : 'Archive'}</span>
                </button>
                <button
                  onClick={async () => {
                    // Toggle on_hold status
                    const newStatus = viewingProject.status === 'on_hold' ? 'in_progress' : 'on_hold';
                    const updatedProject = { ...viewingProject, status: newStatus };
                    await updateProject(viewingProject.id, {
                      status: newStatus
                    });
                    setViewingProject(updatedProject);
                  }}
                  className={`h-10 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                    viewingProject.status === 'on_hold'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                  }`}
                >
                  {viewingProject.status === 'on_hold' ? (
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
              </div>
              <PrimaryButton
                onClick={async () => {
                  await updateProject(viewingProject.id, {
                    name: viewingProject.name,
                    description: viewingProject.description,
                    budget: parseFloat(viewingProject.budget),
                    priority: viewingProject.priority,
                    vehicle_id: viewingProject.vehicle_id || null,
                    todos: viewingProject.todos || []
                  });
                  // Update viewing data with saved changes
                  const updatedProject = {
                    ...viewingProject,
                    budget: parseFloat(viewingProject.budget)
                  };
                  setViewingProject(updatedProject);
                  setOriginalProjectData({ ...updatedProject });
                  setProjectModalEditMode(false);
                }}
              >
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Save Changes</span>
              </PrimaryButton>
            </div>
          ) : (
            <div className="ml-auto">
              <PrimaryButton
                onClick={() => {
                  setProjectModalEditMode(true);
                }}
                icon={Edit2}
              >
                Edit
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
