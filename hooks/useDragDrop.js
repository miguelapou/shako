import { useState } from 'react';

/**
 * Custom hook for managing drag and drop state and handlers
 *
 * Features:
 * - Project drag and drop reordering
 * - Vehicle drag and drop reordering
 * - Archive zone drop handling
 * - Drag over states for visual feedback
 *
 * @param {Object} params - Hook parameters
 * @param {Array} params.projects - Array of projects
 * @param {Function} params.setProjects - Function to update projects
 * @param {Function} params.updateProjectsOrder - Function to update project order in database
 * @param {Function} params.updateProject - Function to update a project
 * @param {Function} params.loadProjects - Function to reload projects
 * @param {Array} params.vehicles - Array of vehicles
 * @param {Function} params.setVehicles - Function to update vehicles
 * @param {Function} params.updateVehiclesOrder - Function to update vehicle order in database
 * @param {Function} params.updateVehicle - Function to update a vehicle
 * @param {Function} params.loadVehicles - Function to reload vehicles
 * @param {Function} params.setConfirmDialog - Function to show confirmation dialogs
 * @returns {Object} Drag and drop state and handlers
 */
const useDragDrop = ({
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
}) => {
  // Project drag state
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [dragOverProjectArchiveZone, setDragOverProjectArchiveZone] = useState(false);

  // Vehicle drag state
  const [draggedVehicle, setDraggedVehicle] = useState(null);
  const [dragOverVehicle, setDragOverVehicle] = useState(null);
  const [dragOverArchiveZone, setDragOverArchiveZone] = useState(false);

  // ========================================
  // PROJECT DRAG AND DROP HANDLERS
  // ========================================

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

  // ========================================
  // VEHICLE DRAG AND DROP HANDLERS
  // ========================================

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

    // Find linked projects based on archive action
    const linkedProjectsToArchive = projects.filter(p => p.vehicle_id === draggedVehicle.id && !p.archived);
    const linkedProjectsToRestore = projects.filter(p => p.vehicle_id === draggedVehicle.id && p.archived);
    const archiveCount = linkedProjectsToArchive.length;
    const restoreCount = linkedProjectsToRestore.length;
    const vehicleName = draggedVehicle.nickname || draggedVehicle.name;

    let archiveMessage = archiveCount > 0
      ? `Are you sure you want to archive "${vehicleName}"? It will remain visible with limited information, and ${archiveCount} linked project${archiveCount > 1 ? 's' : ''} will also be archived.`
      : `Are you sure you want to archive "${vehicleName}"? It will remain visible with limited information.`;

    let unarchiveMessage = restoreCount > 0
      ? `Are you sure you want to unarchive "${vehicleName}"? It has ${restoreCount} archived project${restoreCount > 1 ? 's' : ''} that can be restored.`
      : `Are you sure you want to unarchive "${vehicleName}"?`;

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: shouldArchive ? 'Archive Vehicle' : 'Unarchive Vehicle',
      message: shouldArchive ? archiveMessage : unarchiveMessage,
      confirmText: shouldArchive ? 'Archive' : 'Unarchive',
      isDangerous: false,
      // Show Restore button when unarchiving and there are archived projects
      ...(!shouldArchive && restoreCount > 0 ? {
        secondaryText: 'Restore All',
        secondaryDangerous: false,
        secondaryAction: async () => {
          // Unarchive vehicle and all linked projects
          await updateVehicle(draggedVehicle.id, { archived: false });
          // Restore all archived linked projects sequentially to avoid state conflicts
          for (const project of linkedProjectsToRestore) {
            await updateProject(project.id, { archived: false });
          }
          await loadVehicles();
        }
      } : {}),
      onConfirm: async () => {
        const updates = { archived: shouldArchive };
        if (shouldArchive) {
          // Archiving: set display_order to max + 1
          const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
          updates.display_order = maxOrder + 1;
          // Archive all linked projects sequentially to avoid state conflicts
          for (const project of linkedProjectsToArchive) {
            await updateProject(project.id, { archived: true });
          }
        }
        await updateVehicle(draggedVehicle.id, updates);
        await loadVehicles();
      }
    });

    setDraggedVehicle(null);
    setDragOverArchiveZone(false);
  };

  return {
    // Project drag state
    draggedProject,
    setDraggedProject,
    dragOverProject,
    setDragOverProject,
    dragOverProjectArchiveZone,
    setDragOverProjectArchiveZone,

    // Project drag handlers
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleProjectArchiveZoneDrop,

    // Vehicle drag state
    draggedVehicle,
    setDraggedVehicle,
    dragOverVehicle,
    setDragOverVehicle,
    dragOverArchiveZone,
    setDragOverArchiveZone,

    // Vehicle drag handlers
    handleVehicleDragStart,
    handleVehicleDragOver,
    handleVehicleDragLeave,
    handleVehicleDrop,
    handleVehicleDragEnd,
    handleArchiveZoneDrop
  };
};

export default useDragDrop;
