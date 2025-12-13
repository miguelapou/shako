import { supabase } from '../lib/supabase';

/**
 * Service layer for projects-related Supabase operations
 */

const VALID_PROJECT_COLUMNS = [
  'name',
  'description',
  'budget',
  'priority',
  'vehicle_id',
  'todos',
  'archived',
  'paused',
  'display_order'
];

const NUMERIC_COLUMNS = ['budget', 'display_order'];

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

export const createProject = async (projectData, userId) => {
  try {
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

export const updateProject = async (projectId, updates) => {
  try {
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
