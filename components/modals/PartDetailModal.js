import React from 'react';
import {
  X,
  Car,
  Edit2,
  Trash2,
  Settings,
  Package,
  Check,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import PrimaryButton from '../ui/PrimaryButton';
import VendorSelect from '../ui/VendorSelect';
import {
  getVendorColor,
  getVendorDisplayColor
} from '../../utils/colorUtils';
import { selectDropdownStyle } from '../../utils/styleUtils';
import { getTrackingUrl, getCarrierName } from '../../utils/trackingUtils';

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
  editingVendor,
  setEditingVendor,
  isModalClosing,
  handleCloseModal,
  saveEditedPart,
  deletePart,
  updateVendorColor,
  renameVendor,
  deleteVendor,
  confirmDialog,
  setConfirmDialog,
  setShowPartDetailModal,
  setViewingPart,
  getStatusColor,
  getStatusIcon,
  getStatusText
}) => {
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
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
        style={{
          gridTemplateRows:
            partDetailView === 'detail' ? 'auto 1fr auto' : 'auto 1fr auto',
          maxHeight:
            partDetailView === 'detail'
              ? 'calc(100vh - 2rem)'
              : 'calc(100vh - 2rem)',
          transition: 'max-height 0.7s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
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
              {partDetailView === 'manage-vendors'
                ? 'Vendors'
                : partDetailView === 'edit'
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
            {/* Status Badge (left) and Vehicle Badge (right) on same row */}
            <div className="flex items-center justify-between mb-6 gap-3">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                  viewingPart
                )}`}
              >
                {getStatusIcon(viewingPart)}
                <span>{getStatusText(viewingPart)}</span>
              </div>
              {(() => {
                const partProject = viewingPart.projectId
                  ? projects.find((p) => p.id === viewingPart.projectId)
                  : null;
                const vehicle = partProject?.vehicle_id
                  ? vehicles.find((v) => v.id === partProject.vehicle_id)
                  : null;
                return (
                  vehicle && (
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
                  )
                );
              })()}
            </div>

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
                <div className="space-y-4">
                  {viewingPart.partNumber &&
                    viewingPart.partNumber !== '-' && (
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
                          {viewingPart.partNumber}
                        </p>
                      </div>
                    )}
                  {/* Vendor and Project on same row */}
                  <div className="grid grid-cols-2 gap-4">
                    {viewingPart.vendor && (
                      <div>
                        <p
                          className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}
                        >
                          Vendor
                        </p>
                        {vendorColors[viewingPart.vendor] ? (
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
                        )}
                      </div>
                    )}
                    {viewingPart.projectId &&
                      (() => {
                        const project = projects.find(
                          (p) => p.id === viewingPart.projectId
                        );
                        return (
                          project && (
                            <div>
                              <p
                                className={`text-sm font-medium mb-2 ${
                                  darkMode
                                    ? 'text-gray-400'
                                    : 'text-slate-600'
                                }`}
                              >
                                Project
                              </p>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  darkMode
                                    ? 'bg-blue-900/30 text-blue-200 border border-blue-700'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {project.name}
                              </span>
                            </div>
                          )
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
                  className={`text-lg font-semibold mb-3 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}
                >
                  Tracking Information
                </h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}
                  >
                    Carrier:
                  </span>
                  {getTrackingUrl(viewingPart.tracking) ? (
                    <a
                      href={getTrackingUrl(viewingPart.tracking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Track via {getCarrierName(viewingPart.tracking)}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span
                      className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                        darkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {getCarrierName(viewingPart.tracking)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW FOOTER */}
        {partDetailView === 'detail' && (
          <div
            className={`sticky bottom-0 border-t p-4 flex justify-end ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-slate-200 bg-slate-100'
            }`}
          >
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
                onClick={() => setPartDetailView('manage-vendors')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4" />
                Vendors
              </button>
              <button
                onClick={async () => {
                  await saveEditedPart();
                  // Update viewingPart with the saved changes
                  setViewingPart({
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
                  });
                  setPartDetailView('detail');
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

        {/* MANAGE VENDORS VIEW */}
        {partDetailView === 'manage-vendors' && (
          <div className="p-6 modal-scrollable slide-in-right">
            {uniqueVendors.length === 0 ? (
              <div
                className={`text-center py-12 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}
              >
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>
                  No vendors yet. Add parts with vendors to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uniqueVendors.map((vendor) => {
                  const partCount = parts.filter(
                    (p) => p.vendor === vendor
                  ).length;
                  const isEditing = editingVendor?.oldName === vendor;
                  return (
                    <div
                      key={vendor}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingVendor.newName}
                              onChange={(e) =>
                                setEditingVendor({
                                  ...editingVendor,
                                  newName: e.target.value
                                })
                              }
                              className={`w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode
                                  ? 'bg-gray-800 border-gray-600 text-gray-100'
                                  : 'bg-slate-50 border-slate-300 text-slate-800'
                              }`}
                              autoFocus
                            />
                          ) : (
                            <>
                              {vendorColors[vendor] ? (
                                (() => {
                                  const colors = getVendorDisplayColor(
                                    vendorColors[vendor],
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
                                      {vendor}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVendorColor(
                                    vendor,
                                    vendorColors
                                  )}`}
                                >
                                  {vendor}
                                </span>
                              )}
                              <span
                                className={`text-sm ${
                                  darkMode
                                    ? 'text-gray-400'
                                    : 'text-slate-600'
                                }`}
                              >
                                {partCount} {partCount === 1 ? 'part' : 'parts'}
                              </span>
                            </>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={vendorColors[vendor] || '#6B7280'}
                              onChange={(e) => {
                                updateVendorColor(vendor, e.target.value);
                              }}
                              className="w-10 h-10 rounded border cursor-pointer"
                              style={{
                                backgroundColor: 'transparent',
                                border: `2px solid ${
                                  darkMode ? '#4B5563' : '#D1D5DB'
                                }`
                              }}
                              title="Choose vendor color"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  renameVendor(
                                    vendor,
                                    editingVendor.newName
                                  );
                                  setEditingVendor(null);
                                }}
                                disabled={
                                  !editingVendor.newName.trim() ||
                                  editingVendor.newName === vendor
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  !editingVendor.newName.trim() ||
                                  editingVendor.newName === vendor
                                    ? darkMode
                                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : darkMode
                                      ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                                      : 'bg-green-50 hover:bg-green-100 text-green-600'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingVendor(null)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setEditingVendor({
                                    oldName: vendor,
                                    newName: vendor
                                  })
                                }
                                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                  darkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                }`}
                              >
                                <Edit2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Delete Vendor',
                                    message: `Are you sure you want to delete "${vendor}"? This will remove the vendor from ${partCount} ${
                                      partCount === 1 ? 'part' : 'parts'
                                    }.`,
                                    confirmText: 'Delete',
                                    onConfirm: () => deleteVendor(vendor)
                                  });
                                }}
                                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                  darkMode
                                    ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                                    : 'bg-red-50 hover:bg-red-100 text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MANAGE VENDORS VIEW FOOTER */}
        {partDetailView === 'manage-vendors' && (
          <div
            className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
              darkMode
                ? 'border-gray-700 bg-gray-800'
                : 'border-slate-200 bg-slate-100'
            }`}
          >
            <button
              onClick={() => {
                setPartDetailView('edit');
                setEditingVendor(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
              }`}
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <PrimaryButton
              onClick={() => {
                setPartDetailView('edit');
                setEditingVendor(null);
              }}
            >
              Done
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartDetailModal;
