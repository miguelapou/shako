// ========================================
// COLOR UTILITIES
// ========================================

// Status color mappings
export const getStatusColors = (darkMode) => ({
  planning: darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800',
  in_progress: darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800',
  completed: darkMode ? 'bg-green-600 text-green-100' : 'bg-green-100 text-green-800',
  on_hold: darkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
});

// Priority color mappings
export const getPriorityColors = (darkMode) => ({
  not_set: darkMode ? 'text-blue-400' : 'text-blue-600',
  low: darkMode ? 'text-green-400' : 'text-green-600',
  medium: darkMode ? 'text-yellow-400' : 'text-yellow-600',
  high: darkMode ? 'text-red-400' : 'text-red-600'
});

// Priority border colors
export const getPriorityBorderColor = (priority) => {
  const colors = {
    not_set: '#3b82f6',
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colors[priority] || '#3b82f6';
};

// Vendor color mapping - now accepts customColors object
export const getVendorColor = (vendor, customColors = {}) => {
  if (!vendor) return 'bg-gray-100 text-gray-700 border border-gray-200';

  // Check if vendor has a custom color
  if (customColors[vendor]) {
    return null; // Return null to indicate custom color should be used
  }

  const vendorLower = vendor.toLowerCase();
  if (vendorLower === 'toyota') return 'bg-red-100 text-red-700 border border-red-200';
  if (vendorLower === 'ebay') return 'bg-green-100 text-green-700 border border-green-200';
  if (vendorLower === 'etsy') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (vendorLower === 'partsnext') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  if (vendorLower === 'best buy') return 'bg-purple-100 text-purple-700 border border-purple-200';
  if (vendorLower === 'amazon') return 'bg-blue-100 text-blue-700 border border-blue-200';
  if (vendorLower === 'jauce') return 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

// Helper function to convert hex to rgba with lightness
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to determine if color is light or dark for text contrast
export const isLightColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Helper function to darken a color for better visibility in light mode
export const darkenColor = (hex, amount = 0.4) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Get vendor color optimized for current theme
export const getVendorDisplayColor = (color, darkMode) => {
  if (!color) return null;

  if (darkMode) {
    // In dark mode, use the original color
    return {
      text: color,
      bg: hexToRgba(color, 0.2),
      border: hexToRgba(color, 0.3)
    };
  } else {
    // In light mode, use a darkened version for better contrast
    const darkenedColor = darkenColor(color, 0.4);
    return {
      text: darkenedColor,
      bg: hexToRgba(color, 0.15),
      border: hexToRgba(darkenedColor, 0.25)
    };
  }
};

// Convert hex color to muted version (reduces opacity)
export const getMutedColor = (hexColor, darkMode) => {
  if (!hexColor) return darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)';
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Return as rgba with reduced opacity (30% for dark mode, 40% for light mode)
  const opacity = darkMode ? 0.3 : 0.4;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
