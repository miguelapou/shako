import React, { useState } from 'react';
import {
  Clock,
  Tag,
  Truck,
  Package,
  AlertCircle,
  CheckCircle,
  MapPin,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getTrackingStatusConfig,
  formatCheckpointTime,
  getTrackingProgress
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
 * Progress bar showing overall tracking progress
 */
const TrackingProgressBar = ({ status, darkMode }) => {
  const progress = getTrackingProgress(status);
  const config = getTrackingStatusConfig(status);

  const colorClasses = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    cyan: 'bg-cyan-500',
    red: 'bg-red-500'
  };

  return (
    <div className="w-full mb-4">
      <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[config.color] || 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Single checkpoint item in the timeline
 */
const CheckpointItem = ({ checkpoint, isFirst, isLast, darkMode }) => {
  const config = getTrackingStatusConfig(checkpoint.tag);
  const IconComponent = ICON_MAP[config.icon] || Package;
  const { date, time } = formatCheckpointTime(checkpoint.checkpoint_time || checkpoint.created_at);

  return (
    <div className="flex gap-3">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isFirst
              ? darkMode
                ? config.bgDark + ' ' + config.textDark
                : config.bgLight + ' ' + config.textLight
              : darkMode
                ? 'bg-gray-700 text-gray-400'
                : 'bg-gray-200 text-gray-500'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 min-h-[24px] ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                isFirst
                  ? darkMode
                    ? 'text-gray-100'
                    : 'text-gray-900'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-600'
              }`}
            >
              {checkpoint.subtag_message || checkpoint.message || config.label}
            </p>
            {checkpoint.location && (
              <p
                className={`text-xs mt-0.5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {checkpoint.location}
              </p>
            )}
          </div>
          <div className={`text-xs text-right flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div>{date}</div>
            <div>{time}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TrackingTimeline Component
 * Displays a vertical timeline of tracking checkpoints
 */
const TrackingTimeline = ({
  checkpoints = [],
  status,
  darkMode,
  maxVisible = 3,
  showProgress = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!checkpoints || checkpoints.length === 0) {
    return (
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${className}`}>
        No tracking updates yet
      </div>
    );
  }

  // Sort checkpoints by time (newest first)
  const sortedCheckpoints = [...checkpoints].sort((a, b) => {
    const timeA = new Date(a.checkpoint_time || a.created_at);
    const timeB = new Date(b.checkpoint_time || b.created_at);
    return timeB - timeA;
  });

  const visibleCheckpoints = expanded
    ? sortedCheckpoints
    : sortedCheckpoints.slice(0, maxVisible);

  const hasMore = sortedCheckpoints.length > maxVisible;

  // Calculate approximate height per checkpoint for animation
  const checkpointHeight = 64; // approximate height per checkpoint in pixels
  const collapsedHeight = maxVisible * checkpointHeight;
  const expandedHeight = sortedCheckpoints.length * checkpointHeight;

  return (
    <div className={className}>
      {showProgress && status && (
        <TrackingProgressBar status={status} darkMode={darkMode} />
      )}

      <div
        className="relative overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: expanded ? `${expandedHeight}px` : `${collapsedHeight}px`
        }}
      >
        {sortedCheckpoints.map((checkpoint, index) => (
          <CheckpointItem
            key={checkpoint.checkpoint_time || index}
            checkpoint={checkpoint}
            isFirst={index === 0}
            isLast={index === sortedCheckpoints.length - 1}
            darkMode={darkMode}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 text-sm font-medium mt-2 ${
            darkMode
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {sortedCheckpoints.length - maxVisible} more updates
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default TrackingTimeline;
