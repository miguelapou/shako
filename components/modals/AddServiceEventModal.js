import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useUI } from '../../contexts';

/**
 * Modal for adding/editing a service event for a vehicle
 * Manages its own closing animation state internally
 */
const AddServiceEventModal = ({
  isOpen,
  onClose,
  darkMode,
  // Form state
  eventDate,
  setEventDate,
  description,
  setDescription,
  odometer,
  setOdometer,
  // Edit mode
  editingEvent,
  // Handlers
  onSave,
  onDelete,
  saving
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useUI();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleSave = async () => {
    if (!eventDate) {
      toast?.warning('Please select a date');
      return;
    }
    if (!description.trim()) {
      toast?.warning('Please enter a description');
      return;
    }
    const result = await onSave();
    if (result) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!editingEvent;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] modal-backdrop ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-lg shadow-xl max-w-md w-full mx-4 modal-content ${
          isClosing ? 'modal-popup-exit' : 'modal-popup-enter'
        } ${darkMode ? 'bg-gray-800' : 'bg-slate-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
            {isEditMode ? 'Edit Service Event' : 'Add Service Event'}
          </h3>
          <button
            onClick={handleClose}
            className={`p-1 rounded transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Date field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Date *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
          </div>

          {/* Description field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              placeholder="e.g., Oil change, Brake pads replaced"
            />
          </div>

          {/* Odometer field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Odometer
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              placeholder="e.g., 125000"
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between gap-3 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Delete button - mobile only, edit mode only */}
          {isEditMode && onDelete ? (
            <button
              onClick={() => {
                onDelete();
                handleClose();
              }}
              className={`md:hidden px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-red-900/50 hover:bg-red-900 text-red-400'
                  : 'bg-red-100 hover:bg-red-200 text-red-600'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !eventDate || !description.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                saving || !eventDate || !description.trim()
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? 'Saving...' : (isEditMode ? 'Update' : 'Add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceEventModal;
