import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Car, ChevronDown } from 'lucide-react';
import { selectDropdownStyle, inputClasses } from '../../utils/styleUtils';

const AddPartModal = ({
  isOpen,
  darkMode,
  newPart,
  setNewPart,
  projects,
  vehicles,
  uniqueVendors,
  isModalClosing,
  handleCloseModal,
  addNewPart,
  onClose,
  setConfirmDialog
}) => {
  // Track if this modal was open (for close animation)
  const wasOpen = useRef(false);
  if (isOpen) wasOpen.current = true;

  // Vehicle dropdown state
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [isDropdownClosing, setIsDropdownClosing] = useState(false);

  const closeDropdownWithAnimation = useCallback(() => {
    setIsDropdownClosing(true);
    setTimeout(() => {
      setIsDropdownClosing(false);
      setShowVehicleDropdown(false);
    }, 150);
  }, []);

  // Get the selected project
  const selectedProject = newPart.projectId ? projects.find(p => p.id === newPart.projectId) : null;
  // Get the vehicle from the selected project (for auto-population display)
  const projectVehicle = selectedProject?.vehicle_id ? vehicles?.find(v => v.id === selectedProject.vehicle_id) : null;
  // Determine the effective vehicle (project's vehicle takes priority)
  const effectiveVehicleId = selectedProject ? selectedProject.vehicle_id : newPart.vehicleId;
  const effectiveVehicle = effectiveVehicleId ? vehicles?.find(v => v.id === effectiveVehicleId) : null;
  // Check if vehicle is auto-populated from project
  const isVehicleAutoPopulated = selectedProject && selectedProject.vehicle_id;

  // Auto-populate vehicle when project changes
  useEffect(() => {
    if (selectedProject && selectedProject.vehicle_id) {
      // When a project is selected, set the vehicle to the project's vehicle
      setNewPart(prev => ({ ...prev, vehicleId: selectedProject.vehicle_id }));
    }
  }, [selectedProject, setNewPart]);

  // Check if any fields have been filled in
  const hasUnsavedChanges = () => {
    return (
      newPart.part?.trim() ||
      newPart.partNumber?.trim() ||
      newPart.vendor?.trim() ||
      newPart.tracking?.trim() ||
      parseFloat(newPart.price) > 0 ||
      parseFloat(newPart.shipping) > 0 ||
      parseFloat(newPart.duties) > 0 ||
      newPart.projectId ||
      newPart.vehicleId ||
      newPart.status !== 'pending'
    );
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Are you sure you want to close without saving?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        onConfirm: onClose
      });
    } else {
      onClose();
    }
  };

  // Keep modal mounted during closing animation only if THIS modal was open
  if (!isOpen && !isModalClosing) wasOpen.current = false;
  if (!isOpen && !(isModalClosing && wasOpen.current)) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(handleClose)}
    >
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Part</h2>
          <button
            onClick={() => handleCloseModal(handleClose)}
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
                  className={inputClasses(darkMode)}
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
                  className={inputClasses(darkMode)}
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
                  onChange={(e) => {
                    const projectId = e.target.value ? parseInt(e.target.value) : null;
                    const project = projectId ? projects.find(p => p.id === projectId) : null;
                    // When project changes, update vehicleId: set to project's vehicle, or clear if no project
                    setNewPart({
                      ...newPart,
                      projectId,
                      vehicleId: projectId ? (project?.vehicle_id || null) : null
                    });
                  }}
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

              {/* Vehicle */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <span>Vehicle</span>
                    {isVehicleAutoPopulated && (
                      <span className={`text-xs font-normal ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        (from project)
                      </span>
                    )}
                    {!isVehicleAutoPopulated && (
                      <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    )}
                  </div>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't allow changing vehicle if it's auto-populated from project
                      if (isVehicleAutoPopulated) return;
                      if (showVehicleDropdown) {
                        closeDropdownWithAnimation();
                      } else {
                        setShowVehicleDropdown(true);
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between gap-2 min-h-[42px] box-border ${
                      isVehicleAutoPopulated
                        ? darkMode
                          ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-default'
                          : 'bg-slate-100 border-slate-300 text-slate-600 cursor-default'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {effectiveVehicle ? (
                        <>
                          <div
                            className="w-3 h-3 rounded-full border flex-shrink-0"
                            style={{
                              backgroundColor: effectiveVehicle.color || '#3B82F6',
                              borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                            }}
                          />
                          <span className="truncate">{effectiveVehicle.nickname || effectiveVehicle.name}</span>
                        </>
                      ) : (
                        <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>No vehicle</span>
                      )}
                    </div>
                    {!isVehicleAutoPopulated && (
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showVehicleDropdown ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  {showVehicleDropdown && !isVehicleAutoPopulated && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={closeDropdownWithAnimation}
                      />
                      <div
                        className={`absolute left-0 z-20 mt-1 rounded-lg border shadow-lg py-1 max-h-60 overflow-y-auto vehicle-dropdown-scroll w-full ${
                          isDropdownClosing ? 'dropdown-fade-out' : 'dropdown-fade-in'
                        } ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'}`}
                        style={{
                          minWidth: '200px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setNewPart({ ...newPart, vehicleId: null });
                            setShowVehicleDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                            !newPart.vehicleId
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          No vehicle
                        </button>
                        {vehicles?.filter(v => !v.archived).map(vehicle => (
                          <button
                            key={vehicle.id}
                            type="button"
                            onClick={() => {
                              setNewPart({ ...newPart, vehicleId: vehicle.id });
                              setShowVehicleDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                              newPart.vehicleId === vehicle.id
                                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full border flex-shrink-0"
                              style={{
                                backgroundColor: vehicle.color || '#3B82F6',
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                              }}
                            />
                            <span className="truncate">
                              {vehicle.nickname ? `${vehicle.nickname} (${vehicle.name})` : `${vehicle.name}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
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
                  className={inputClasses(darkMode)}
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
                  Tracking Number/Link
                </label>
                <input
                  type="text"
                  value={newPart.tracking}
                  onChange={(e) => setNewPart({ ...newPart, tracking: e.target.value })}
                  className={inputClasses(darkMode)}
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
                  className={inputClasses(darkMode, '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
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
                  className={inputClasses(darkMode, '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
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
                  className={inputClasses(darkMode, '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
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
              onClick={handleClose}
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
