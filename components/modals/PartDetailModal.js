import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Car,
  Edit2,
  Trash2,
  ChevronDown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import PrimaryButton from '../ui/PrimaryButton';
import VendorSelect from '../ui/VendorSelect';
import TrackingTimeline from '../ui/TrackingTimeline';
import {
  getVendorColor,
  getVendorDisplayColor
} from '../../utils/colorUtils';
import { selectDropdownStyle } from '../../utils/styleUtils';
import { getTrackingUrl, shouldSkipShip24, getCarrierName } from '../../utils/trackingUtils';

const PartDetailModal = ({
  isOpen,
  darkMode,
  viewingPart,
  editingPart,
  partDetailView,
  setPartDetailView,
  setEditingPart,
  setOriginalPartData,
  projects,
  vehicles,
  parts,
  uniqueVendors,
  vendorColors,
  isModalClosing,
  handleCloseModal,
  saveEditedPart,
  deletePart,
  setConfirmDialog,
  setShowPartDetailModal,
  setViewingPart,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  onRefreshTracking,
  filteredParts = []
}) => {
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const checkedPartsRef = useRef(new Set()); // Track part IDs we've already checked this session
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const minSwipeDistance = 50; // Minimum swipe distance in pixels

  // Get current index and navigation functions
  const currentIndex = filteredParts.findIndex(p => p.id === viewingPart?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredParts.length - 1 && currentIndex !== -1;

  const goToPrevPart = () => {
    if (hasPrev) {
      checkedPartsRef.current.clear(); // Reset tracking check for new part
      setViewingPart(filteredParts[currentIndex - 1]);
    }
  };

  const goToNextPart = () => {
    if (hasNext) {
      checkedPartsRef.current.clear(); // Reset tracking check for new part
      setViewingPart(filteredParts[currentIndex + 1]);
    }
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      goToNextPart();
    } else if (isRightSwipe && hasPrev) {
      goToPrevPart();
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // Parse date string ensuring UTC interpretation
  // Supabase may return timestamps without 'Z' suffix, which JavaScript
  // would incorrectly parse as local time instead of UTC
  const parseAsUTC = (dateString) => {
    if (!dateString) return null;
    // If no timezone indicator, append 'Z' to treat as UTC
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.match(/T.*-\d{2}:\d{2}$/)) {
      return new Date(dateString + 'Z');
    }
    return new Date(dateString);
  };

  // Format relative time (just now, X minutes ago, etc.)
  const formatRelativeTime = (dateString) => {
    const date = parseAsUTC(dateString);
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Handle future timestamps (shouldn't happen, but just in case)
    if (diffMs < 0) return 'just now';
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  // Format time as HH:MM am/pm in user's local timezone
  const formatTime = (dateString) => {
    const date = parseAsUTC(dateString);
    if (!date) return null;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const handleRefreshTracking = async () => {
    if (!viewingPart?.id || !viewingPart?.tracking || isRefreshingTracking) return;

    // Skip URLs and Amazon tracking
    if (shouldSkipShip24(viewingPart.tracking)) return;

    setIsRefreshingTracking(true);
    setTrackingError(null);
    try {
      const response = await fetch(`/api/tracking/${viewingPart.id}`);
      const data = await response.json();

      if (data.success && data.tracking) {
        // Update the viewing part with new tracking data
        setViewingPart({
          ...viewingPart,
          ...data.tracking,
          // Auto-update delivered status if tracking shows delivered
          delivered: data.tracking.tracking_status === 'Delivered' ? true : viewingPart.delivered
        });

        // Notify parent to refresh if callback provided
        if (onRefreshTracking) {
          onRefreshTracking(viewingPart.id, data.tracking);
        }

        // Show rate limit warning if applicable
        if (data.rateLimited) {
          setTrackingError(data.rateLimitMessage || 'Rate limit reached. Showing cached data.');
        }
      } else if (data.rateLimited) {
        setTrackingError(data.error || 'API rate limit reached. Try again tomorrow.');
      } else if (data.error) {
        setTrackingError(data.error);
      }
    } catch (error) {
      console.error('Failed to refresh tracking:', error);
      setTrackingError('Failed to refresh tracking data.');
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  // Auto-refresh tracking when modal opens if data is stale (>24 hours old)
  useEffect(() => {
    setTrackingError(null);

    // Reset checked set when modal closes
    if (!isOpen) {
      checkedPartsRef.current.clear();
      return;
    }

    // Need a valid part with a tracking number
    if (!viewingPart?.id || !viewingPart?.tracking) {
      return;
    }

    // Skip URLs, Amazon tracking, and letter-only strings
    if (shouldSkipShip24(viewingPart.tracking)) {
      return;
    }

    // Never auto-refresh delivered parts
    if (viewingPart.delivered) {
      return;
    }

    // Only check once per part per modal session (prevents duplicate calls)
    if (checkedPartsRef.current.has(viewingPart.id)) {
      return;
    }

    // Mark this part as checked immediately to prevent race conditions
    checkedPartsRef.current.add(viewingPart.id);

    // Check if tracking data is fresh (less than 24 hours old)
    if (viewingPart.tracking_updated_at) {
      const lastUpdateMs = new Date(viewingPart.tracking_updated_at).getTime();
      const ageMs = Date.now() - lastUpdateMs;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      if (ageMs < twentyFourHoursMs) {
        // Data is fresh, no need to auto-refresh
        return;
      }
    }

    // Data is stale or never fetched - auto-refresh
    handleRefreshTracking();
  }, [isOpen, viewingPart?.id]);

  if (!isOpen || !viewingPart) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() =>
        handleCloseModal(() => {
          setShowPartDetailModal(false);
          setViewingPart(null);
          setPartDetailView('detail');
          setEditingPart(null);
          setOriginalPartData(null);
        })
      }
    >
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full modal-content overflow-hidden transition-all duration-700 ease-in-out grid ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        style={{
          gridTemplateRows:
            partDetailView === 'detail' ? 'auto 1fr auto' : 'auto 1fr auto',
          maxHeight: 'calc(100vh - 8rem)',
          transition: 'max-height 0.7s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* HEADER */}
        <div
          className={`sticky top-0 border-b px-6 py-4 rounded-t-lg ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
          }`}
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              className={`text-2xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}
              style={{
                fontFamily: "'FoundationOne', 'Courier New', monospace"
              }}
            >
              {partDetailView === 'edit'
                ? 'Edit Part'
                : viewingPart.part}
            </h2>
            <div className="flex items-center gap-3">
              {/* Vehicle Badge - Mobile only in edit view */}
              {partDetailView === 'edit' &&
                (() => {
                  const partProject = editingPart?.projectId
                    ? projects.find((p) => p.id === editingPart.projectId)
                    : null;
                  const vehicle = partProject?.vehicle_id
                    ? vehicles.find((v) => v.id === partProject.vehicle_id)
                    : null;
                  return (
                    vehicle && (
                      <span
                        className={`md:hidden inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 border-gray-600'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <Car className="w-3 h-3 mr-1" />
                        <span style={{ color: vehicle.color || '#3B82F6' }}>
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </span>
                    )
                  );
                })()}
              {/* Position indicator */}
              {filteredParts.length > 1 && currentIndex !== -1 && (
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {currentIndex + 1} of {filteredParts.length}
                </span>
              )}
              <button
                onClick={() =>
                  handleCloseModal(() => {
                    setShowPartDetailModal(false);
                    setViewingPart(null);
                    setPartDetailView('detail');
                    setEditingPart(null);
                    setOriginalPartData(null);
                  })
                }
                className={`transition-colors flex-shrink-0 ${
                  darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* DETAIL VIEW */}
        {partDetailView === 'detail' && (
          <div className="p-4 sm:p-6 modal-scrollable slide-in-left">
            {/* Part Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div
                className={`rounded-lg p-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Part Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Part Number, Vendor */}
                  <div className="space-y-4">
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Part Number
                      </p>
                      <p
                        className={`text-base font-mono ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}
                      >
                        {viewingPart.partNumber && viewingPart.partNumber !== '-'
                          ? viewingPart.partNumber
                          : '--'}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Vendor
                      </p>
                      {viewingPart.vendor ? (
                        vendorColors[viewingPart.vendor] ? (
                          (() => {
                            const colors = getVendorDisplayColor(
                              vendorColors[viewingPart.vendor],
                              darkMode
                            );
                            return (
                              <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium border"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderColor: colors.border
                                }}
                              >
                                {viewingPart.vendor}
                              </span>
                            );
                          })()
                        ) : (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVendorColor(
                              viewingPart.vendor,
                              vendorColors
                            )}`}
                          >
                            {viewingPart.vendor}
                          </span>
                        )
                      ) : (
                        <p
                          className={`text-base ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}
                        >
                          --
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Column 2: Vehicle, Project */}
                  <div className="space-y-4">
                    {(() => {
                      const partProject = viewingPart.projectId
                        ? projects.find((p) => p.id === viewingPart.projectId)
                        : null;
                      const vehicle = partProject?.vehicle_id
                        ? vehicles.find((v) => v.id === partProject.vehicle_id)
                        : null;
                      return (
                        <div>
                          <p
                            className={`text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}
                          >
                            Vehicle
                          </p>
                          {vehicle ? (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                darkMode
                                  ? 'bg-gray-600 text-gray-200 border-gray-500'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              <Car className="w-3.5 h-3.5 mr-1.5" />
                              <span style={{ color: vehicle.color || '#3B82F6' }}>
                                {vehicle.nickname || vehicle.name}
                              </span>
                            </span>
                          ) : (
                            <p
                              className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}
                            >
                              --
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {(() => {
                      const project = viewingPart.projectId
                        ? projects.find((p) => p.id === viewingPart.projectId)
                        : null;
                      return (
                        <div>
                          <p
                            className={`text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}
                          >
                            Project
                          </p>
                          {project ? (
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                darkMode
                                  ? 'bg-blue-900/30 text-blue-200 border border-blue-700'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {project.name}
                            </span>
                          ) : (
                            <p
                              className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}
                            >
                              --
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column - Cost Breakdown */}
              <div
                className={`rounded-lg p-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Cost Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}
                    >
                      Part Price
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                      }`}
                    >
                      ${viewingPart.price.toFixed(2)}
                    </span>
                  </div>
                  {viewingPart.shipping > 0 && (
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Shipping
                      </span>
                      <span
                        className={`text-lg font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}
                      >
                        ${viewingPart.shipping.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {viewingPart.duties > 0 && (
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}
                      >
                        Import Duties
                      </span>
                      <span
                        className={`text-lg font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}
                      >
                        ${viewingPart.duties.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`pt-3 mt-3 border-t flex justify-between items-center ${
                      darkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}
                  >
                    <span
                      className={`text-base font-semibold ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      Total
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`}
                    >
                      ${viewingPart.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {viewingPart.tracking && (
              <div
                className={`pt-6 border-t ${
                  darkMode ? 'border-gray-700' : 'border-slate-200'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Tracking Information
                </h3>

                {/* Tracking status and timeline (only for Ship24-supported tracking) */}
                {!shouldSkipShip24(viewingPart.tracking) ? (
                  <div className="space-y-4">
                    {/* Order status badge */}
                    <div className="flex flex-col items-start gap-1">
                      <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border w-fit ${getStatusColor(
                          viewingPart
                        )}`}
                      >
                        {getStatusIcon(viewingPart)}
                        <span>{getStatusText(viewingPart)}</span>
                      </div>
                      {/* Location and updated at info */}
                      {(viewingPart.tracking_location || viewingPart.tracking_updated_at) && (
                        <div className={`text-xs space-y-0.5 mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {viewingPart.tracking_location && (
                            <div>{viewingPart.tracking_location}</div>
                          )}
                          {viewingPart.tracking_updated_at && (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-1.5">
                                <span>Updated {formatRelativeTime(viewingPart.tracking_updated_at)} ({formatTime(viewingPart.tracking_updated_at)})</span>
                                {isRefreshingTracking && (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                )}
                              </div>
                              {viewingPart.tracking && (
                                <span className="ml-auto">{getCarrierName(viewingPart.tracking)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tracking timeline or loading state */}
                    {viewingPart.tracking_checkpoints && viewingPart.tracking_checkpoints.length > 0 ? (
                      <div
                        className={`rounded-lg p-4 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <TrackingTimeline
                          checkpoints={viewingPart.tracking_checkpoints}
                          status={viewingPart.tracking_status}
                          darkMode={darkMode}
                          maxVisible={4}
                          showProgress={true}
                        />
                      </div>
                    ) : isRefreshingTracking ? (
                      <div
                        className={`rounded-lg p-4 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RefreshCw className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading tracking updates...
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Error/Rate limit message */}
                    {trackingError && (
                      <div
                        className={`text-xs px-3 py-2 rounded-lg ${
                          darkMode
                            ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {trackingError}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback for URL tracking */
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border w-fit ${getStatusColor(
                      viewingPart
                    )}`}
                  >
                    {getStatusIcon(viewingPart)}
                    <span>{getStatusText(viewingPart)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW FOOTER */}
        {partDetailView === 'detail' && (
          <div
            className={`sticky bottom-0 border-t p-4 flex justify-between items-center ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-slate-200 bg-slate-100'
            }`}
          >
            {/* Track button on the left */}
            <div>
              {viewingPart.tracking && getTrackingUrl(viewingPart.tracking) && (
                <a
                  href={getTrackingUrl(viewingPart.tracking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Track
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {/* Refresh and Edit buttons on the right */}
            <div className="flex items-center gap-2">
              {viewingPart.tracking && !shouldSkipShip24(viewingPart.tracking) && (
                <button
                  onClick={handleRefreshTracking}
                  disabled={isRefreshingTracking}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isRefreshingTracking
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingTracking ? 'animate-spin' : ''}`} />
                  {isRefreshingTracking ? 'Updating...' : 'Refresh'}
                </button>
              )}
              <PrimaryButton
                onClick={() => {
                  const partData = {
                    ...viewingPart,
                    status: viewingPart.delivered
                      ? 'delivered'
                      : viewingPart.shipped
                        ? 'shipped'
                        : viewingPart.purchased
                          ? 'purchased'
                          : 'pending'
                  };
                  setEditingPart(partData);
                  setOriginalPartData({ ...partData });
                  setPartDetailView('edit');
                }}
                icon={Edit2}
              >
                Edit
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* EDIT VIEW */}
        {partDetailView === 'edit' && editingPart && (
          <div className="p-6 modal-scrollable slide-in-right relative">
            {/* Vehicle Badge - Desktop only in upper right */}
            {(() => {
              const partProject = editingPart.projectId
                ? projects.find((p) => p.id === editingPart.projectId)
                : null;
              const vehicle = partProject?.vehicle_id
                ? vehicles.find((v) => v.id === partProject.vehicle_id)
                : null;
              return (
                vehicle && (
                  <div className="hidden md:block absolute top-6 right-6 z-10">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                        darkMode
                          ? 'bg-gray-700 text-gray-300 border-gray-600'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      <Car className="w-3 h-3 mr-1" />
                      <span style={{ color: vehicle.color || '#3B82F6' }}>
                        {vehicle.nickname || vehicle.name}
                      </span>
                    </span>
                  </div>
                )
              );
            })()}

            <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
              {/* LEFT COLUMN - Non-price fields */}
              <div className="order-1 md:order-none space-y-4">
                {/* Part Name */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPart.part}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, part: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g., Front Bumper"
                    required
                  />
                </div>

                {/* Part Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={editingPart.partNumber}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        partNumber: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g., 12345-67890"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Status
                  </label>
                  <select
                    value={editingPart.status}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        status: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    style={selectDropdownStyle}
                  >
                    <option value="pending">Pending</option>
                    <option value="purchased">Ordered</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Project */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Project{' '}
                    <span
                      className={`text-xs font-normal ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      (optional)
                    </span>
                  </label>
                  <select
                    value={editingPart.projectId || ''}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        projectId: e.target.value
                          ? parseInt(e.target.value)
                          : null
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    style={selectDropdownStyle}
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Dropdown */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Vendor
                  </label>
                  <select
                    value={
                      uniqueVendors.includes(editingPart.vendor)
                        ? editingPart.vendor
                        : ''
                    }
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        vendor: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    style={selectDropdownStyle}
                  >
                    <option value="">Select a vendor...</option>
                    {uniqueVendors.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add New Vendor */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Or add new vendor:
                  </label>
                  <input
                    type="text"
                    value={
                      uniqueVendors.includes(editingPart.vendor)
                        ? ''
                        : editingPart.vendor
                    }
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditingPart({
                        ...editingPart,
                        vendor: newValue
                      });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="Enter new vendor name"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN - Price fields */}
              <div className="order-2 md:order-none flex flex-col gap-4">
                {/* Empty space to align with Part Name on left */}
                <div className="hidden md:block h-[70px]"></div>

                {/* Tracking Number */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={editingPart.tracking}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        tracking: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g., 1Z999AA10123456784"
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingPart.price}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        price: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                {/* Shipping */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Shipping ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingPart.shipping}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        shipping: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                {/* Duties */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}
                  >
                    Import Duties ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={editingPart.duties}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        duties: e.target.value
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                {/* Price Breakdown Box - aligned to bottom */}
                <div
                  className={`mt-auto border rounded-lg p-4 ${
                    darkMode
                      ? 'bg-gray-700/50 border-gray-600'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-base font-semibold ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      Total:
                    </span>
                    <span
                      className={`text-xl font-bold ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`}
                    >
                      $
                      {(
                        (parseFloat(editingPart.price) || 0) +
                        (parseFloat(editingPart.shipping) || 0) +
                        (parseFloat(editingPart.duties) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT VIEW FOOTER */}
        {partDetailView === 'edit' && (
          <div
            className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-slate-200 bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPartDetailView('detail');
                  setEditingPart(null);
                  setOriginalPartData(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
                }`}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Part',
                    message:
                      'Are you sure you want to delete this part? This action cannot be undone.',
                    confirmText: 'Delete',
                    onConfirm: async () => {
                      await deletePart(viewingPart.id);
                      setShowPartDetailModal(false);
                      setViewingPart(null);
                      setPartDetailView('detail');
                      setEditingPart(null);
                      setOriginalPartData(null);
                    }
                  });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  darkMode
                    ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const trackingChanged = editingPart.tracking &&
                    editingPart.tracking !== viewingPart.tracking &&
                    !shouldSkipShip24(editingPart.tracking);

                  await saveEditedPart();

                  // Update viewingPart with the saved changes
                  const updatedPart = {
                    ...viewingPart,
                    ...editingPart,
                    price: parseFloat(editingPart.price) || 0,
                    shipping: parseFloat(editingPart.shipping) || 0,
                    duties: parseFloat(editingPart.duties) || 0,
                    total:
                      (parseFloat(editingPart.price) || 0) +
                      (parseFloat(editingPart.shipping) || 0) +
                      (parseFloat(editingPart.duties) || 0),
                    delivered: editingPart.status === 'delivered',
                    shipped:
                      editingPart.status === 'delivered' ||
                      editingPart.status === 'shipped',
                    purchased:
                      editingPart.status === 'delivered' ||
                      editingPart.status === 'shipped' ||
                      editingPart.status === 'purchased'
                  };
                  setViewingPart(updatedPart);
                  setPartDetailView('detail');

                  // Auto-refresh tracking if tracking number was added/changed
                  if (trackingChanged) {
                    try {
                      const response = await fetch(`/api/tracking/${viewingPart.id}`);
                      const data = await response.json();
                      if (data.success && data.tracking) {
                        setViewingPart(prev => ({
                          ...prev,
                          ...data.tracking,
                          delivered: data.tracking.tracking_status === 'Delivered' ? true : prev.delivered
                        }));
                        if (onRefreshTracking) {
                          onRefreshTracking(viewingPart.id, data.tracking);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to refresh tracking:', error);
                    }
                  }
                }}
                disabled={!editingPart.part}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  !editingPart.part
                    ? darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Save Changes</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PartDetailModal;
