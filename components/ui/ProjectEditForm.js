import React, { useState } from 'react';
import { Car, ChevronDown } from 'lucide-react';

// ProjectEditForm - Form component for editing project details
const ProjectEditForm = ({
  project,
  onProjectChange,
  vehicles,
  parts,
  unlinkPartFromProject,
  getVendorColor,
  vendorColors,
  darkMode
}) => {
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column: Project Name, Priority/Vehicle, Budget */}
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-slate-700'
          }`}>
            Project Name
          </label>
          <input
            type="text"
            value={project.name}
            onChange={(e) => onProjectChange({ ...project, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
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
              value={project.priority}
              onChange={(e) => onProjectChange({ ...project, priority: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVehicleDropdown(!showVehicleDropdown);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {project.vehicle_id ? (() => {
                    const selectedVehicle = vehicles.find(v => v.id === project.vehicle_id);
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
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
              {showVehicleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVehicleDropdown(false)}
                  />
                  <div
                    className={`absolute right-0 md:left-0 z-20 mt-1 rounded-lg border shadow-lg py-1 max-h-60 overflow-y-auto vehicle-dropdown-scroll ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'
                    }`}
                    style={{
                      minWidth: '200px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onProjectChange({ ...project, vehicle_id: null });
                        setShowVehicleDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                        !project.vehicle_id
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
                          onProjectChange({ ...project, vehicle_id: vehicle.id });
                          setShowVehicleDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                          project.vehicle_id === vehicle.id
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
              value={project.budget}
              onChange={(e) => onProjectChange({ ...project, budget: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
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
          value={project.description}
          onChange={(e) => onProjectChange({ ...project, description: e.target.value })}
          className={`w-full h-[calc(100%-2rem)] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        />
      </div>
    </div>
  );
};

export default ProjectEditForm;
