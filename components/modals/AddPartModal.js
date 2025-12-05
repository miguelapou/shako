import React from 'react';
import { X } from 'lucide-react';
import VendorSelect from '../ui/VendorSelect';
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
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
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
            <div></div>
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
                placeholder="e.g., FedEx, USPS"
              />
            </div>
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
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-slate-700'
              }`}>
                Vendor
              </label>
              <VendorSelect
                value={newPart.vendor}
                onChange={(value) => setNewPart({ ...newPart, vendor: value })}
                darkMode={darkMode}
                uniqueVendors={uniqueVendors}
              />
            </div>

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
            {(newPart.price || newPart.shipping || newPart.duties) && (
              <div className={`md:col-span-2 border rounded-lg p-4 ${
                darkMode
                  ? 'bg-blue-900/30 border-blue-700'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Calculated Total:</span>
                  <span className={`text-2xl font-bold ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    ${((parseFloat(newPart.price) || 0) + (parseFloat(newPart.shipping) || 0) + (parseFloat(newPart.duties) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={`border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}></div>
        <div className="p-6">
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
