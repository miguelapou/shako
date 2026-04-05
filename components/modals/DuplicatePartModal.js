import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';

const DUPLICATE_FIELDS = [
  { key: 'vendor',    label: 'Vendor' },
  { key: 'partNumber', label: 'Part Number' },
  { key: 'status',   label: 'Status' },
  { key: 'projectId', label: 'Project' },
  { key: 'vehicleId', label: 'Vehicle' },
  { key: 'price',    label: 'Price' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'duties',   label: 'Duties' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'tracking', label: 'Tracking Number' },
];

// Fields checked by default
const DEFAULT_CHECKED = new Set(['vendor', 'partNumber', 'projectId', 'vehicleId', 'price', 'shipping', 'duties', 'quantity']);

const DuplicatePartModal = ({
  isOpen,
  darkMode,
  part,
  projects,
  vehicles,
  createPartDirectly,
  onClose,
  onDuplicated,
}) => {
  const [selectedFields, setSelectedFields] = useState(new Set(DEFAULT_CHECKED));
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set(DEFAULT_CHECKED));
    }
  }, [isOpen]);

  if (!isOpen || !part) return null;

  const toggleField = (key) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const partData = {
        part: part.part, // always carried over
      };

      for (const { key } of DUPLICATE_FIELDS) {
        if (selectedFields.has(key)) {
          partData[key] = part[key];
        }
      }

      // If status not carried over, default to pending
      if (!selectedFields.has('status')) {
        partData.status = 'pending';
      }

      // If project carried over but vehicle not explicitly selected, carry vehicle from project
      if (selectedFields.has('projectId') && !selectedFields.has('vehicleId')) {
        const project = projects?.find(p => p.id === part.projectId);
        if (project?.vehicle_id) {
          partData.vehicleId = project.vehicle_id;
        }
      }

      const created = await createPartDirectly(partData);
      if (created) {
        onDuplicated?.(created);
      }
      onClose();
    } finally {
      setIsDuplicating(false);
    }
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-white';
  const border = darkMode ? 'border-gray-700' : 'border-slate-200';
  const text = darkMode ? 'text-gray-100' : 'text-gray-900';
  const subtext = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-gray-800' : 'hover:bg-slate-50';
  const checkboxBorder = darkMode ? 'border-gray-500' : 'border-gray-300';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-sm rounded-xl shadow-2xl border ${bg} ${border} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${border}`}>
          <div className="flex items-center gap-2">
            <Copy className={`w-4 h-4 ${subtext}`} />
            <h2 className={`font-semibold text-base ${text}`}>Duplicate Part</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-gray-500'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className={`text-sm ${subtext}`}>
            Select which attributes to carry over to the duplicate. The part name is always included.
          </p>

          {/* Always-on: part name */}
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}>
            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-blue-600 border border-blue-600`}>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className={`text-sm font-medium ${text}`}>Part Name</span>
            <span className={`ml-auto text-xs ${subtext} truncate max-w-[120px]`}>{part.part}</span>
          </div>

          {/* Selectable fields */}
          <div className={`rounded-lg border ${border} overflow-hidden`}>
            {DUPLICATE_FIELDS.map(({ key, label }, idx) => {
              const checked = selectedFields.has(key);
              // Get display value for the field
              let displayValue = null;
              if (key === 'projectId' && part.projectId) {
                displayValue = projects?.find(p => p.id === part.projectId)?.name || part.projectId;
              } else if (key === 'vehicleId' && part.vehicleId) {
                displayValue = vehicles?.find(v => v.id === part.vehicleId)?.name || part.vehicleId;
              } else if (key === 'status') {
                displayValue = part.status ? part.status.charAt(0).toUpperCase() + part.status.slice(1) : 'Pending';
              } else if (key === 'price' || key === 'shipping' || key === 'duties') {
                const val = parseFloat(part[key]);
                displayValue = val > 0 ? `$${val.toFixed(2)}` : null;
              } else if (key === 'quantity') {
                displayValue = part.quantity > 1 ? `×${part.quantity}` : null;
              } else if (part[key]) {
                displayValue = String(part[key]);
                if (displayValue.length > 18) displayValue = displayValue.slice(0, 18) + '…';
              }

              return (
                <button
                  key={key}
                  onClick={() => toggleField(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${rowHover} ${idx < DUPLICATE_FIELDS.length - 1 ? `border-b ${border}` : ''}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? 'bg-blue-600 border-blue-600' : checkboxBorder}`}>
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${checked ? text : subtext}`}>{label}</span>
                  {displayValue && (
                    <span className={`ml-auto text-xs ${subtext} truncate max-w-[100px]`}>{displayValue}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-5 py-4 border-t ${border}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isDuplicating ? 'opacity-60 cursor-not-allowed bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <Copy className="w-3.5 h-3.5" />
            {isDuplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicatePartModal;
