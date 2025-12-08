import React from 'react';
import {
  Clock,
  Tag,
  Truck,
  Package,
  AlertCircle,
  CheckCircle,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import {
  getTrackingStatusConfig,
  getTrackingBadgeClasses,
  formatETA,
  formatRelativeTime
} from '../../utils/trackingStatusMap';

// Map icon names to Lucide components
const ICON_MAP = {
  clock: Clock,
  tag: Tag,
  truck: Truck,
  package: Package,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'map-pin': MapPin,
  'alert-triangle': AlertTriangle
};

/**
 * TrackingBadge Component
 * Displays tracking status with icon, label, and optional details
 */
const TrackingBadge = ({
  status,
  location,
  eta,
  updatedAt,
  darkMode,
  size = 'default', // 'small', 'default', 'large'
  showLocation = false,
  showEta = false,
  showUpdatedAt = false,
  className = ''
}) => {
  if (!status) return null;

  const config = getTrackingStatusConfig(status);
  const badgeClasses = getTrackingBadgeClasses(status, darkMode);
  const IconComponent = ICON_MAP[config.icon] || Package;

  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    large: 'text-sm px-3 py-1.5'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    large: 'w-4 h-4'
  };

  const formattedEta = eta ? formatETA(eta) : null;
  const formattedUpdated = updatedAt ? formatRelativeTime(updatedAt) : null;
  const formattedTime = updatedAt ? new Date(updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : null;

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${badgeClasses} ${sizeClasses[size]}`}
        title={config.description}
      >
        <IconComponent className={iconSizes[size]} />
        <span>{size === 'small' ? config.shortLabel : config.label}</span>
      </span>

      {(showLocation || showEta || showUpdatedAt) && (
        <div className={`flex flex-col gap-0.5 ${size === 'small' ? 'text-[10px]' : 'text-xs'}`}>
          {showLocation && location && (
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {location}
            </span>
          )}
          {showEta && formattedEta && status !== 'Delivered' && (
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              ETA: {formattedEta}
            </span>
          )}
          {showUpdatedAt && formattedUpdated && (
            <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
              Updated {formattedUpdated}{formattedTime && ` (${formattedTime})`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingBadge;
