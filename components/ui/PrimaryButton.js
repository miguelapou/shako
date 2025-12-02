import React from 'react';

// PrimaryButton - Reusable blue button component
const PrimaryButton = ({ onClick, children, className = '', disabled = false, icon: Icon = null }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${className}`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

export default PrimaryButton;
