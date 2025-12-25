import React, { useRef } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { inputClasses, toTitleCase, toSentenceCase, toAllCaps } from '../../utils/styleUtils';
import { useUI } from '../../contexts';
import FadeInImage from '../ui/FadeInImage';
import ComboBox from '../ui/ComboBox';
import {
  VEHICLE_MAKES,
  VEHICLE_YEARS,
  OIL_BRANDS,
  OIL_TYPES,
  OIL_CAPACITIES,
  ODOMETER_RANGES,
  FUEL_TYPES,
  formatOdometer,
  formatOilCapacity
} from '../../utils/vehicleOptions';

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
  // Multi-image props
  vehicleImageFiles,
  setVehicleImageFiles,
  MAX_VEHICLE_IMAGES,
  addImageFile,
  removeImageFile,
  setPrimaryImageFile,
  uploadMultipleVehicleImages,
  onClose,
  setConfirmDialog
}) => {
  const { toast } = useUI();

  // Check if any fields have been filled in
  const hasUnsavedChanges = () => {
    return (
      newVehicle.nickname?.trim() ||
      newVehicle.name?.trim() ||
      newVehicle.make?.trim() ||
      newVehicle.year?.toString().trim() ||
      newVehicle.license_plate?.trim() ||
      newVehicle.vin?.trim() ||
      newVehicle.purchase_price?.toString().trim() ||
      newVehicle.purchase_date?.trim() ||
      newVehicle.fuel_filter?.trim() ||
      newVehicle.air_filter?.trim() ||
      newVehicle.oil_filter?.trim() ||
      newVehicle.oil_type?.trim() ||
      newVehicle.oil_capacity?.trim() ||
      newVehicle.oil_brand?.trim() ||
      newVehicle.drain_plug?.trim() ||
      newVehicle.battery?.trim() ||
      newVehicle.fuel_type?.trim() ||
      vehicleImageFile ||
      (vehicleImageFiles && vehicleImageFiles.length > 0)
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
        onConfirm: () => {
          onClose();
          clearImageSelection();
        }
      });
    } else {
      onClose();
      clearImageSelection();
    }
  };

  // Track if this modal was open (for close animation)
  const wasOpen = useRef(false);
  if (isOpen) wasOpen.current = true;

  // Keep modal mounted during closing animation only if THIS modal was open
  if (!isOpen && !isModalClosing) {
    wasOpen.current = false;
  }
  if (!isOpen && !(isModalClosing && wasOpen.current)) {
    return null;
  }

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
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
            Add Vehicle
          </h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVehicle.nickname}
                  onChange={(e) => setNewVehicle({ ...newVehicle, nickname: e.target.value })}
                  onBlur={(e) => setNewVehicle({ ...newVehicle, nickname: toTitleCase(e.target.value) })}
                  className={inputClasses(darkMode)}
                  placeholder="e.g. Blue Beast"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Highlight Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newVehicle.color || '#3B82F6'}
                      onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                      className="h-10 w-20 sm:w-40 rounded cursor-pointer border-2 border-gray-300"
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
                  <ComboBox
                    value={newVehicle.year}
                    onChange={(value) => setNewVehicle({ ...newVehicle, year: value })}
                    options={VEHICLE_YEARS}
                    placeholder="Select year..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter year..."
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
                  <ComboBox
                    value={newVehicle.make}
                    onChange={(value) => setNewVehicle({ ...newVehicle, make: value })}
                    options={VEHICLE_MAKES}
                    placeholder="Select make..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter make..."
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
                    onBlur={(e) => setNewVehicle({ ...newVehicle, name: toTitleCase(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g. Supra"
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
                    onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: toAllCaps(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g. ABC-1234"
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
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: toAllCaps(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g. JT2JA82J..."
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
                  <ComboBox
                    value={newVehicle.odometer_range}
                    onChange={(value) => setNewVehicle({ ...newVehicle, odometer_range: value })}
                    options={ODOMETER_RANGES}
                    placeholder="Select range..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter value..."
                    formatOption={formatOdometer}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={newVehicle.purchase_price}
                    onChange={(e) => setNewVehicle({ ...newVehicle, purchase_price: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="e.g. 15000"
                    min="0"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newVehicle.purchase_date}
                    onChange={(e) => setNewVehicle({ ...newVehicle, purchase_date: e.target.value })}
                    className={`w-36 md:w-full px-4 py-2 md:py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-100'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Multi-Image Upload */}
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Vehicle Images
                  <span className={`ml-2 text-xs font-normal ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ({vehicleImageFiles?.length || 0} / {MAX_VEHICLE_IMAGES})
                  </span>
                </label>

                {/* Image Grid */}
                {vehicleImageFiles && vehicleImageFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {vehicleImageFiles.map((imgFile, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="aspect-square">
                          <FadeInImage
                            src={imgFile.preview}
                            alt={`Image ${index + 1}`}
                            className={`w-full h-full object-cover rounded-t-lg md:rounded-lg ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}
                          />
                        </div>
                        {/* Primary badge */}
                        {imgFile.isPrimary && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
                            Primary
                          </div>
                        )}
                        {/* Mobile: bottom bar */}
                        <div className={`md:hidden flex rounded-b-lg overflow-hidden ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          {!imgFile.isPrimary && (
                            <button
                              onClick={() => setPrimaryImageFile(index)}
                              className={`flex-1 py-2 text-xs font-medium ${
                                darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                              }`}
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => removeImageFile(index)}
                            className={`flex-1 py-2 text-xs font-medium ${
                              darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                            }`}
                          >
                            Remove
                          </button>
                        </div>
                        {/* Desktop: hover overlay */}
                        <div className="hidden md:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg items-center justify-center gap-2">
                          {!imgFile.isPrimary && (
                            <button
                              onClick={() => setPrimaryImageFile(index)}
                              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              title="Set as primary"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => removeImageFile(index)}
                            className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                            title="Remove image"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button - Show if under limit */}
                {(!vehicleImageFiles || vehicleImageFiles.length < MAX_VEHICLE_IMAGES) && (
                  <label
                    onDragEnter={handleImageDragEnter}
                    onDragLeave={handleImageDragLeave}
                    onDragOver={handleImageDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        addImageFile(file, []);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      (!vehicleImageFiles || vehicleImageFiles.length === 0) ? 'min-h-[120px] md:min-h-[400px]' : 'min-h-[120px]'
                    } ${
                      isDraggingImage
                        ? darkMode
                          ? 'border-blue-500 bg-blue-900/20 scale-105'
                          : 'border-blue-500 bg-blue-50 scale-105'
                        : darkMode
                          ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700'
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <Upload className={`w-8 h-8 mb-2 ${
                        isDraggingImage
                          ? 'text-blue-500'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`mb-1 text-sm ${
                        isDraggingImage
                          ? 'text-blue-600 font-semibold'
                          : darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {isDraggingImage ? (
                          'Drop image here'
                        ) : (
                          <>
                            <span className="font-semibold">Click to add</span><span className="hidden md:inline"> or drag and drop</span>
                          </>
                        )}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        PNG, JPG, WEBP (MAX. 5MB each)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          addImageFile(file, []);
                        }
                        e.target.value = '';
                      }}
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
                    onBlur={(e) => setNewVehicle({ ...newVehicle, fuel_filter: toSentenceCase(e.target.value) })}
                    className={inputClasses(darkMode)}
                    placeholder="e.g. Bosch 0450905316"
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
                    onBlur={(e) => setNewVehicle({ ...newVehicle, air_filter: toSentenceCase(e.target.value) })}
                    className={inputClasses(darkMode)}
                    placeholder="e.g. K&N 33-2050"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Battery
                  </label>
                  <input
                    type="text"
                    value={newVehicle.battery}
                    onChange={(e) => setNewVehicle({ ...newVehicle, battery: e.target.value })}
                    onBlur={(e) => setNewVehicle({ ...newVehicle, battery: toSentenceCase(e.target.value) })}
                    className={inputClasses(darkMode)}
                    placeholder="e.g. Group 35, 650 CCA"
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
                    onBlur={(e) => setNewVehicle({ ...newVehicle, oil_filter: toSentenceCase(e.target.value) })}
                    className={inputClasses(darkMode)}
                    placeholder="e.g. Mobil 1 M1-110A"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Capacity
                  </label>
                  <ComboBox
                    value={newVehicle.oil_capacity}
                    onChange={(value) => setNewVehicle({ ...newVehicle, oil_capacity: formatOilCapacity(value) })}
                    options={OIL_CAPACITIES}
                    placeholder="Select capacity..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter capacity..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Type
                  </label>
                  <ComboBox
                    value={newVehicle.oil_type}
                    onChange={(value) => setNewVehicle({ ...newVehicle, oil_type: value })}
                    options={OIL_TYPES}
                    placeholder="Select oil type..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter type..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Brand
                  </label>
                  <ComboBox
                    value={newVehicle.oil_brand}
                    onChange={(value) => setNewVehicle({ ...newVehicle, oil_brand: value })}
                    options={OIL_BRANDS}
                    placeholder="Select oil brand..."
                    darkMode={darkMode}
                    customInputPlaceholder="Search or enter brand..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Oil Drain Plug
                  </label>
                  <input
                    type="text"
                    value={newVehicle.drain_plug}
                    onChange={(e) => setNewVehicle({ ...newVehicle, drain_plug: e.target.value })}
                    onBlur={(e) => setNewVehicle({ ...newVehicle, drain_plug: toSentenceCase(e.target.value) })}
                    className={inputClasses(darkMode)}
                    placeholder="e.g. M14x1.5"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Fuel Type
                  </label>
                  <ComboBox
                    value={newVehicle.fuel_type}
                    onChange={(value) => setNewVehicle({ ...newVehicle, fuel_type: value })}
                    options={FUEL_TYPES}
                    placeholder="Select fuel type..."
                    darkMode={darkMode}
                    allowCustom={false}
                  />
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
              onClick={async () => {
                if (!newVehicle.nickname) {
                  toast?.warning('Please enter a nickname');
                  return;
                }

                // Handle multi-image upload
                let images = [];
                let imageUrl = '';

                if (vehicleImageFiles && vehicleImageFiles.length > 0) {
                  // Upload all images
                  const uploadedImages = await uploadMultipleVehicleImages(vehicleImageFiles);
                  if (uploadedImages.length > 0) {
                    images = uploadedImages;
                    // Ensure at least one is primary
                    if (!images.some(img => img.isPrimary)) {
                      images[0].isPrimary = true;
                    }
                    // Set primary as image_url for backwards compatibility
                    const primaryImage = images.find(img => img.isPrimary) || images[0];
                    imageUrl = primaryImage?.url || '';
                  } else if (vehicleImageFiles.length > 0) {
                    // Upload failed for all images, don't proceed
                    return;
                  }
                }

                // Add vehicle with images
                await addVehicle({
                  ...newVehicle,
                  image_url: imageUrl,
                  images: images
                });
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
                  purchase_price: '',
                  purchase_date: '',
                  fuel_filter: '',
                  air_filter: '',
                  oil_filter: '',
                  oil_type: '',
                  oil_capacity: '',
                  oil_brand: '',
                  drain_plug: '',
                  battery: '',
                  fuel_type: '',
                  image_url: '',
                  images: []
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
