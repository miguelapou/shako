import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Package, ChevronDown, Check } from 'lucide-react';
import { useUI } from '../../contexts';
import { getVendorDisplayColor } from '../../utils/colorUtils';

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
  notes,
  setNotes,
  linkedPartIds,
  setLinkedPartIds,
  // Parts data
  parts = [],
  vendorColors = {},
  // Edit mode
  editingEvent,
  // Handlers
  onSave,
  onDelete,
  saving
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);
  const [partsSearchTerm, setPartsSearchTerm] = useState('');
  const partsDropdownRef = useRef(null);
  const { toast } = useUI();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partsDropdownRef.current && !partsDropdownRef.current.contains(event.target)) {
        setShowPartsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure linkedPartIds is always an array
  const safeLinkedPartIds = linkedPartIds || [];

  // Filter parts based on search term
  const filteredParts = parts.filter(part =>
    part.part.toLowerCase().includes(partsSearchTerm.toLowerCase()) ||
    (part.vendor && part.vendor.toLowerCase().includes(partsSearchTerm.toLowerCase()))
  );

  // Toggle part selection
  const togglePartSelection = (partId) => {
    if (!setLinkedPartIds) return;
    if (safeLinkedPartIds.includes(partId)) {
      setLinkedPartIds(safeLinkedPartIds.filter(id => id !== partId));
    } else {
      setLinkedPartIds([...safeLinkedPartIds, partId]);
    }
  };

  // Get selected parts data
  const selectedParts = parts.filter(part => safeLinkedPartIds.includes(part.id));

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
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'
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

          {/* Notes field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              }`}
              placeholder="Additional details, parts used, costs, etc."
            />
          </div>

          {/* Linked Parts field */}
          <div ref={partsDropdownRef} className="relative">
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Linked Parts</span>
              </div>
            </label>

            {/* Selected parts pills */}
            {selectedParts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedParts.map(part => {
                  const vendorColor = part.vendor && vendorColors[part.vendor];
                  const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                  return (
                    <span
                      key={part.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{part.part}</span>
                      {part.vendor && (
                        <span
                          className="opacity-70"
                          style={colors ? { color: colors.text } : undefined}
                        >
                          ({part.vendor})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => togglePartSelection(part.id)}
                        className={`ml-1 hover:text-red-500 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Dropdown trigger */}
            <button
              type="button"
              onClick={() => setShowPartsDropdown(!showPartsDropdown)}
              className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <span>{selectedParts.length === 0 ? 'Select parts...' : `${selectedParts.length} part${selectedParts.length !== 1 ? 's' : ''} selected`}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPartsDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu - opens upward since this field is at the bottom */}
            {showPartsDropdown && (
              <div className={`absolute z-50 bottom-full mb-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}>
                {/* Search input */}
                <div className={`sticky top-0 p-2 border-b ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <input
                    type="text"
                    value={partsSearchTerm}
                    onChange={(e) => setPartsSearchTerm(e.target.value)}
                    placeholder="Search parts..."
                    className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode
                        ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400'
                        : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Parts list */}
                {filteredParts.length === 0 ? (
                  <div className={`p-3 text-sm text-center ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No parts found
                  </div>
                ) : (
                  filteredParts.map(part => {
                    const vendorColor = part.vendor && vendorColors[part.vendor];
                    const colors = vendorColor ? getVendorDisplayColor(vendorColor, darkMode) : null;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => togglePartSelection(part.id)}
                        className={`w-full px-3 py-2 flex items-center gap-2 text-left transition-colors ${
                          safeLinkedPartIds.includes(part.id)
                            ? darkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                            : darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          safeLinkedPartIds.includes(part.id)
                            ? 'bg-blue-500 border-blue-500'
                            : darkMode ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                          {safeLinkedPartIds.includes(part.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium truncate block ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {part.part}
                          </span>
                          {part.vendor && (
                            <span
                              className="text-xs"
                              style={colors ? { color: colors.text } : { color: darkMode ? '#9CA3AF' : '#6B7280' }}
                            >
                              {part.vendor}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ${part.total?.toFixed(2) || '0.00'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between gap-3 ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
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
