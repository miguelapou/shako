// ========================================
// TRACKING STATUS MAPPING UTILITIES
// ========================================

/**
 * Map tracking status tag to display configuration
 * Ship24 statusMilestone values are normalized to PascalCase in trackingService.js
 */
export const TRACKING_STATUS_CONFIG = {
  Pending: {
    label: 'Pending',
    shortLabel: 'Pending',
    description: 'Tracking created, waiting for carrier update',
    color: 'gray',
    bgLight: 'bg-gray-100',
    bgDark: 'bg-gray-700',
    textLight: 'text-gray-700',
    textDark: 'text-gray-300',
    icon: 'clock'
  },
  InfoReceived: {
    label: 'Label Created',
    shortLabel: 'Label',
    description: 'Carrier received shipment information',
    color: 'blue',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-900/30',
    textLight: 'text-blue-700',
    textDark: 'text-blue-300',
    icon: 'tag'
  },
  InTransit: {
    label: 'In Transit',
    shortLabel: 'Transit',
    description: 'Package is on its way',
    color: 'indigo',
    bgLight: 'bg-indigo-100',
    bgDark: 'bg-indigo-900/30',
    textLight: 'text-indigo-700',
    textDark: 'text-indigo-300',
    icon: 'truck'
  },
  OutForDelivery: {
    label: 'Out for Delivery',
    shortLabel: 'Out',
    description: 'Package is out for delivery today',
    color: 'amber',
    bgLight: 'bg-amber-100',
    bgDark: 'bg-amber-900/30',
    textLight: 'text-amber-700',
    textDark: 'text-amber-300',
    icon: 'package'
  },
  AttemptFail: {
    label: 'Delivery Failed',
    shortLabel: 'Failed',
    description: 'Delivery attempt was unsuccessful',
    color: 'orange',
    bgLight: 'bg-orange-100',
    bgDark: 'bg-orange-900/30',
    textLight: 'text-orange-700',
    textDark: 'text-orange-300',
    icon: 'alert-circle'
  },
  Delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Package has been delivered',
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-900/30',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
    icon: 'check-circle'
  },
  AvailableForPickup: {
    label: 'Ready for Pickup',
    shortLabel: 'Pickup',
    description: 'Package is available for pickup',
    color: 'cyan',
    bgLight: 'bg-cyan-100',
    bgDark: 'bg-cyan-900/30',
    textLight: 'text-cyan-700',
    textDark: 'text-cyan-300',
    icon: 'map-pin'
  },
  Exception: {
    label: 'Exception',
    shortLabel: 'Issue',
    description: 'There is an issue with the shipment',
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-900/30',
    textLight: 'text-red-700',
    textDark: 'text-red-300',
    icon: 'alert-triangle'
  },
  Expired: {
    label: 'Expired',
    shortLabel: 'Expired',
    description: 'No updates for extended period',
    color: 'gray',
    bgLight: 'bg-gray-100',
    bgDark: 'bg-gray-700',
    textLight: 'text-gray-500',
    textDark: 'text-gray-400',
    icon: 'x-circle'
  }
};

/**
 * Normalize snake_case status to PascalCase config key
 * @param {string} status - Status in any format (snake_case or PascalCase)
 * @returns {string} PascalCase config key
 */
export const normalizeStatusTag = (status) => {
  if (!status) return 'Pending';

  // Map snake_case Ship24 statuses to PascalCase config keys
  const statusMap = {
    'pending': 'Pending',
    'info_received': 'InfoReceived',
    'in_transit': 'InTransit',
    'out_for_delivery': 'OutForDelivery',
    'attempt_fail': 'AttemptFail',
    'failed_attempt': 'AttemptFail',
    'delivered': 'Delivered',
    'available_for_pickup': 'AvailableForPickup',
    'exception': 'Exception',
    'expired': 'Expired'
  };

  // Check if already PascalCase (exists in config)
  if (TRACKING_STATUS_CONFIG[status]) {
    return status;
  }

  // Convert snake_case to PascalCase key
  return statusMap[status.toLowerCase()] || 'Pending';
};

/**
 * Get status configuration for a tracking tag
 * @param {string} tag - Tracking status tag (normalized from Ship24 statusMilestone or raw snake_case)
 * @returns {Object} Status configuration
 */
export const getTrackingStatusConfig = (tag) => {
  const normalizedTag = normalizeStatusTag(tag);
  return TRACKING_STATUS_CONFIG[normalizedTag] || TRACKING_STATUS_CONFIG.Pending;
};

/**
 * Get CSS classes for a tracking status badge
 * @param {string} tag - Tracking status tag
 * @param {boolean} darkMode - Whether dark mode is enabled
 * @returns {string} Tailwind CSS classes
 */
export const getTrackingBadgeClasses = (tag, darkMode) => {
  const config = getTrackingStatusConfig(tag);
  const bg = darkMode ? config.bgDark : config.bgLight;
  const text = darkMode ? config.textDark : config.textLight;
  return `${bg} ${text}`;
};

/**
 * Format relative time from a date
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return null;

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
};

/**
 * Format ETA date
 * @param {string|Date} date - ETA date
 * @returns {string} Formatted ETA
 */
export const formatETA = (date) => {
  if (!date) return null;

  const eta = new Date(date);
  const now = new Date();
  const diffMs = eta - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return eta.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return eta.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format checkpoint time
 * @param {string|Date} date - Checkpoint timestamp
 * @returns {Object} Formatted date and time
 */
export const formatCheckpointTime = (date) => {
  if (!date) return { date: '', time: '' };

  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  };
};

/**
 * Check if tracking should auto-update part status
 * @param {string} tag - Tracking status tag
 * @returns {Object} Status update recommendations
 */
export const getStatusUpdateRecommendation = (tag) => {
  switch (tag) {
    case 'Delivered':
      return { delivered: true, message: 'Package delivered' };
    case 'InTransit':
    case 'OutForDelivery':
      return { shipped: true, message: 'Package in transit' };
    default:
      return null;
  }
};

/**
 * Get progress percentage for tracking status
 * @param {string} tag - Tracking status tag
 * @returns {number} Progress percentage (0-100)
 */
export const getTrackingProgress = (tag) => {
  const progressMap = {
    Pending: 10,
    InfoReceived: 20,
    InTransit: 50,
    OutForDelivery: 80,
    AttemptFail: 70,
    AvailableForPickup: 90,
    Delivered: 100,
    Exception: 50,
    Expired: 0
  };
  return progressMap[tag] || 0;
};
