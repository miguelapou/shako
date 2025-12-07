import React, { useRef, useState, useCallback } from 'react';
import { X, Car, ChevronDown } from 'lucide-react';
import { useUI } from '../../contexts';

const AddProjectModal = ({
  isOpen,
  darkMode,
  newProject,
  setNewProject,
  vehicles,
  showAddProjectVehicleDropdown,
  setShowAddProjectVehicleDropdown,
  isModalClosing,
  handleCloseModal,
  addProject,
  onClose
}) => {
  const vehicleButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isDropdownClosing, setIsDropdownClosing] = useState(false);
  const { toast } = useUI();

  const closeDropdownWithAnimation = useCallback(() => {
    setIsDropdownClosing(true);
    setTimeout(() => {
      setIsDropdownClosing(false);
      setShowAddProjectVehicleDropdown(false);
    }, 150);
  }, [setShowAddProjectVehicleDropdown]);

  if (!isOpen) return null;

  const handleVehicleDropdownToggle = (e) => {
    e.stopPropagation();
    if (showAddProjectVehicleDropdown) {
      closeDropdownWithAnimation();
    } else {
      if (vehicleButtonRef.current) {
        const rect = vehicleButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      }
      setShowAddProjectVehicleDropdown(true);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name) {
      toast?.warning('Please enter a project name');
      return;
    }
    await addProject(newProject);
    setNewProject({
      name: '',
      description: '',
      budget: '',
      priority: 'not_set',
      status: 'planning'
    });
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
        isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleCloseModal(onClose)}
    >
      <div
        className={`rounded-lg shadow-xl max-w-4xl w-full modal-content grid ${
          isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        style={{
          gridTemplateRows: 'auto 1fr auto',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
            Add Project
          </h2>
          <button
            onClick={() => handleCloseModal(onClose)}
            className={`transition-colors ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - takes flexible space */}
        <div className="p-6 overflow-visible" style={{ minHeight: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Project Name, Priority/Vehicle, Budget */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="e.g., Interior Restoration"
                  required
                />
              </div>

              {/* Priority and Vehicle Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Priority
                  </label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-h-[42px] box-border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="not_set">Not Set</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      <span>Vehicle</span>
                    </div>
                  </label>
                  <div className="relative">
                    <button
                      ref={vehicleButtonRef}
                      type="button"
                      onClick={handleVehicleDropdownToggle}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between gap-2 min-h-[42px] box-border ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-100'
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {newProject.vehicle_id ? (() => {
                          const selectedVehicle = vehicles.find(v => v.id === newProject.vehicle_id);
                          return selectedVehicle ? (
                            <>
                              <div
                                className="w-3 h-3 rounded-full border flex-shrink-0"
                                style={{
                                  backgroundColor: selectedVehicle.color || '#3B82F6',
                                  borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                                }}
                              />
                              <span className="truncate">{selectedVehicle.nickname || selectedVehicle.name}</span>
                            </>
                          ) : 'No vehicle';
                        })() : 'No vehicle'}
                      </div>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showAddProjectVehicleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showAddProjectVehicleDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-[60]"
                          onClick={closeDropdownWithAnimation}
                        />
                        <div className={`fixed z-[70] rounded-lg border shadow-lg py-1 ${
                          isDropdownClosing ? 'dropdown-fade-out' : 'dropdown-fade-in'
                        } ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'}`}
                        style={{
                          minWidth: '200px',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left
                        }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setNewProject({ ...newProject, vehicle_id: null });
                              setShowAddProjectVehicleDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                              !newProject.vehicle_id
                                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            No vehicle
                          </button>
                          {vehicles.map(vehicle => (
                            <button
                              key={vehicle.id}
                              type="button"
                              onClick={() => {
                                setNewProject({ ...newProject, vehicle_id: vehicle.id });
                                setShowAddProjectVehicleDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                newProject.vehicle_id === vehicle.id
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
              </div>

              {/* Budget Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Description (taller) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-slate-700'
              }`}>
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className={`w-full h-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
                placeholder="Brief description of the project"
              />
            </div>
          </div>
        </div>

        {/* Footer - natural height only */}
        <div className={`p-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
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
              onClick={handleAddProject}
              disabled={!newProject.name}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                !newProject.name
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Add Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
