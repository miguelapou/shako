import { useState } from 'react';
import * as projectsService from '../services/projectsService';

/**
 * Custom hook for managing projects data and CRUD operations
 *
 * Features:
 * - Load projects from Supabase
 * - Add, update, and delete projects
 * - Auto-calculate project status based on todos
 * - Update project display order (for drag and drop)
 * - Helper functions for vehicle-project relationships
 *
 * @returns {Object} Projects state and operations
 */
const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    priority: 'not_set',
    status: 'planning',
    vehicle_id: null
  });

  /**
   * Load projects from Supabase
   */
  const loadProjects = async () => {
    try {
      const data = await projectsService.getAllProjects();

      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (error) {
      // Error loading projects
    }
  };

  /**
   * Helper function to calculate project status based on todos
   */
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

  /**
   * Add a new project
   */
  const addProject = async (projectData) => {
    try {
      await projectsService.createProject({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'planning',
        budget: parseFloat(projectData.budget) || 0,
        spent: 0,
        priority: projectData.priority || 'medium',
        vehicle_id: projectData.vehicle_id || null,
        todos: []
      });
      await loadProjects();
    } catch (error) {
      alert('Error adding project');
    }
  };

  /**
   * Update a project
   */
  const updateProject = async (projectId, updates) => {
    try {
      // Auto-calculate status based on todos unless it's being set to on_hold
      if (updates.todos && updates.status !== 'on_hold') {
        updates.status = calculateProjectStatus(updates.todos, updates.status);
      }
      await projectsService.updateProject(projectId, updates);
      await loadProjects();
    } catch (error) {
      alert('Error updating project');
    }
  };

  /**
   * Delete a project
   */
  const deleteProject = async (projectId) => {
    try {
      await projectsService.deleteProject(projectId);
      await loadProjects();
    } catch (error) {
      alert('Error deleting project');
    }
  };

  /**
   * Update projects display order
   */
  const updateProjectsOrder = async (orderedProjects) => {
    try {
      // Update each project with its new display order
      for (let i = 0; i < orderedProjects.length; i++) {
        await projectsService.updateProjectDisplayOrder(orderedProjects[i].id, i);
      }
    } catch (error) {
      // Error updating project order
    }
  };

  /**
   * Get projects for a specific vehicle
   */
  const getVehicleProjects = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId);
  };

  /**
   * Get project count for a specific vehicle
   */
  const getVehicleProjectCount = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId).length;
  };

  return {
    // State
    projects,
    setProjects,
    newProject,
    setNewProject,

    // Operations
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
    updateProjectsOrder,
    calculateProjectStatus,

    // Helper functions
    getVehicleProjects,
    getVehicleProjectCount
  };
};

export default useProjects;
