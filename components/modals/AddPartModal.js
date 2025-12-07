import React from 'react';
import { X } from 'lucide-react';
import { selectDropdownStyle } from '../../utils/styleUtils';

const AddPartModal = ({
  isOpen,
  darkMode,
  newPart,
  setNewPart,
  projects,
  uniqueVendors,
  isModalClosing,
  handleCloseModal,
  addNewPart,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(onClose)}
    >
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Part</h2>
          <button
            onClick={() => handleCloseModal(onClose)}
            className={`transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 modal-scrollable">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            {/* LEFT COLUMN */}
            <div className="order-1 md:order-none space-y-4">
              {/* Part Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Part Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPart.part}
                  onChange={(e) => setNewPart({ ...newPart, part: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Part Number
                </label>
                <input
                  type="text"
                  value={newPart.partNumber}
                  onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Status
                </label>
                <select
                  value={newPart.status}
                  onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                </label>
                <select
                  value={newPart.projectId || ''}
                  onChange={(e) => setNewPart({ ...newPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                  style={selectDropdownStyle}
                >
                  <option value="">No Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Vendor
                </label>
                <select
                  value={uniqueVendors.includes(newPart.vendor) ? newPart.vendor : ''}
                  onChange={(e) => setNewPart({ ...newPart, vendor: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Or add new vendor:
                </label>
                <input
                  type="text"
                  value={uniqueVendors.includes(newPart.vendor) ? '' : newPart.vendor}
                  onChange={(e) => setNewPart({ ...newPart, vendor: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="Enter new vendor name"
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="order-2 md:order-none flex flex-col gap-4">
              {/* Empty space to align with Part Name on left */}
              <div className="hidden md:block h-[70px]"></div>

              {/* Tracking Link */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Tracking Link
                </label>
                <input
                  type="text"
                  value={newPart.tracking}
                  onChange={(e) => setNewPart({ ...newPart, tracking: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={newPart.price}
                  onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
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
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Shipping ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={newPart.shipping}
                  onChange={(e) => setNewPart({ ...newPart, shipping: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="0.00"
                />
              </div>

              {/* Import Duties */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Import Duties ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={newPart.duties}
                  onChange={(e) => setNewPart({ ...newPart, duties: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="0.00"
                />
              </div>

              {/* Calculated Total - aligned to bottom */}
              <div className={`mt-auto border rounded-lg p-4 ${
                darkMode
                  ? 'bg-gray-700/50 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-semibold ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Total:
                  </span>
                  <span className={`text-xl font-bold ${
                    darkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    ${((parseFloat(newPart.price) || 0) + (parseFloat(newPart.shipping) || 0) + (parseFloat(newPart.duties) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`p-6 border-t ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
        }`}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={addNewPart}
              disabled={!newPart.part}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                !newPart.part
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Add Part
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPartModal;
