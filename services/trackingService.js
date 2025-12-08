import { supabase } from '../lib/supabase';
import { shouldSkipShip24 } from '../utils/trackingUtils';

/**
 * Service layer for Ship24 tracking operations
 * Handles creating, fetching, and managing shipment tracking
 */

const SHIP24_API_BASE = 'https://api.ship24.com/public/v1';

/**
 * Get authorization headers for Ship24 API
 */
const getHeaders = () => {
  const apiKey = process.env.SHIP24_API_KEY;
  if (!apiKey) {
    throw new Error('Ship24 API key not configured');
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Create a new tracking in Ship24 and get results synchronously
 * @param {string} trackingNumber - The tracking number
 * @param {string} title - Optional title (part name)
 * @returns {Promise<Object>} Ship24 tracking response
 */
export const createShip24Tracking = async (trackingNumber, title = null) => {
  try {
    const body = {
      trackingNumber
    };

    if (title) {
      body.shipmentReference = title;
    }

    const response = await fetch(`${SHIP24_API_BASE}/trackers/track`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ship24 API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    error.message = `Failed to create Ship24 tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Get tracking results by Ship24 tracker ID
 * @param {string} trackerId - Ship24 tracker ID
 * @returns {Promise<Object>} Tracking data
 */
export const getShip24Tracking = async (trackerId) => {
  try {
    const response = await fetch(`${SHIP24_API_BASE}/trackers/${trackerId}/results`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ship24 API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    error.message = `Failed to get Ship24 tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Get tracking by tracking number using the sync track endpoint
 * @param {string} trackingNumber - Tracking number
 * @returns {Promise<Object>} Tracking data
 */
export const getShip24TrackingByNumber = async (trackingNumber) => {
  try {
    const response = await fetch(`${SHIP24_API_BASE}/trackers/track`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ trackingNumber })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ship24 API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    error.message = `Failed to get Ship24 tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Delete tracking from Ship24
 * Note: Ship24 doesn't have a delete endpoint - trackers expire automatically
 * @param {string} trackerId - Ship24 tracker ID
 * @returns {Promise<void>}
 */
export const deleteShip24Tracking = async (trackerId) => {
  // Ship24 doesn't support deleting trackers - they expire automatically
  // This is a no-op for API compatibility
  console.log(`Ship24 tracker ${trackerId} will expire automatically`);
};

/**
 * Map Ship24 statusMilestone to our display format (PascalCase for compatibility)
 * @param {string} statusMilestone - Ship24 status milestone
 * @returns {string} Normalized status tag
 */
const normalizeStatusMilestone = (statusMilestone) => {
  const statusMap = {
    'pending': 'Pending',
    'info_received': 'InfoReceived',
    'in_transit': 'InTransit',
    'out_for_delivery': 'OutForDelivery',
    'attempt_fail': 'AttemptFail',
    'delivered': 'Delivered',
    'available_for_pickup': 'AvailableForPickup',
    'exception': 'Exception',
    'expired': 'Expired'
  };
  return statusMap[statusMilestone] || 'Pending';
};

/**
 * Normalize Ship24 tracking data for our database
 * @param {Object} trackingData - Ship24 tracking response
 * @returns {Object} Normalized tracking data for parts table
 */
export const normalizeTrackingData = (trackingData) => {
  if (!trackingData) return null;

  const tracker = trackingData.trackings?.[0] || trackingData;
  const shipment = tracker.shipment || {};
  const events = tracker.events || [];
  const lastEvent = events[0]; // Ship24 returns events in reverse chronological order

  // Get the overall status milestone
  const statusMilestone = shipment.statusMilestone || lastEvent?.statusMilestone || 'pending';

  return {
    ship24_id: tracker.tracker?.trackerId || trackingData.trackerId,
    tracking_status: normalizeStatusMilestone(statusMilestone),
    tracking_substatus: lastEvent?.statusCode || null,
    tracking_location: lastEvent?.location?.city || lastEvent?.location?.country || null,
    tracking_eta: shipment.delivery?.estimatedDeliveryDate || null,
    tracking_updated_at: new Date().toISOString(),
    tracking_checkpoints: events.map(event => ({
      checkpoint_time: event.datetime,
      message: event.status,
      city: event.location?.city || null,
      state: event.location?.state || event.location?.stateCode || null,
      country: event.location?.country || event.location?.countryCode || null,
      status: event.statusMilestone,
      statusCode: event.statusCode
    }))
  };
};

/**
 * Update part with tracking data from Ship24
 * @param {number} partId - Part ID to update
 * @param {Object} trackingData - Normalized tracking data
 * @returns {Promise<void>}
 */
export const updatePartTracking = async (partId, trackingData) => {
  try {
    const { error } = await supabase
      .from('parts')
      .update(trackingData)
      .eq('id', partId);

    if (error) throw error;
  } catch (error) {
    error.message = `Failed to update part tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Get part by tracking number
 * @param {string} trackingNumber - Tracking number
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Part or null
 */
export const getPartByTrackingNumber = async (trackingNumber, userId) => {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('tracking', trackingNumber)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  } catch (error) {
    error.message = `Failed to get part by tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Sync tracking status for a part
 * Creates tracking in Ship24 if needed, then updates part with status
 * @param {Object} part - Part object with tracking number
 * @returns {Promise<Object>} Updated tracking data
 */
export const syncPartTracking = async (part) => {
  if (shouldSkipShip24(part.tracking)) {
    return null; // Skip URLs, Amazon tracking, and empty tracking
  }

  let trackingData;

  if (part.ship24_id) {
    try {
      // Get existing tracking results
      trackingData = await getShip24Tracking(part.ship24_id);
    } catch (error) {
      // If tracker not found (404), create a new one
      if (error.message?.includes('404')) {
        trackingData = await createShip24Tracking(part.tracking, part.part);
      } else {
        throw error;
      }
    }
  } else {
    // Create new tracking (idempotent - will return existing if already tracked)
    trackingData = await createShip24Tracking(part.tracking, part.part);
  }

  const normalizedData = normalizeTrackingData(trackingData);
  await updatePartTracking(part.id, normalizedData);

  return normalizedData;
};

/**
 * Refresh tracking for all shipped but not delivered parts
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of updated parts
 */
export const refreshAllActiveTrackings = async (userId) => {
  try {
    // Get all parts that are shipped but not delivered with tracking numbers
    const { data: parts, error } = await supabase
      .from('parts')
      .select('*')
      .eq('user_id', userId)
      .eq('shipped', true)
      .eq('delivered', false)
      .not('tracking', 'is', null)
      .neq('tracking', '');

    if (error) throw error;

    const results = [];
    for (const part of parts || []) {
      try {
        const updated = await syncPartTracking(part);
        if (updated) {
          results.push({ partId: part.id, ...updated });
        }
      } catch (err) {
        console.error(`Failed to sync tracking for part ${part.id}:`, err);
      }
    }

    return results;
  } catch (error) {
    error.message = `Failed to refresh trackings: ${error.message}`;
    throw error;
  }
};
