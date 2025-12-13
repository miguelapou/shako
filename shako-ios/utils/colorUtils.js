/**
 * Color utilities - adapted for React Native
 * These functions work identically to the web version
 */

// Status color mappings (using Tailwind class names for NativeWind)
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

// Vendor color mapping
export const getVendorColor = (vendor, customColors = {}) => {
  if (!vendor) return 'bg-gray-200 text-gray-800';

  if (customColors[vendor]) {
    return null;
  }

  const vendorLower = vendor.toLowerCase();
  if (vendorLower === 'toyota') return 'bg-red-100 text-red-800';
  if (vendorLower === 'ebay') return 'bg-green-100 text-green-800';
  if (vendorLower === 'etsy') return 'bg-orange-100 text-orange-800';
  if (vendorLower === 'partsnext') return 'bg-yellow-100 text-yellow-800';
  if (vendorLower === 'best buy') return 'bg-purple-100 text-purple-800';
  if (vendorLower === 'amazon') return 'bg-blue-100 text-blue-800';
  if (vendorLower === 'jauce') return 'bg-fuchsia-100 text-fuchsia-800';
  return 'bg-gray-200 text-gray-800';
};

// Convert hex to rgba
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Check if color is light
export const isLightColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Darken a color
export const darkenColor = (hex, amount = 0.4) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

// Get vendor display color for theme
export const getVendorDisplayColor = (color, darkMode) => {
  if (!color) return null;

  if (darkMode) {
    return {
      text: color,
      bg: hexToRgba(color, 0.2),
      border: hexToRgba(color, 0.3)
    };
  } else {
    const darkenedColor = darkenColor(color, 0.5);
    return {
      text: darkenedColor,
      bg: hexToRgba(color, 0.25),
      border: hexToRgba(darkenedColor, 0.4)
    };
  }
};

// Muted color version
export const getMutedColor = (hexColor, darkMode) => {
  if (!hexColor) return darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const opacity = darkMode ? 0.3 : 0.4;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
