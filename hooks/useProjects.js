import { useState } from 'react';
import { supabase } from '../lib/supabase';

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

  /**
   * Update a project
   */
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

  /**
   * Delete a project
   */
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

  /**
   * Update projects display order
   */
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
