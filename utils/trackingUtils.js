// ========================================
// TRACKING UTILITIES
// ========================================

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
  return tracking; // Return as-is if unknown
};
