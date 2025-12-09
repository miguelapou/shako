import React, { useState, useRef } from 'react';
import { X, Package, Edit2, Trash2, Check, Palette } from 'lucide-react';
import PrimaryButton from '../ui/PrimaryButton';
import {
  getVendorColor,
  getVendorDisplayColor
} from '../../utils/colorUtils';

const ManageVendorsModal = ({
  isOpen,
  darkMode,
  uniqueVendors,
  vendorColors,
  parts,
  editingVendor,
  setEditingVendor,
  updateVendorColor,
  renameVendor,
  deleteVendor,
  setConfirmDialog,
  isModalClosing,
  handleCloseModal,
  onClose
}) => {
  // State for tracking which vendor card has overlay visible (mobile only)
  const [selectedVendor, setSelectedVendor] = useState(null);
  // Ref for color inputs to trigger programmatically
  const colorInputRefs = useRef({});

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() =>
        handleCloseModal(() => {
          onClose();
          setEditingVendor(null);
        })
      }
    >
      <div
        className={`rounded-lg shadow-xl max-w-2xl w-full modal-content overflow-hidden ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => {
          e.stopPropagation();
          // Dismiss any visible overlay when clicking anywhere in the modal
          setSelectedVendor(null);
        }}
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
              Manage Vendors
            </h2>
            <button
              onClick={() =>
                handleCloseModal(() => {
                  onClose();
                  setEditingVendor(null);
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

        {/* CONTENT */}
        <div
          className="p-6 modal-scrollable"
          style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto', overscrollBehavior: 'contain' }}
        >
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
            <div className="space-y-3 max-h-[420px] sm:max-h-none overflow-y-auto overscroll-contain">
              {uniqueVendors.map((vendor) => {
                const partCount = parts.filter(
                  (p) => p.vendor === vendor
                ).length;
                const isEditing = editingVendor?.oldName === vendor;
                const isSelected = selectedVendor === vendor;
                return (
                  <div
                    key={vendor}
                    className={`relative p-4 rounded-lg border sm:cursor-default cursor-pointer ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only toggle overlay on mobile
                      if (!isEditing && window.innerWidth < 640) {
                        setSelectedVendor(isSelected ? null : vendor);
                      }
                    }}
                  >
                    {/* Main content - vendor info */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={`text-sm flex items-center gap-1 min-w-[3rem] ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}
                        >
                          <span className="w-4 text-right">{partCount}</span>
                          <Package className="w-3.5 h-3.5" />
                        </span>
                        {/* Vendor badge - always visible */}
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
                      </div>

                      {/* Inline buttons - stop propagation on container */}
                      {!isEditing && (
                        <div
                          className="flex items-stretch gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Hidden color input */}
                          <input
                            type="color"
                            ref={(el) => (colorInputRefs.current[vendor] = el)}
                            value={vendorColors[vendor] || '#6B7280'}
                            onChange={(e) => {
                              updateVendorColor(vendor, e.target.value);
                            }}
                            className="absolute opacity-0 pointer-events-none"
                            style={{ width: 0, height: 0 }}
                          />
                          {/* Palette button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              colorInputRefs.current[vendor]?.click();
                            }}
                            className={`p-2 sm:px-3 sm:py-2 rounded-lg transition-colors flex items-center ${
                              darkMode
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            }`}
                            title="Choose vendor color"
                          >
                            <Palette className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVendor({
                                oldName: vendor,
                                newName: vendor
                              });
                            }}
                            className={`p-2 sm:px-3 sm:py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              darkMode
                                ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          {/* Delete button - desktop only */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                            className={`hidden sm:flex px-3 py-2 rounded-lg font-medium transition-colors items-center gap-2 text-sm ${
                              darkMode
                                ? 'hover:bg-red-900/50 text-red-400 border border-red-700'
                                : 'hover:bg-red-100 text-red-600 border border-red-300'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit overlay with fade animation */}
                    <div
                      className={`absolute inset-0 rounded-lg flex items-center justify-center gap-2 px-4 transition-opacity duration-150 ${
                        isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      } ${darkMode ? 'bg-gray-800/95' : 'bg-gray-100/95'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVendor(null);
                      }}
                    >
                      <input
                        type="text"
                        value={isEditing ? editingVendor.newName : ''}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            newName: e.target.value
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingVendor?.newName?.trim()) {
                            if (editingVendor.newName !== vendor) {
                              renameVendor(vendor, editingVendor.newName);
                            }
                            setEditingVendor(null);
                          } else if (e.key === 'Escape') {
                            setEditingVendor(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 min-w-0 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-100'
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}
                        autoFocus={isEditing}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingVendor?.newName?.trim() && editingVendor.newName !== vendor) {
                            renameVendor(vendor, editingVendor.newName);
                          }
                          setEditingVendor(null);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'bg-gray-700 text-green-400 border border-gray-600'
                            : 'bg-white text-green-600 border border-gray-300'
                        }`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVendor(null);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'bg-gray-700 text-gray-400 border border-gray-600'
                            : 'bg-white text-gray-600 border border-gray-300'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Mobile delete overlay with fade animation */}
                    {!isEditing && (
                      <div
                        className={`sm:hidden absolute inset-0 rounded-lg flex items-center justify-center transition-opacity duration-150 ${
                          isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        } ${darkMode ? 'bg-gray-800/95' : 'bg-gray-100/95'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVendor(null);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVendor(null);
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
                          className={`p-3 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-gray-700 text-red-400 border border-gray-600'
                              : 'bg-white text-red-600 border border-gray-300'
                          }`}
                          title="Delete vendor"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`sticky bottom-0 border-t p-4 flex items-center justify-end ${
            darkMode
              ? 'border-gray-700 bg-gray-800'
              : 'border-slate-200 bg-slate-100'
          }`}
        >
          <PrimaryButton
            onClick={() =>
              handleCloseModal(() => {
                onClose();
                setEditingVendor(null);
              })
            }
          >
            Done
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default ManageVendorsModal;
