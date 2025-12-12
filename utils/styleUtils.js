// ========================================
// STYLE UTILITIES
// ========================================

// Dark mode utility functions for common class patterns
export const cardBg = (darkMode) => darkMode ? 'bg-gray-800' : 'bg-slate-50';
export const secondaryBg = (darkMode) => darkMode ? 'bg-gray-700' : 'bg-slate-100';
export const primaryText = (darkMode) => darkMode ? 'text-gray-100' : 'text-slate-800';
export const secondaryText = (darkMode) => darkMode ? 'text-gray-400' : 'text-slate-600';
export const borderColor = (darkMode) => darkMode ? 'border-gray-700' : 'border-slate-200';
export const hoverBg = (darkMode) => darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100';

// Common input field classes
export const inputClasses = (darkMode, additionalClasses = '') => {
  const base = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${additionalClasses}`;
  const theme = darkMode
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400';
  return `${base} ${theme}`;
};

// Common select dropdown custom arrow style (prevents React from recreating this object on every render)
export const selectDropdownStyle = {
  width: '100%',
  WebkitAppearance: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1.25em 1.25em',
  paddingRight: '2.5rem'
};
