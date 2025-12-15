import { supabase } from '../lib/supabase';

/**
 * Service layer for projects-related Supabase operations
 * Centralizes all database calls for projects table
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

// Valid columns in the projects database table
const VALID_PROJECT_COLUMNS = [
  'name',
  'description',
  'budget',
  'priority',
  'status',
  'vehicle_id',
  'todos',
  'archived',
  'paused',
  'display_order'
];

// Numeric columns that should skip empty strings (to avoid type mismatch)
const NUMERIC_COLUMNS = ['budget', 'display_order'];

/**
 * Filter object to only include valid database columns
 * @param {Object} data - Data object to filter
 * @returns {Object} Filtered object with only valid columns
 */
const filterValidColumns = (data) => {
  const filtered = {};
  for (const key of Object.keys(data)) {
    if (VALID_PROJECT_COLUMNS.includes(key)) {
      const value = data[key];
      if (NUMERIC_COLUMNS.includes(key)) {
        if (value !== '' && value !== null && value !== undefined) {
          filtered[key] = value;
        }
      } else {
        if (value !== null && value !== undefined) {
          filtered[key] = value;
        }
      }
    }
  }
  return filtered;
};

/**
 * Load all projects for the authenticated user
 * @param {string} userId - User ID to filter by (defense-in-depth with RLS)
 * @returns {Promise<Array>} Array of projects
 * @throws {Error} With context about the failed operation
 */
export const getAllProjects = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
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
    // Filter to only include valid database columns
    const filteredData = filterValidColumns(projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...filteredData, user_id: userId }])
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
    // Filter to only include valid database columns
    const filteredUpdates = filterValidColumns(updates);

    const { error } = await supabase
      .from('projects')
      .update(filteredUpdates)
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
