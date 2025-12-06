import { supabase } from '../lib/supabase';

/**
 * Service layer for projects-related Supabase operations
 * Centralizes all database calls for projects table
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all projects for the authenticated user
 * @returns {Promise<Array>} Array of projects
 * @throws {Error} With context about the failed operation
 */
export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load projects: ${error.message}`;
    throw error;
  }
};

/**
 * Create a new project
 * @param {Object} projectData - Project data to insert
 * @param {string} userId - User ID to associate with the project
 * @returns {Promise<Object>} Created project
 * @throws {Error} With context about the failed operation
 */
export const createProject = async (projectData, userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...projectData, user_id: userId }])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    error.message = `Failed to create project: ${error.message}`;
    throw error;
  }
};

/**
 * Update a project by ID
 * @param {number} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updateProject = async (projectId, updates) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update project: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a project by ID
 * @param {number} projectId - Project ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteProject = async (projectId) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete project: ${error.message}`;
    throw error;
  }
};

/**
 * Update display order for a project
 * @param {number} projectId - Project ID
 * @param {number} displayOrder - New display order
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const updateProjectDisplayOrder = async (projectId, displayOrder) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ display_order: displayOrder })
      .eq('id', projectId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update project order: ${error.message}`;
    throw error;
  }
};
