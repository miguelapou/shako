import React, { useRef } from 'react';
import { X, Package, Edit2, Trash2, Check, Palette } from 'lucide-react';
import PrimaryButton from '../ui/PrimaryButton';
import {
  getVendorColor,
  getVendorDisplayColor
} from '../../utils/colorUtils';
import { toSentenceCase } from '../../utils/styleUtils';

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
  // Debounce timer for color picker to prevent rapid-fire DB calls while dragging
  const colorDebounceRef = useRef(null);

  // Track if this modal was open (for close animation)
  const wasOpen = useRef(false);
  if (isOpen) wasOpen.current = true;

  if (!isOpen && !isModalClosing) {
    wasOpen.current = false;
  }
  if (!isOpen && !(isModalClosing && wasOpen.current)) return null;

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
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className={`sticky top-0 z-10 border-b px-6 py-4 rounded-t-lg ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'
          }`}
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
            <table className="w-full">
              <thead>
                <tr
                  className={`text-xs uppercase tracking-wide border-b ${
                    darkMode
                      ? 'text-gray-400 border-gray-600'
                      : 'text-slate-500 border-slate-300'
                  }`}
                >
                  <th className="text-left pb-2 font-medium">Vendor</th>
                  <th className="text-center pb-2 font-medium px-4">Parts</th>
                  <th className="text-center pb-2 font-medium px-4">Color</th>
                  <th className="text-right pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uniqueVendors.map((vendor) => {
                  const partCount = parts.filter(
                    (p) => p.vendor === vendor
                  ).length;
                  const isEditing = editingVendor?.oldName === vendor;

                  return (
                    <tr
                      key={vendor}
                      className={`border-b last:border-b-0 ${
                        darkMode ? 'border-gray-700' : 'border-slate-200'
                      }`}
                    >
                      {/* Vendor name cell */}
                      <td className="py-3 pr-3">
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingVendor?.newName?.trim()) {
                                const formattedName = toSentenceCase(editingVendor.newName.trim());
                                if (formattedName !== vendor) {
                                  renameVendor(vendor, formattedName);
                                }
                                setEditingVendor(null);
                              } else if (e.key === 'Escape') {
                                setEditingVendor(null);
                              }
                            }}
                            className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-100'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                            autoFocus
                          />
                        ) : vendorColors[vendor] ? (
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
                      </td>

                      {/* Parts count cell */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm flex items-center justify-center gap-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{partCount}</span>
                        </span>
                      </td>

                      {/* Color picker cell */}
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`relative inline-flex p-2 rounded-lg transition-colors cursor-pointer ${
                            darkMode
                              ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200'
                              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Choose vendor color"
                        >
                          <Palette className="w-4 h-4" />
                          <input
                            type="color"
                            value={vendorColors[vendor] || '#6B7280'}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
                              colorDebounceRef.current = setTimeout(() => {
                                updateVendorColor(vendor, newColor);
                              }, 300);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            style={{ width: '100%', height: '100%' }}
                            tabIndex={-1}
                          />
                        </div>
                      </td>

                      {/* Actions cell */}
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => {
                                  if (editingVendor?.newName?.trim()) {
                                    const formattedName = toSentenceCase(editingVendor.newName.trim());
                                    if (formattedName !== vendor) {
                                      renameVendor(vendor, formattedName);
                                    }
                                  }
                                  setEditingVendor(null);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-green-400 hover:bg-gray-700'
                                    : 'text-green-600 hover:bg-gray-100'
                                }`}
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingVendor(null)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-700'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Cancel"
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
                                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                title="Edit vendor name"
                              >
                                <Edit2 className="w-4 h-4" />
                                <span className="text-sm hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() =>
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Delete Vendor',
                                    message: `Are you sure you want to delete "${vendor}"? This will remove the vendor from ${partCount} ${
                                      partCount === 1 ? 'part' : 'parts'
                                    }.`,
                                    confirmText: 'Delete',
                                    onConfirm: () => deleteVendor(vendor)
                                  })
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-red-400 hover:bg-red-900/50'
                                    : 'text-red-600 hover:bg-red-100'
                                }`}
                                title="Delete vendor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`sticky bottom-0 border-t p-4 flex items-center justify-end ${
            darkMode
              ? 'border-gray-600 bg-gray-700'
              : 'border-slate-300 bg-slate-100'
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
