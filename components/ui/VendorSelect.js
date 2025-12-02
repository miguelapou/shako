import React from 'react';
import { selectDropdownStyle } from '../../utils/styleUtils';

// VendorSelect Component - vendor selection dropdown with custom input option
const VendorSelect = ({ value, onChange, darkMode, uniqueVendors }) => {
  return (
    <div className="space-y-2">
      <select
        value={uniqueVendors.includes(value) ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-100'
            : 'bg-slate-50 border-slate-300 text-slate-800'
        }`}
        style={selectDropdownStyle}
      >
        <option value="">Select a vendor...</option>
        {uniqueVendors.map(vendor => (
          <option key={vendor} value={vendor}>{vendor}</option>
        ))}
      </select>
      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
        Or enter a new vendor:
      </div>
      <input
        type="text"
        value={uniqueVendors.includes(value) ? '' : value}
        onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue);
        }}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
        }`}
        placeholder="Enter new vendor name"
      />
    </div>
  );
};

export default VendorSelect;
