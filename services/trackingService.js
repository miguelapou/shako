import { AfterShip } from '@aftership/tracking-sdk';
import { supabase } from '../lib/supabase';

/**
 * Service layer for AfterShip tracking operations
 * Handles creating, fetching, and managing shipment tracking
 */

// Initialize AfterShip client (only on server-side)
let aftershipClient = null;

const getClient = () => {
  if (!aftershipClient && process.env.AFTERSHIP_API_KEY) {
    aftershipClient = new AfterShip({
      api_key: process.env.AFTERSHIP_API_KEY
    });
  }
  return aftershipClient;
};

/**
 * Map carrier names to AfterShip slugs
 */
const CARRIER_SLUGS = {
  'UPS': 'ups',
  'FedEx': 'fedex',
  'USPS': 'usps',
  'DHL': 'dhl',
  'Orange Connex': 'orange-connex',
  'ECMS': 'ecmsglobal',
  'Amazon': 'amazon'
};

/**
 * Detect carrier slug from tracking number
 * @param {string} tracking - Tracking number
 * @returns {string|null} Carrier slug or null for auto-detection
 */
export const detectCarrierSlug = (tracking) => {
  if (!tracking) return null;

  // UPS - starts with 1Z
  if (tracking.startsWith('1Z')) return 'ups';

  // FedEx - 12-14 digits
  if (/^\d{12,14}$/.test(tracking)) return 'fedex';

  // USPS - 20-22 digits or specific patterns
  if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) return 'usps';

  // DHL - 10-11 digits
  if (/^\d{10,11}$/.test(tracking)) return 'dhl';

  // Orange Connex - starts with EX
  if (tracking.startsWith('EX')) return 'orange-connex';

  // ECMS - starts with ECSDT
  if (tracking.startsWith('ECSDT')) return 'ecmsglobal';

  // Let AfterShip auto-detect
  return null;
};

/**
 * Create a new tracking in AfterShip
 * @param {string} trackingNumber - The tracking number
 * @param {string} carrier - Optional carrier name
 * @param {string} title - Optional title (part name)
 * @returns {Promise<Object>} AfterShip tracking response
 */
export const createAfterShipTracking = async (trackingNumber, carrier = null, title = null) => {
  const client = getClient();
  if (!client) {
    throw new Error('AfterShip API key not configured');
  }

  try {
    const slug = carrier ? CARRIER_SLUGS[carrier] : detectCarrierSlug(trackingNumber);

    // Build request body - SDK 2025-07 format (no wrapper object)
    const requestBody = {
      tracking_number: trackingNumber
    };

    if (slug) {
      requestBody.slug = slug;
    }

    if (title) {
      requestBody.title = title;
    }

    const response = await client.tracking.createTracking(requestBody);

    return response.data?.tracking || response.data;
  } catch (error) {
    // Handle duplicate tracking (error code 4003)
    if (error.code === 4003 || error.meta_code === 4003 || error.message?.includes('duplicate')) {
      const slug = carrier ? CARRIER_SLUGS[carrier] : detectCarrierSlug(trackingNumber);
      // Try to get existing tracking instead
      return getAfterShipTrackingByNumber(trackingNumber, slug);
    }
    error.message = `Failed to create AfterShip tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Get tracking by AfterShip tracking ID
 * @param {string} trackingId - AfterShip tracking ID
 * @returns {Promise<Object>} Tracking data
 */
export const getAfterShipTracking = async (trackingId) => {
  const client = getClient();
  if (!client) {
    throw new Error('AfterShip API key not configured');
  }

  try {
    // SDK 2025-07 format - pass tracking_id directly
    const response = await client.tracking.getTrackingById(trackingId);

    return response.data?.tracking || response.data;
  } catch (error) {
    error.message = `Failed to get AfterShip tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Get tracking by tracking number and slug
 * Uses direct API call since SDK method doesn't exist
 * @param {string} trackingNumber - Tracking number
 * @param {string} slug - Carrier slug
 * @returns {Promise<Object>} Tracking data
 */
export const getAfterShipTrackingByNumber = async (trackingNumber, slug = null) => {
  const apiKey = process.env.AFTERSHIP_API_KEY;
  if (!apiKey) {
    throw new Error('AfterShip API key not configured');
  }

  try {
    const detectedSlug = slug || detectCarrierSlug(trackingNumber);

    if (!detectedSlug) {
      throw new Error('Could not determine carrier for tracking number');
    }

    // Use direct API call since SDK method doesn't exist
    const response = await fetch(
      `https://api.aftership.com/tracking/2025-07/trackings/${detectedSlug}/${trackingNumber}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'as-api-key': apiKey
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.meta?.message || 'Failed to get tracking');
    }

    const data = await response.json();
    return data.data?.tracking || data.data;
  } catch (error) {
    error.message = `Failed to get AfterShip tracking: ${error.message}`;
    throw error;
  }
};

/**
 * Delete tracking from AfterShip
 * @param {string} trackingId - AfterShip tracking ID
 * @returns {Promise<void>}
 */
export const deleteAfterShipTracking = async (trackingId) => {
  const client = getClient();
  if (!client) {
    throw new Error('AfterShip API key not configured');
  }

  try {
    // SDK 2025-07 format - pass tracking_id directly
    await client.tracking.deleteTrackingById(trackingId);
  } catch (error) {
    // Ignore if tracking doesn't exist
    if (!error.message?.includes('not found')) {
      error.message = `Failed to delete AfterShip tracking: ${error.message}`;
      throw error;
    }
  }
};

/**
 * Normalize AfterShip tracking data for our database
 * @param {Object} tracking - AfterShip tracking response
 * @returns {Object} Normalized tracking data for parts table
 */
export const normalizeTrackingData = (tracking) => {
  if (!tracking) return null;

  const lastCheckpoint = tracking.checkpoints?.[tracking.checkpoints.length - 1];

  return {
    aftership_id: tracking.id,
    tracking_status: tracking.tag || 'Pending',
    tracking_substatus: tracking.subtag || null,
    tracking_location: lastCheckpoint?.location || lastCheckpoint?.city || null,
    tracking_eta: tracking.expected_delivery || null,
    tracking_updated_at: new Date().toISOString(),
    tracking_checkpoints: tracking.checkpoints || []
  };
};

/**
 * Update part with tracking data from AfterShip
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
 * Creates tracking in AfterShip if needed, then updates part with status
 * @param {Object} part - Part object with tracking number
 * @returns {Promise<Object>} Updated tracking data
 */
export const syncPartTracking = async (part) => {
  if (!part.tracking || part.tracking.startsWith('http')) {
    return null; // Skip URLs and empty tracking
  }

  let tracking;

  if (part.aftership_id) {
    // Get existing tracking
    tracking = await getAfterShipTracking(part.aftership_id);
  } else {
    // Create new tracking
    tracking = await createAfterShipTracking(part.tracking, null, part.part);
  }

  const normalizedData = normalizeTrackingData(tracking);
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
