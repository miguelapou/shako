import { supabase } from '../lib/supabase';

/**
 * Service layer for vehicle service events
 * Centralizes all database calls for service_events table
 *
 * Note: With RLS enabled, queries automatically filter by authenticated user.
 * user_id must be included when creating new records.
 */

/**
 * Load all service events for a specific vehicle
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<Array>} Array of service events sorted by date descending
 * @throws {Error} With context about the failed operation
 */
export const getVehicleServiceEvents = async (vehicleId) => {
  try {
    const { data, error } = await supabase
      .from('service_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    error.message = `Failed to load service events: ${error.message}`;
    throw error;
  }
};

/**
 * Create a new service event
 * @param {Object} eventData - Service event data to insert
 * @param {string} userId - User ID to associate with the event
 * @returns {Promise<Object>} Created service event
 * @throws {Error} With context about the failed operation
 */
export const createServiceEvent = async (eventData, userId) => {
  try {
    const { data, error } = await supabase
      .from('service_events')
      .insert([{ ...eventData, user_id: userId }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    error.message = `Failed to create service event: ${error.message}`;
    throw error;
  }
};

/**
 * Update a service event by ID
 * @param {number} eventId - Service event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated service event
 * @throws {Error} With context about the failed operation
 */
export const updateServiceEvent = async (eventId, updates) => {
  try {
    const { data, error } = await supabase
      .from('service_events')
      .update(updates)
      .eq('id', eventId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    error.message = `Failed to update service event: ${error.message}`;
    throw error;
  }
};

/**
 * Delete a service event by ID
 * @param {number} eventId - Service event ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteServiceEvent = async (eventId) => {
  try {
    const { error } = await supabase
      .from('service_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete service event: ${error.message}`;
    throw error;
  }
};

/**
 * Delete all service events for a vehicle
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<void>}
 * @throws {Error} With context about the failed operation
 */
export const deleteAllVehicleServiceEvents = async (vehicleId) => {
  try {
    const { error } = await supabase
      .from('service_events')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to delete vehicle service events: ${error.message}`;
    throw error;
  }
};
