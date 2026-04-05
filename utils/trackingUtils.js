// ========================================
// TRACKING UTILITIES
// ========================================

/**
 * List of couriers supported for manual override with Ship24
 * code: Ship24 courierCode value (null = auto-detect)
 * name: Display name shown in UI
 */
export const COURIER_OPTIONS = [
  { code: null, name: 'Auto-detect' },
  { code: 'usps', name: 'USPS' },
  { code: 'ups', name: 'UPS' },
  { code: 'fedex', name: 'FedEx' },
  { code: 'dhl', name: 'DHL' },
  { code: 'dhl-ecommerce', name: 'DHL eCommerce' },
  { code: 'ontrac', name: 'OnTrac' },
  { code: 'lasership', name: 'LaserShip' },
  { code: 'japan-post', name: 'Japan Post' },
  { code: 'australia-post', name: 'Australia Post' },
  { code: 'royal-mail', name: 'Royal Mail' },
  { code: 'canada-post', name: 'Canada Post' },
  { code: 'cainiao', name: 'Cainiao' },
  { code: 'yanwen', name: 'Yanwen' },
  { code: 'sfexpress', name: 'SF Express' },
];

/**
 * Get the display name for a courier code
 * @param {string|null} courierCode - Ship24 courier code
 * @returns {string|null} Display name, or null if not found
 */
export const getCourierDisplayName = (courierCode) => {
  if (!courierCode) return null;
  const option = COURIER_OPTIONS.find(o => o.code === courierCode);
  return option ? option.name : courierCode;
};

/**
 * Get fields to purge when tracking is removed or changed
 * Returns an object with all tracking-related fields set to null
 */
export const getTrackingPurgeFields = () => ({
  ship24_id: null,
  tracking_status: null,
  tracking_substatus: null,
  tracking_location: null,
  tracking_eta: null,
  tracking_updated_at: null,
  tracking_checkpoints: null,
  tracking_courier: null
});

/**
 * Check if tracking should skip Ship24 API
 * Returns true for URLs, Amazon tracking, and letter-only text (which Ship24 can't track)
 */
export const shouldSkipShip24 = (tracking) => {
  if (!tracking) return true;
  // Skip if it's already a URL
  if (tracking.startsWith('http')) return true;
  // Skip Amazon Logistics tracking numbers (start with TBA)
  if (tracking.toUpperCase().startsWith('TBA')) return true;
  // Skip letter-only strings (like "USPS", "FedEx", "Local", etc.)
  if (/^[a-zA-Z\s]+$/.test(tracking.trim())) return true;
  return false;
};

export const getTrackingUrl = (tracking) => {
  if (!tracking) return null;
  // If it's already a full URL, return it
  if (tracking.startsWith('http')) {
    return tracking;
  }
  // Check if it's an Amazon Logistics tracking number (starts with TBA)
  if (tracking.toUpperCase().startsWith('TBA')) {
    return `https://www.amazon.com/progress-tracker/package/?itemId=&orderId=&trackingId=${tracking}`;
  }
  // Check if it's an Orange Connex tracking number (starts with EX)
  if (tracking.startsWith('EX')) {
    return `https://www.orangeconnex.com/tracking?language=en&trackingnumber=${tracking}`;
  }
  // Check if it's an ECMS tracking number (starts with ECSDT)
  if (tracking.startsWith('ECSDT')) {
    return `https://www.ecmsglobal.com/en-us/tracking.html?orderNumber=${tracking}`;
  }
  // Check if it's a UPS tracking number
  if (tracking.startsWith('1Z')) {
    return `https://www.ups.com/track?tracknum=${tracking}&loc=en_US&requester=ST/trackdetails`;
  }
  // Check if it's a FedEx tracking number (12-14 digits)
  if (/^\d{12,14}$/.test(tracking)) {
    return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
  }
  // Check if it's a USPS tracking number (20-22 digits or specific patterns)
  if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
  }
  // Check if it's a DHL tracking number (10-11 digits)
  if (/^\d{10,11}$/.test(tracking)) {
    return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`;
  }
  // Check if it's a Japan Post tracking number (e.g. RR123456789JP)
  if (/^[A-Z]{2}\d{8,9}JP$/i.test(tracking)) {
    return `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo=${tracking}&searchKind=S002&locale=en`;
  }
  // Check if it's an Australia Post tracking number (e.g. RR123456789AU)
  if (/^[A-Z]{2}\d{8,9}AU$/i.test(tracking)) {
    return `https://auspost.com.au/mypost/track/#/details/${tracking}`;
  }
  // For generic text like "Local", "USPS", "FedEx" without tracking number
  return null;
};

export const getCarrierName = (tracking) => {
  if (!tracking) return null;
  // Check if it's an Amazon URL or tracking
  if (tracking.toLowerCase().includes('amazon.com') || tracking.toLowerCase().includes('amzn') || tracking.toUpperCase().startsWith('TBA')) {
    return 'Amazon';
  }
  // Check if it's a FedEx URL
  if (tracking.toLowerCase().includes('fedex.com')) {
    return 'FedEx';
  }
  // Check if it's an Orange Connex tracking number (starts with EX)
  if (tracking.startsWith('EX')) {
    return 'Orange Connex';
  }
  // Check if it's an ECMS tracking number (starts with ECSDT)
  if (tracking.startsWith('ECSDT')) {
    return 'ECMS';
  }
  // Check if it's a UPS tracking number
  if (tracking.startsWith('1Z')) {
    return 'UPS';
  }
  // Check if it's a FedEx tracking number (12-14 digits)
  if (/^\d{12,14}$/.test(tracking)) {
    return 'FedEx';
  }
  // Check if it's a USPS tracking number
  if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
    return 'USPS';
  }
  // Check if it's a DHL tracking number
  if (/^\d{10,11}$/.test(tracking)) {
    return 'DHL';
  }
  // For text like "Local", "USPS", "FedEx", "ECMS" etc.
  const upper = tracking.toUpperCase();
  if (upper.includes('UPS')) return 'UPS';
  if (upper.includes('FEDEX')) return 'FedEx';
  if (upper.includes('USPS')) return 'USPS';
  if (upper.includes('DHL')) return 'DHL';
  if (upper.includes('ECMS')) return 'ECMS';
  if (upper.includes('LOCAL')) return 'Local';
  // Check if it's a Japan Post tracking number (e.g. RR123456789JP)
  if (/^[A-Z]{2}\d{8,9}JP$/i.test(tracking)) return 'Japan Post';
  // Check if it's an Australia Post tracking number (e.g. RR123456789AU)
  if (/^[A-Z]{2}\d{8,9}AU$/i.test(tracking)) return 'Australia Post';
  return tracking; // Return as-is if unknown
};
