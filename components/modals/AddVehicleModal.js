import React from 'react';
import { X, Upload } from 'lucide-react';
import { inputClasses } from '../../utils/styleUtils';

const AddVehicleModal = ({
  isOpen,
  darkMode,
  newVehicle,
  setNewVehicle,
  vehicleImagePreview,
  vehicleImageFile,
  uploadingImage,
  isDraggingImage,
  isModalClosing,
  handleCloseModal,
  addVehicle,
  uploadVehicleImage,
  clearImageSelection,
  handleImageFileChange,
  handleImageDragEnter,
  handleImageDragLeave,
  handleImageDragOver,
  handleImageDrop,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

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
        }`} style={{ zIndex: 10 }}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
            Add Vehicle
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
        <div className="p-6 modal-scrollable">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Nickname *
                </label>
                <input
                  type="text"
                  value={newVehicle.nickname}
                  onChange={(e) => setNewVehicle({ ...newVehicle, nickname: e.target.value })}
                  className={inputClasses(darkMode)}
                  placeholder=""
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Vehicle Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newVehicle.color || '#3B82F6'}
                      onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer border-2 border-gray-300"
                    />
                    <span className={`text-sm font-mono ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>{newVehicle.color || '#3B82F6'}</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Year
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                    min="1900"
                    max="2100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Make
                  </label>
                  <input
                    type="text"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={newVehicle.license_plate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    VIN
                  </label>
                  <input
                    type="text"
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Odometer Range
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newVehicle.odometer_range}
                    onChange={(e) => setNewVehicle({ ...newVehicle, odometer_range: e.target.value })}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const rounded = Math.round(value / 10000) * 10000;
                      setNewVehicle({ ...newVehicle, odometer_range: rounded || '' });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder=""
                    min="0"
                    step="10000"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Unit
                  </label>
                  <select
                    value={newVehicle.odometer_unit || 'km'}
                    onChange={(e) => setNewVehicle({ ...newVehicle, odometer_unit: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="km">Kilometers</option>
                    <option value="mi">Miles</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column - Image Upload */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Vehicle Image
                </label>
                {/* Image Preview */}
                {vehicleImagePreview && (
                  <div className="mb-3 relative">
                    <img
                      src={vehicleImagePreview}
                      alt="Preview"
                      className={`w-full h-full object-cover rounded-lg ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                      style={{ minHeight: '400px' }}
                    />
                    <button
                      onClick={clearImageSelection}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* File Upload Button */}
                {!vehicleImagePreview && (
                  <label
                    onDragEnter={handleImageDragEnter}
                    onDragLeave={handleImageDragLeave}
                    onDragOver={handleImageDragOver}
                    onDrop={handleImageDrop}
                    className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    isDraggingImage
                      ? darkMode
                        ? 'border-blue-500 bg-blue-900/20 scale-105'
                        : 'border-blue-500 bg-blue-50 scale-105'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                  }`} style={{ minHeight: '400px' }}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className={`w-12 h-12 mb-3 ${
                        isDraggingImage
                          ? 'text-blue-500'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`mb-2 text-sm ${
                        isDraggingImage
                          ? 'text-blue-600 font-semibold'
                          : darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {isDraggingImage ? (
                          'Drop image here'
                        ) : (
                          <>
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        PNG, JPG, WEBP (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Section - Full Width */}
          <div className="mt-6">
            <div className={`pt-4 border-t ${
              darkMode ? 'border-gray-700' : 'border-slate-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Maintenance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Fuel Filter
                  </label>
                  <input
                    type="text"
                    value={newVehicle.fuel_filter}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuel_filter: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Air Filter
                  </label>
                  <input
                    type="text"
                    value={newVehicle.air_filter}
                    onChange={(e) => setNewVehicle({ ...newVehicle, air_filter: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Battery Type
                  </label>
                  <input
                    type="text"
                    value={newVehicle.battery}
                    onChange={(e) => setNewVehicle({ ...newVehicle, battery: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Filter
                  </label>
                  <input
                    type="text"
                    value={newVehicle.oil_filter}
                    onChange={(e) => setNewVehicle({ ...newVehicle, oil_filter: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Capacity
                  </label>
                  <input
                    type="text"
                    value={newVehicle.oil_capacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, oil_capacity: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Type
                  </label>
                  <input
                    type="text"
                    value={newVehicle.oil_type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, oil_type: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Brand
                  </label>
                  <input
                    type="text"
                    value={newVehicle.oil_brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, oil_brand: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Drain Plug
                  </label>
                  <input
                    type="text"
                    value={newVehicle.drain_plug}
                    onChange={(e) => setNewVehicle({ ...newVehicle, drain_plug: e.target.value })}
                    className={inputClasses(darkMode)}
                    placeholder=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}></div>
        <div className="p-6">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                clearImageSelection();
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!newVehicle.nickname) {
                  alert('Please enter a nickname');
                  return;
                }
                // Upload image if one is selected
                let imageUrl = '';
                if (vehicleImageFile) {
                  imageUrl = await uploadVehicleImage(vehicleImageFile);
                  if (!imageUrl) {
                    return; // Upload failed, don't proceed
                  }
                }
                // Add vehicle with image URL
                await addVehicle({ ...newVehicle, image_url: imageUrl });
                onClose();
                setNewVehicle({
                  nickname: '',
                  name: '',
                  make: '',
                  year: '',
                  license_plate: '',
                  vin: '',
                  odometer_range: '',
                  odometer_unit: 'km',
                  fuel_filter: '',
                  air_filter: '',
                  oil_filter: '',
                  oil_type: '',
                  oil_capacity: '',
                  oil_brand: '',
                  drain_plug: '',
                  battery: '',
                  image_url: ''
                });
                clearImageSelection();
              }}
              disabled={!newVehicle.nickname || uploadingImage}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                !newVehicle.nickname || uploadingImage
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {uploadingImage ? 'Uploading...' : 'Add Vehicle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
