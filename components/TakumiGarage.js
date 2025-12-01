import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, BadgeDollarSign, TrendingUp, Truck, CheckCircle, Clock, ChevronDown, Plus, X, ExternalLink, ChevronUp, Edit2, Trash2, Moon, Sun, Wrench, GripVertical, ShoppingCart, Car, Upload, Gauge, Settings, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

// ========================================
// CONSTANTS & UTILITIES
// ========================================

// Status color mappings
const getStatusColors = (darkMode) => ({
  planning: darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800',
  in_progress: darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800',
  completed: darkMode ? 'bg-green-600 text-green-100' : 'bg-green-100 text-green-800',
  on_hold: darkMode ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-100 text-yellow-800'
});

// Priority color mappings
const getPriorityColors = (darkMode) => ({
  not_set: darkMode ? 'text-blue-400' : 'text-blue-600',
  low: darkMode ? 'text-green-400' : 'text-green-600',
  medium: darkMode ? 'text-yellow-400' : 'text-yellow-600',
  high: darkMode ? 'text-red-400' : 'text-red-600'
});

// Priority border colors
const getPriorityBorderColor = (priority) => {
  const colors = {
    not_set: '#3b82f6',
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colors[priority] || '#3b82f6';
};

// Vendor color mapping
const getVendorColor = (vendor) => {
  if (!vendor) return 'bg-gray-100 text-gray-700 border border-gray-200';
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

// Calculate total spent for a vehicle
const calculateVehicleTotalSpent = (vehicleId, projects, parts) => {
  const vehicleProjects = projects.filter(p => p.vehicle_id === vehicleId);
  return vehicleProjects.reduce((sum, project) => {
    const projectParts = parts.filter(part => part.projectId === project.id);
    return sum + projectParts.reduce((partSum, part) => partSum + (part.total || 0), 0);
  }, 0);
};

// Convert hex color to muted version (reduces opacity)
const getMutedColor = (hexColor, darkMode) => {
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

// Calculate project totals
const calculateProjectTotal = (projectId, parts) => {
  return parts
    .filter(part => part.projectId === projectId)
    .reduce((sum, part) => sum + (part.total || 0), 0);
};

// Dark mode utility functions for common class patterns
const cardBg = (darkMode) => darkMode ? 'bg-gray-800' : 'bg-slate-50';
const secondaryBg = (darkMode) => darkMode ? 'bg-gray-700' : 'bg-slate-100';
const primaryText = (darkMode) => darkMode ? 'text-gray-100' : 'text-slate-800';
const secondaryText = (darkMode) => darkMode ? 'text-gray-400' : 'text-slate-600';
const borderColor = (darkMode) => darkMode ? 'border-gray-700' : 'border-slate-200';
const hoverBg = (darkMode) => darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100';

// Common input field classes
const inputClasses = (darkMode, additionalClasses = '') => {
  const base = `w-full md:max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${additionalClasses}`;
  const theme = darkMode 
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400';
  return `${base} ${theme}`;
};


// Common select dropdown custom arrow style (prevents React from recreating this object on every render)
const selectDropdownStyle = {
  width: '100%',
  WebkitAppearance: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1.25em 1.25em',
  paddingRight: '2.5rem'
};

// ========================================
// REUSABLE COMPONENTS
// ========================================

// ConfirmDialog - Custom styled confirmation modal
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', darkMode, isDangerous = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden transition-all ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-slate-50 border border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 
            className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-slate-800'}`}
            style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}
          >
            {title}
          </h3>
        </div>
        {/* Body */}
        <div className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
          <p>{message}</p>
        </div>
        {/* Footer */}
        <div className={`px-6 py-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ProjectDetailView - Reusable component for displaying project details with todos and linked parts
const ProjectDetailView = ({ 
  project, 
  parts, 
  darkMode, 
  updateProject,
  getStatusColors,
  getPriorityColors,
  getStatusText,
  getStatusTextColor,
  getVendorColor,
  calculateProjectTotal,
  editingTodoId,
  setEditingTodoId,
  editingTodoText,
  setEditingTodoText,
  newTodoText,
  setNewTodoText,
  vehicle
}) => {
  const linkedParts = parts.filter(part => part.projectId === project.id);
  const linkedPartsTotal = calculateProjectTotal(project.id, parts);
  const progress = project.budget > 0 ? (linkedPartsTotal / project.budget) * 100 : 0;
  const statusColors = getStatusColors(darkMode);
  const priorityColors = getPriorityColors(darkMode);

  // FLIP animation for todos
  const todoRefs = React.useRef({});
  const prevPositions = React.useRef({});
  const [isAnimating, setIsAnimating] = React.useState(false);
  const hasInitialized = React.useRef(false);
  const [isNewTodoFocused, setIsNewTodoFocused] = React.useState(false);
  const [showCompletedTodos, setShowCompletedTodos] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [isDescriptionClamped, setIsDescriptionClamped] = React.useState(false);
  const descriptionRef = React.useRef(null);
  // Check if description is clamped (more than 3 lines)
  React.useEffect(() => {
    if (descriptionRef.current && project.description) {
      const element = descriptionRef.current;
      setIsDescriptionClamped(element.scrollHeight > element.clientHeight);
    }
  }, [project.description]);
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Reset on project change
  React.useEffect(() => {
    hasInitialized.current = false;
    prevPositions.current = {};
  }, [project.id]);

  // Sort todos: 
  // - Checked first, then unchecked
  // - Within checked: by completed_at (oldest first, newest at bottom)
  // - Within unchecked: recently unchecked at top, then by original_created_at (oldest first = new at bottom)
  const sortedTodos = React.useMemo(() => {
    if (!project.todos) return [];
    return [...project.todos].sort((a, b) => {
      // Different completion status: completed items first
      if (a.completed !== b.completed) {
        return b.completed - a.completed;
      }
      // Both have same completion status
      if (a.completed) {
        // Both completed: sort by completed_at (oldest first, newest at bottom)
        const aCompletedAt = a.completed_at ? new Date(a.completed_at) : new Date(a.created_at);
        const bCompletedAt = b.completed_at ? new Date(b.completed_at) : new Date(b.created_at);
        return aCompletedAt - bCompletedAt;
      } else {
        // Both uncompleted: 
        // Check if either was recently UNCHECKED (created_at is very recent AND different from original_created_at)
        const now = Date.now();
        const aCreatedMs = new Date(a.created_at).getTime();
        const bCreatedMs = new Date(b.created_at).getTime();
        const aOriginalMs = a.original_created_at ? new Date(a.original_created_at).getTime() : aCreatedMs;
        const bOriginalMs = b.original_created_at ? new Date(b.original_created_at).getTime() : bCreatedMs;
        // Only consider it "recently unchecked" if created_at is recent AND different from original_created_at
        const aIsRecentlyUnchecked = (now - aCreatedMs < 1000) && (Math.abs(aCreatedMs - aOriginalMs) > 100);
        const bIsRecentlyUnchecked = (now - bCreatedMs < 1000) && (Math.abs(bCreatedMs - bOriginalMs) > 100);
        // If one is recently unchecked and other isn't, put recently unchecked one first
        if (aIsRecentlyUnchecked && !bIsRecentlyUnchecked) return -1;
        if (!aIsRecentlyUnchecked && bIsRecentlyUnchecked) return 1;
        // Otherwise sort by original_created_at (oldest first = new todos at bottom)
        const aOriginal = new Date(a.original_created_at || a.created_at);
        const bOriginal = new Date(b.original_created_at || b.created_at);
        return aOriginal - bOriginal;
      }
    });
  }, [project.todos]);

  // FLIP animation with useLayoutEffect for synchronous execution
  React.useLayoutEffect(() => {
    // On first render, capture positions synchronously
    if (!hasInitialized.current) {
      sortedTodos.forEach(todo => {
        const element = todoRefs.current[todo.id];
        if (element) {
          const pos = element.getBoundingClientRect().top;
          prevPositions.current[todo.id] = pos;
        }
      });
      hasInitialized.current = true;
      return; // Don't animate on first render
    }
    if (isAnimating) {
      return; // Don't interrupt ongoing animations
    }
    // Capture the old positions before React updates the DOM
    const oldPositions = { ...prevPositions.current };
    const hasOldPositions = Object.keys(oldPositions).length > 0;
    // Collect new positions first before any animations
    const newPositions = {};
    sortedTodos.forEach(todo => {
      const element = todoRefs.current[todo.id];
      if (element) {
        newPositions[todo.id] = element.getBoundingClientRect().top;
      }
    });
    // Now set up animations and update stored positions
    sortedTodos.forEach(todo => {
      const element = todoRefs.current[todo.id];
      if (element) {
        const newPos = newPositions[todo.id];
        const oldPos = oldPositions[todo.id];
        if (hasOldPositions && oldPos !== undefined && newPos !== oldPos) {
          // Calculate how far the element has moved
          const deltaY = oldPos - newPos;
          // Immediately move it back to the old position
          element.style.transform = `translateY(${deltaY}px)`;
          element.style.transition = 'none';
          setIsAnimating(true);
          // Then animate it to the new position
          requestAnimationFrame(() => {
            element.style.transition = 'transform 0.3s ease-out';
            element.style.transform = 'translateY(0)';
            // Clear animation state after animation completes
            setTimeout(() => {
              setIsAnimating(false);
              element.style.transition = '';
            }, 300);
          });
        }
        // Store new position for next time
        prevPositions.current[todo.id] = newPos;
      }
    });
  }, [sortedTodos]);

  return (
    <>
      {/* Status Badge (left) and Vehicle Badge (right) on same row */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
          statusColors[project.status]
        }`}>
          {project.status.replace('_', ' ').toUpperCase()}
        </span>
        {vehicle && (
          <span 
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
              darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            <Car className="w-3 h-3 mr-1" />
            <span style={{ color: vehicle.color || '#3B82F6' }}>
              {vehicle.nickname || vehicle.name}
            </span>
          </span>
        )}
      </div>

      {/* Two Column Layout: Project Details (Left) and Todo List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Project Details */}
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Description</h3>
            <div className="relative">
              <p 
                ref={descriptionRef}
                className={`text-base transition-all duration-300 ease-in-out ${
                  project.description 
                    ? (darkMode ? 'text-gray-400' : 'text-slate-600')
                    : (darkMode ? 'text-gray-500 italic' : 'text-gray-500 italic')
                } ${!isDescriptionExpanded && project.description ? 'line-clamp-3' : ''}`}
              >
                {project.description || 'No description added'}
              </p>
              {project.description && isDescriptionClamped && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className={`mt-2 flex items-center gap-1 text-sm font-medium transition-colors ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {isDescriptionExpanded ? 'Show less' : 'Show more'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                    isDescriptionExpanded ? 'rotate-180' : ''
                  }`} />
                </button>
              )}
            </div>
          </div>

          {/* Budget Progress */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>Budget Used</h3>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${
                darkMode ? 'text-gray-300' : 'text-slate-700'
              }`}>
                ${linkedPartsTotal.toFixed(2)} / ${Math.round(project.budget || 0)}
              </span>
              <span className={`text-sm font-bold ${
                darkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {progress.toFixed(0)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className={`h-4 rounded-full transition-all ${
                  progress > 90
                    ? 'bg-red-500'
                    : progress > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Project Details Grid */}
          <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${secondaryBg(darkMode)}`}>
            <div>
              <p className={`text-xs mb-1 ${secondaryText(darkMode)}`}>
                Priority</p>
              <p className={`text-lg font-bold ${priorityColors[project.priority]}`}>
                {project.priority?.replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
            <div>
              <p className={`text-xs mb-1 ${
                darkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>Parts Linked</p>
              <p className={`text-lg font-bold ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>
                {linkedParts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: To-Do List Section */}
        <div className={`${
          darkMode ? '' : ''
        }`}>
        <div className="mb-3">
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            To-Do List
          </h3>
        </div>
        {/* To-Do Items */}
        <div className="space-y-2">
          {/* Checked Todos Section (Collapsible) */}
          {sortedTodos.some(todo => todo.completed) && (
            <div className="space-y-2">
              <button
                onClick={() => setShowCompletedTodos(!showCompletedTodos)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className={`w-4 h-4 transition-colors ${
                    showCompletedTodos 
                      ? '' 
                      : 'text-green-500'
                  }`} />
                  Completed ({sortedTodos.filter(t => t.completed).length})
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  showCompletedTodos ? 'rotate-180' : ''
                }`} />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showCompletedTodos 
                    ? 'max-h-[2000px] opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-2">
                  {sortedTodos.filter(todo => todo.completed).map((todo) => (
                <div 
                  key={todo.id}
                  ref={(el) => todoRefs.current[todo.id] = el}
                  className={`flex items-center gap-3 py-1.5 px-3 rounded-lg border transition-colors ${
                    editingTodoId === todo.id
                      ? darkMode 
                        ? 'bg-gray-700 border-blue-500' 
                        : 'bg-gray-50 border-blue-500'
                      : darkMode 
                        ? 'bg-gray-700 border-gray-600 hover:border-white' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updatedTodos = project.todos.map(t => {
                        if (t.id === todo.id) {
                          const newCompleted = !t.completed;
                          return { 
                            ...t, 
                            completed: newCompleted,
                            completed_at: newCompleted ? new Date().toISOString() : null,
                            // Update created_at when unchecking so it goes to top of uncompleted list
                            created_at: !newCompleted ? new Date().toISOString() : t.created_at,
                            // Preserve original_created_at or set it if missing (for old todos)
                            original_created_at: t.original_created_at || t.created_at
                          };
                        }
                        return t;
                      });
                      updateProject(project.id, {
                        todos: updatedTodos
                      });
                    }}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? darkMode
                          ? 'bg-green-600 border-green-600'
                          : 'bg-green-500 border-green-500'
                        : darkMode
                          ? 'border-gray-500 hover:border-gray-400'
                          : 'border-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {todo.completed && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </button>
                  {/* Todo Text - Click to edit inline */}
                  {editingTodoId === todo.id ? (
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.focus({ preventScroll: true });
                          // Set initial height based on content
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      type="text"
                      value={editingTodoText}
                      onChange={(e) => {
                        setEditingTodoText(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (editingTodoText.trim()) {
                            const updatedTodos = project.todos.map(t => 
                              t.id === todo.id ? { ...t, text: editingTodoText.trim() } : t
                            );
                            updateProject(project.id, {
                              todos: updatedTodos
                            });
                            setEditingTodoId(null);
                            setEditingTodoText('');
                          }
                        } else if (e.key === 'Escape') {
                          setEditingTodoId(null);
                          setEditingTodoText('');
                        }
                      }}
                      onBlur={() => {
                        if (editingTodoText.trim() && editingTodoText !== todo.text) {
                          const updatedTodos = project.todos.map(t => 
                            t.id === todo.id ? { ...t, text: editingTodoText.trim() } : t
                          );
                          updateProject(project.id, {
                            todos: updatedTodos
                          });
                        }
                        setEditingTodoId(null);
                        setEditingTodoText('');
                      }}
                      inputMode="text"
                      rows="1"
                      className={`flex-1 text-base bg-transparent border-0 focus:outline-none resize-none overflow-hidden ${
                        darkMode
                          ? 'text-gray-100'
                          : 'text-gray-800'
                      }`}
                      style={{ 
                        fontSize: '16px !important', 
                        lineHeight: '1.5 !important',
                        padding: '0 !important',
                        backgroundColor: 'transparent !important',
                        border: '0 !important',
                        margin: '0 !important',
                        boxShadow: 'none !important',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        minHeight: '24px'
                      }}
                    />
                  ) : (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTodoId(todo.id);
                        setEditingTodoText(todo.text);
                      }}
                      className={`flex-1 text-base cursor-pointer hover:opacity-70 transition-opacity ${
                        todo.completed
                          ? darkMode
                            ? 'text-gray-500 line-through'
                            : 'text-gray-400 line-through'
                          : darkMode
                            ? 'text-gray-200'
                            : 'text-gray-800'
                      }`}
                      style={{ lineHeight: '1.5' }}
                      title="Click to edit"
                    >
                      {todo.text}
                    </span>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete To-Do',
                        message: 'Are you sure you want to delete this to-do item? This action cannot be undone.',
                        onConfirm: () => {
                          const updatedTodos = project.todos.filter(t => t.id !== todo.id);
                          updateProject(project.id, {
                            todos: updatedTodos
                          });
                        }
                      });
                    }}
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      darkMode 
                        ? 'text-gray-500 hover:text-red-400 hover:bg-gray-600' 
                        : 'text-gray-400 hover:text-red-600 hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
                </div>
              </div>
            </div>
          )}
          {/* Unchecked Todos */}
          {sortedTodos.filter(todo => !todo.completed).map((todo) => (
            <div 
              key={todo.id}
              ref={(el) => todoRefs.current[todo.id] = el}
              className={`flex items-center gap-3 py-1.5 px-3 rounded-lg border transition-colors ${
                editingTodoId === todo.id
                  ? darkMode 
                    ? 'bg-gray-700 border-blue-500' 
                    : 'bg-gray-50 border-blue-500'
                  : darkMode 
                    ? 'bg-gray-700 border-gray-600 hover:border-white' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedTodos = project.todos.map(t => {
                    if (t.id === todo.id) {
                      const newCompleted = !t.completed;
                      return { 
                        ...t, 
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null,
                        // Update created_at when unchecking so it goes to top of uncompleted list
                        created_at: !newCompleted ? new Date().toISOString() : t.created_at,
                        // Preserve original_created_at or set it if missing (for old todos)
                        original_created_at: t.original_created_at || t.created_at
                      };
                    }
                    return t;
                  });
                  updateProject(project.id, {
                    todos: updatedTodos
                  });
                }}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? darkMode
                      ? 'bg-green-600 border-green-600'
                      : 'bg-green-500 border-green-500'
                    : darkMode
                      ? 'border-gray-500 hover:border-gray-400'
                      : 'border-gray-400 hover:border-gray-500'
                }`}
              >
                {todo.completed && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </button>
              {/* Todo Text - Click to edit inline */}
              {editingTodoId === todo.id ? (
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.focus({ preventScroll: true });
                      // Set initial height based on content
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  type="text"
                  value={editingTodoText}
                  onChange={(e) => {
                    setEditingTodoText(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingTodoText.trim()) {
                        const updatedTodos = project.todos.map(t => 
                          t.id === todo.id ? { ...t, text: editingTodoText.trim() } : t
                        );
                        updateProject(project.id, {
                          todos: updatedTodos
                        });
                        setEditingTodoId(null);
                        setEditingTodoText('');
                      }
                    } else if (e.key === 'Escape') {
                      setEditingTodoId(null);
                      setEditingTodoText('');
                    }
                  }}
                  onBlur={() => {
                    if (editingTodoText.trim() && editingTodoText !== todo.text) {
                      const updatedTodos = project.todos.map(t => 
                        t.id === todo.id ? { ...t, text: editingTodoText.trim() } : t
                      );
                      updateProject(project.id, {
                        todos: updatedTodos
                      });
                    }
                    setEditingTodoId(null);
                    setEditingTodoText('');
                  }}
                  inputMode="text"
                  rows="1"
                  className={`flex-1 text-base bg-transparent border-0 focus:outline-none resize-none overflow-hidden ${
                    darkMode
                      ? 'text-gray-100'
                      : 'text-gray-800'
                  }`}
                  style={{ 
                    fontSize: '16px !important', 
                    lineHeight: '1.5 !important',
                    padding: '0 !important',
                    backgroundColor: 'transparent !important',
                    border: '0 !important',
                    margin: '0 !important',
                    boxShadow: 'none !important',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    minHeight: '24px'
                  }}
                />
              ) : (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTodoId(todo.id);
                    setEditingTodoText(todo.text);
                  }}
                  className={`flex-1 text-base cursor-pointer hover:opacity-70 transition-opacity ${
                    todo.completed
                      ? darkMode
                        ? 'text-gray-500 line-through'
                        : 'text-gray-400 line-through'
                      : darkMode
                        ? 'text-gray-200'
                        : 'text-gray-800'
                  }`}
                  style={{ lineHeight: '1.5' }}
                  title="Click to edit"
                >
                  {todo.text}
                </span>
              )}
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete To-Do',
                    message: 'Are you sure you want to delete this to-do item? This action cannot be undone.',
                    onConfirm: () => {
                      const updatedTodos = project.todos.filter(t => t.id !== todo.id);
                      updateProject(project.id, {
                        todos: updatedTodos
                      });
                    }
                  });
                }}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                  darkMode 
                    ? 'text-gray-500 hover:text-red-400 hover:bg-gray-600' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-gray-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {/* Always-visible input for new todos */}
          <div 
            className={`flex items-center gap-3 py-1.5 px-3 rounded-lg border transition-colors ${
              isNewTodoFocused
                ? darkMode 
                  ? 'bg-gray-700 border-blue-500' 
                  : 'bg-gray-50 border-blue-500'
                : darkMode 
                  ? 'bg-gray-700 border-gray-600 hover:border-white' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-400'
            }`}
          >
            {/* Empty checkbox placeholder */}
            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 ${
              darkMode ? 'border-gray-600' : 'border-gray-300'
            }`} />
            {/* Input field - auto-expanding textarea */}
            <textarea
              type="text"
              value={newTodoText}
              onChange={(e) => {
                setNewTodoText(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onFocus={() => setIsNewTodoFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newTodoText.trim()) {
                    const currentTodos = project.todos || [];
                    const timestamp = new Date().toISOString();
                    const newTodo = {
                      id: Date.now(),
                      text: newTodoText.trim(),
                      completed: false,
                      created_at: timestamp,
                      original_created_at: timestamp
                    };
                    updateProject(project.id, {
                      todos: [...currentTodos, newTodo]
                    });
                    setNewTodoText('');
                    // Reset height after clearing
                    setTimeout(() => {
                      if (e.target) {
                        e.target.style.height = 'auto';
                      }
                    }, 0);
                  }
                }
              }}
              onBlur={(e) => {
                setIsNewTodoFocused(false);
                if (newTodoText.trim()) {
                  const currentTodos = project.todos || [];
                  const timestamp = new Date().toISOString();
                  const newTodo = {
                    id: Date.now(),
                    text: newTodoText.trim(),
                    completed: false,
                    created_at: timestamp,
                    original_created_at: timestamp
                  };
                  updateProject(project.id, {
                    todos: [...currentTodos, newTodo]
                  });
                  setNewTodoText('');
                  // Reset height after clearing
                  setTimeout(() => {
                    if (e.target) {
                      e.target.style.height = 'auto';
                    }
                  }, 0);
                }
              }}
              placeholder="Add a to-do item..."
              inputMode="text"
              rows="1"
              className={`flex-1 text-base px-2 py-1 bg-transparent border-0 focus:outline-none resize-none overflow-hidden ${
                darkMode
                  ? 'text-gray-100 placeholder-gray-500'
                  : 'text-gray-800 placeholder-gray-400'
              }`}
              style={{ fontSize: '16px', lineHeight: '1.5', minHeight: '24px' }}
            />
          </div>
        </div>
      </div>
      {/* End of two-column grid */}
      </div>

      {/* Linked Parts List - Full Width Below */}
      {linkedParts.length > 0 && (
        <div className={`pt-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>Linked Parts ({linkedParts.length})</span>
            </div>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {linkedParts.map((part) => (
              <div 
                key={part.id}
                className={`p-4 rounded-lg border flex flex-col ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>
                      {part.part}
                    </h4>
                    {part.vendor && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                        {part.vendor}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs font-medium ${getStatusTextColor(part)}`}>
                    {getStatusText(part)}
                  </div>
                </div>
                {part.partNumber && part.partNumber !== '-' && (
                  <p className={`text-xs font-mono mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>
                    Part #: {part.partNumber}
                  </p>
                )}
                <div className={`border-t ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <div className="pt-3 space-y-2 mt-auto">
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                      Part Price:
                    </span>
                    <span className={`font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      ${part.price.toFixed(2)}
                    </span>
                  </div>
                  {part.shipping > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                        Shipping:
                      </span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        ${part.shipping.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {part.duties > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                        Duties:
                      </span>
                      <span className={`font-medium ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        ${part.duties.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className={`flex justify-between text-base font-bold pt-2 border-t ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                      Total:
                    </span>
                    <span className={darkMode ? 'text-gray-100' : 'text-slate-800'}>
                      ${part.total.toFixed(2)}
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedParts.length === 0 && (
        <div className={`pt-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>Linked Parts (0)</span>
            </div>
          </h3>
          <div className="text-center py-8">
            <Package className={`w-12 h-12 mx-auto mb-2 opacity-40 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No parts linked
            </p>
          </div>
        </div>
      )}
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        darkMode={darkMode}
      />
    </>
  );
};

// Add Foundation One font
const fontStyles = `
  @font-face {
    font-family: 'FoundationOne';
    src: url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.woff2') format('woff2'),
         url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.woff') format('woff'),
         url('https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  /* Prevent touch scrolling on modal backdrop */
  .modal-backdrop {
    touch-action: none;
    transition: opacity 0.2s ease-out;
  }

  /* Enable smooth scrolling on modal content */
  .modal-content {
    -webkit-overflow-scrolling: touch;
    transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease-out;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* Scrollable area for modal body - use this class on the middle content div */
  .modal-scrollable {
    overflow-y: auto;
    flex: 1 1 auto;
    min-height: 0;
  }

  /* Constrain date inputs to prevent full-width on Safari/mobile */
  input[type="date"] {
    max-width: 100%;
  }
  @media (min-width: 768px) {
    input[type="date"] {
      max-width: 300px;
    }
  }

  /* Better select dropdown styling */
  select {
    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.75rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }

  @keyframes popUpCenter {
    0% {
      opacity: 0;
      transform: scale(0.7);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-popup-enter {
    animation: popUpCenter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .modal-popup-exit {
    animation: fadeOut 0.2s ease-out;
  }

  .modal-backdrop-enter {
    animation: fadeIn 0.3s ease-out;
  }

  .modal-backdrop-exit {
    animation: fadeOut 0.2s ease-out;
  }

  .slide-in-right {
    animation: slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .slide-in-left {
    animation: slideInFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Sort chevron spin animation */
  @keyframes spinIn180 {
    0% {
      transform: rotate(0deg);
      opacity: 0.5;
    }
    100% {
      transform: rotate(180deg);
      opacity: 1;
    }
  }

  .spin-in-180 {
    animation: spinIn180 0.3s ease-out;
  }

  /* Table sorting animations */
  @keyframes tableFadeSlide {
    0% {
      opacity: 0.3;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .table-sorting tbody tr {
    animation: tableFadeSlide 0.4s ease-out;
  }

  .table-sorting tbody tr:nth-child(1) { animation-delay: 0s; }
  .table-sorting tbody tr:nth-child(2) { animation-delay: 0.02s; }
  .table-sorting tbody tr:nth-child(3) { animation-delay: 0.04s; }
  .table-sorting tbody tr:nth-child(4) { animation-delay: 0.06s; }
  .table-sorting tbody tr:nth-child(5) { animation-delay: 0.08s; }
  .table-sorting tbody tr:nth-child(6) { animation-delay: 0.1s; }
  .table-sorting tbody tr:nth-child(7) { animation-delay: 0.12s; }
  .table-sorting tbody tr:nth-child(8) { animation-delay: 0.14s; }
  .table-sorting tbody tr:nth-child(9) { animation-delay: 0.16s; }
  .table-sorting tbody tr:nth-child(10) { animation-delay: 0.18s; }

  /* Project filtering animations */
  @keyframes projectFilterFade {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .projects-filtering > div {
    animation: projectFilterFade 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    opacity: 0;
  }

  .projects-filtering > div:nth-child(1) { animation-delay: 0s; }
  .projects-filtering > div:nth-child(2) { animation-delay: 0.04s; }
  .projects-filtering > div:nth-child(3) { animation-delay: 0.08s; }
  .projects-filtering > div:nth-child(4) { animation-delay: 0.12s; }
  .projects-filtering > div:nth-child(5) { animation-delay: 0.16s; }
  .projects-filtering > div:nth-child(6) { animation-delay: 0.2s; }
  .projects-filtering > div:nth-child(7) { animation-delay: 0.24s; }
  .projects-filtering > div:nth-child(8) { animation-delay: 0.28s; }
  .projects-filtering > div:nth-child(9) { animation-delay: 0.32s; }
  .projects-filtering > div:nth-child(10) { animation-delay: 0.36s; }
  .projects-filtering > div:nth-child(11) { animation-delay: 0.4s; }
  .projects-filtering > div:nth-child(12) { animation-delay: 0.44s; }

  /* Garage Door Loading Spinner */
  .garage-spinner {
    width: 100px;
    height: 120px;
    position: relative;
    overflow: hidden;
    border: 2px solid #555;
  }

  .door-segment {
    height: 30px;
    background-color: #ccc;
    border-bottom: 1px solid #555;
    position: absolute;
    width: 100%;
  }

  .door-segment:nth-child(1) { bottom: 0px; }
  .door-segment:nth-child(2) { bottom: 30px; }
  .door-segment:nth-child(3) { bottom: 60px; }
  .door-segment:nth-child(4) { bottom: 90px; }

  @keyframes openGarage {
    0% { transform: translateY(0) scaleY(1); opacity: 1; }
    50% { opacity: 1; }
    100% { transform: translateY(-150px) scaleY(0.5); opacity: 0; }
  }

  .door-segment {
    animation: openGarage 2s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation-fill-mode: forwards;
  }

  .door-segment:nth-child(1) { animation-delay: 0s; }
  .door-segment:nth-child(2) { animation-delay: 0.1s; }
  .door-segment:nth-child(3) { animation-delay: 0.2s; }
  .door-segment:nth-child(4) { animation-delay: 0.3s; }

  /* Scrollbar styles - WebKit only for Chrome/Safari */
  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  *::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  *::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Scrollbar styles for dark mode */
  body.dark-scrollbar::-webkit-scrollbar-track,
  body.dark-scrollbar *::-webkit-scrollbar-track {
    background: #1f2937;
  }

  body.dark-scrollbar::-webkit-scrollbar-thumb,
  body.dark-scrollbar *::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 6px;
    border: 2px solid #1f2937;
  }

  body.dark-scrollbar::-webkit-scrollbar-thumb:hover,
  body.dark-scrollbar *::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  /* Line clamp utility for truncating text */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// ========================================
// PROJECT EDIT FORM COMPONENT (SHARED)
// ========================================
const ProjectEditForm = ({ 
  project, 
  onProjectChange, 
  vehicles, 
  parts, 
  unlinkPartFromProject,
  getVendorColor,
  darkMode 
}) => {
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column: Project Name, Priority/Vehicle, Budget */}
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-gray-300' : 'text-slate-700'
          }`}>
            Project Name
          </label>
          <input
            type="text"
            value={project.name}
            onChange={(e) => onProjectChange({ ...project, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100' 
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          />
        </div>

        {/* Priority and Vehicle Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              Priority
            </label>
            <select
              value={project.priority}
              onChange={(e) => onProjectChange({ ...project, priority: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="not_set">Not Set</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span>Vehicle</span>
              </div>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVehicleDropdown(!showVehicleDropdown);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {project.vehicle_id ? (() => {
                    const selectedVehicle = vehicles.find(v => v.id === project.vehicle_id);
                    return selectedVehicle ? (
                      <>
                        <div 
                          className="w-3 h-3 rounded-full border flex-shrink-0"
                          style={{ 
                            backgroundColor: selectedVehicle.color || '#3B82F6',
                            borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                          }}
                        />
                        <span className="truncate">{selectedVehicle.nickname || selectedVehicle.name}</span>
                      </>
                    ) : 'No vehicle';
                  })() : 'No vehicle'}
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
              {showVehicleDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowVehicleDropdown(false)}
                  />
                  <div 
                    className={`absolute right-0 md:left-0 z-20 mt-1 rounded-lg border shadow-lg py-1 max-h-60 overflow-y-auto vehicle-dropdown-scroll ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'
                    }`}
                    style={{
                      minWidth: '200px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onProjectChange({ ...project, vehicle_id: null });
                        setShowVehicleDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                        !project.vehicle_id
                          ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                          : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      No vehicle
                    </button>
                    {vehicles.map(vehicle => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => {
                          onProjectChange({ ...project, vehicle_id: vehicle.id });
                          setShowVehicleDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                          project.vehicle_id === vehicle.id
                            ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                            : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div 
                          className="w-3 h-3 rounded-full border flex-shrink-0"
                          style={{ 
                            backgroundColor: vehicle.color || '#3B82F6',
                            borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                          }}
                        />
                        <span className="truncate">
                          {vehicle.nickname ? `${vehicle.nickname} (${vehicle.name})` : `${vehicle.name}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Budget Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              Budget ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={project.budget}
              onChange={(e) => onProjectChange({ ...project, budget: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right Column: Description (taller) */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-slate-700'
        }`}>
          Description
        </label>
        <textarea
          value={project.description}
          onChange={(e) => onProjectChange({ ...project, description: e.target.value })}
          className={`w-full h-[calc(100%-2rem)] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        />
      </div>
    </div>
  );
};

// ========================================
// LINKED PARTS SECTION COMPONENT (SHARED)
// ========================================
const LinkedPartsSection = ({
  projectId,
  parts,
  unlinkPartFromProject,
  getVendorColor,
  darkMode,
  setConfirmDialog
}) => {
  const linkedParts = parts.filter(part => part.projectId === projectId);

  return (
    <div className={`mt-6 pt-6 border-t ${
      darkMode ? 'border-gray-600' : 'border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-3 ${
        darkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <span>Linked Parts ({linkedParts.length})</span>
        </div>
      </h3>
      {linkedParts.length === 0 ? (
        <div className={`text-center py-8 rounded-lg border ${
          darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No parts linked</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:max-h-[540px] overflow-y-auto pr-2">
          {linkedParts.map((part) => (
            <div 
              key={part.id}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${
                  darkMode ? 'text-gray-100' : 'text-slate-800'
                }`}>
                  {part.part}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {part.vendor && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                      {part.vendor}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    ${part.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Unlink Part',
                    message: `Are you sure you want to unlink "${part.part}" from this project?`,
                    confirmText: 'Unlink',
                    onConfirm: () => {
                      unlinkPartFromProject(part.id);
                    }
                  });
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  darkMode 
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600 border-gray-600 hover:border-red-500' 
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-300'
                }`}
                title="Unlink from project"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// PriceDisplay Component - displays price with smaller decimal portion
const PriceDisplay = ({ amount, className = '', darkMode }) => {
  const formattedAmount = amount.toFixed(2);
  const [dollars, cents] = formattedAmount.split('.');
  
  return (
    <span className={className}>
      ${dollars}
      <span className="text-[0.7em]">.{cents}</span>
    </span>
  );
};

// VendorSelect Component - moved outside to prevent recreation on every render
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

const TakumiGarage = () => {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'parts', 'projects', or 'vehicles'
  const [previousTab, setPreviousTab] = useState('vehicles');
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [draggedVehicle, setDraggedVehicle] = useState(null);
  const [dragOverVehicle, setDragOverVehicle] = useState(null);
  const [dragOverArchiveZone, setDragOverArchiveZone] = useState(false);

  // Track if we're transitioning between modals to prevent scroll jumping
  const isTransitioningModals = useRef(false);
  const savedScrollPosition = useRef(0);

  // Refs for tab underline animation
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const [hoverTab, setHoverTab] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Vehicle modal states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [originalVehicleData, setOriginalVehicleData] = useState(null); // Track original data for unsaved changes detection
  const [vehicleModalProjectView, setVehicleModalProjectView] = useState(null); // Track if viewing project within vehicle modal
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(null); // 'vehicle' or 'project' - track if editing within modal
  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    name: '',
    make: '',
    year: '',
    license_plate: '',
    vin: '',
    insurance_policy: '',
    fuel_filter: '',
    air_filter: '',
    oil_filter: '',
    oil_type: '',
    oil_capacity: '',
    oil_brand: '',
    drain_plug: '',
    battery: '',
    image_url: '',
    color: '#3B82F6' // Default blue color
  });
  const [vehicleImageFile, setVehicleImageFile] = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Confirmation dialog state for main component
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Filter and sort states
  const [projectVehicleFilter, setProjectVehicleFilter] = useState('all'); // 'all' or vehicle ID
  const [isFilteringProjects, setIsFilteringProjects] = useState(false);
  const [showVehicleFilterDropdown, setShowVehicleFilterDropdown] = useState(false);

  // Load parts and projects from Supabase on mount
  useEffect(() => {
    loadParts();
    loadProjects();
    // Don't load vehicles on initial mount, only when tab is accessed
  }, []);

  // Load vehicles when the vehicles tab is accessed
  useEffect(() => {
    if (activeTab === 'vehicles' && vehicles.length === 0) {
      loadVehicles();
    }
  }, [activeTab]);

  // Update underline position when active tab changes
  useEffect(() => {
    const updateUnderline = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setUnderlineStyle({
          left: offsetLeft,
          width: offsetWidth
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateUnderline, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Initial underline position on mount
  useEffect(() => {
    const updateUnderline = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setUnderlineStyle({
          left: offsetLeft,
          width: offsetWidth
        });
      }
    };
    
    // Delay to ensure refs are populated
    const timer = setTimeout(updateUnderline, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database format to app format
        const formattedParts = data.map(part => ({
          id: part.id,
          delivered: part.delivered,
          shipped: part.shipped,
          purchased: part.purchased,
          part: part.part,
          partNumber: part.part_number || '',
          vendor: part.vendor || '',
          price: parseFloat(part.price) || 0,
          shipping: parseFloat(part.shipping) || 0,
          duties: parseFloat(part.duties) || 0,
          total: parseFloat(part.total) || 0,
          tracking: part.tracking || '',
          projectId: part.project_id || null
        }));
        setParts(formattedParts);
      }
    } catch (error) {
      console.error('Error loading parts:', error);
      alert('Error loading parts from database');
    } finally {
      setLoading(false);
    }
  };

  // Load projects from Supabase
  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const addProject = async (projectData) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description,
          status: projectData.status || 'planning',
          budget: parseFloat(projectData.budget) || 0,
          spent: 0,
          priority: projectData.priority || 'medium',
          vehicle_id: projectData.vehicle_id || null,
          todos: []
        }])
        .select();

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Error adding project');
    }
  };

  // Helper function to calculate project status based on todos
  const calculateProjectStatus = (todos, currentStatus) => {
    // If status is manually set to "on_hold", keep it
    if (currentStatus === 'on_hold') return 'on_hold';
    if (!todos || todos.length === 0) {
      return 'planning';
    }
    const completedCount = todos.filter(todo => todo.completed).length;
    if (completedCount === 0) {
      return 'planning';
    } else if (completedCount === todos.length) {
      return 'completed';
    } else {
      return 'in_progress';
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      // Auto-calculate status based on todos unless it's being set to on_hold
      if (updates.todos && updates.status !== 'on_hold') {
        updates.status = calculateProjectStatus(updates.todos, updates.status);
      }
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  // Vehicle CRUD functions
  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      if (data) {
        // Sort so archived vehicles are always at the end
        const sorted = data.sort((a, b) => {
          if (a.archived === b.archived) {
            // If both have same archived status, sort by display_order
            return (a.display_order || 0) - (b.display_order || 0);
          }
          // Put archived vehicles at the end
          return a.archived ? 1 : -1;
        });
        setVehicles(sorted);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const addVehicle = async (vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();

      if (error) throw error;
      await loadVehicles();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert('Error adding vehicle');
    }
  };

  const updateVehicle = async (vehicleId, updates) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId);

      if (error) throw error;
      await loadVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Error updating vehicle');
    }
  };

  const deleteVehicle = async (vehicleId) => {
    const projectsForVehicle = projects.filter(p => p.vehicle_id === vehicleId);
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      await loadVehicles();
      await loadProjects(); // Reload projects to update vehicle_id references
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Error deleting vehicle');
    }
  };

  // Helper functions for vehicle-project relationships
  const getVehicleProjects = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId);
  };

  const getVehicleProjectCount = (vehicleId) => {
    return projects.filter(project => project.vehicle_id === vehicleId).length;
  };

  // Handle modal closing with exit animation
  const handleCloseModal = (closeCallback) => {
    setIsModalClosing(true);
    setTimeout(() => {
      closeCallback();
      setIsModalClosing(false);
    }, 200); // Duration matches the exit animation
  };

  const uploadVehicleImage = async (file) => {
    try {
      setUploadingImage(true);
      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);

      setUploadingImage(false);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      alert('Error uploading image. Please try again.');
      return null;
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setVehicleImageFile(null);
    setVehicleImagePreview(null);
  };

  // Image drag and drop handlers
  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setVehicleImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers for projects
  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, project) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedProject && draggedProject.id !== project.id) {
      setDragOverProject(project);
    }
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDrop = (e, targetProject) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.id === targetProject.id) {
      setDraggedProject(null);
      setDragOverProject(null);
      return;
    }

    const draggedIndex = projects.findIndex(p => p.id === draggedProject.id);
    const targetIndex = projects.findIndex(p => p.id === targetProject.id);

    const newProjects = [...projects];
    const [removed] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    setProjects(newProjects);
    setDraggedProject(null);
    setDragOverProject(null);

    // Update display_order in database
    updateProjectsOrder(newProjects);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
  };

  // Drag and drop handlers for vehicles
  const handleVehicleDragStart = (e, vehicle) => {
    setDraggedVehicle(vehicle);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleVehicleDragOver = (e, vehicle) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedVehicle && draggedVehicle.id !== vehicle.id && dragOverVehicle?.id !== vehicle.id) {
      setDragOverVehicle(vehicle);
    }
  };

  const handleVehicleDragLeave = () => {
    setDragOverVehicle(null);
  };

  const handleVehicleDrop = (e, targetVehicle) => {
    e.preventDefault();
    if (!draggedVehicle || draggedVehicle.id === targetVehicle.id) {
      setDraggedVehicle(null);
      setDragOverVehicle(null);
      return;
    }

    // Check if the drag would change archive status
    const draggedIsArchived = draggedVehicle.archived || false;
    const targetIsArchived = targetVehicle.archived || false;

    if (draggedIsArchived !== targetIsArchived) {
      // Show confirmation dialog for archive/unarchive
      setConfirmDialog({
        isOpen: true,
        title: draggedIsArchived ? 'Unarchive Vehicle' : 'Archive Vehicle',
        message: draggedIsArchived 
          ? `Are you sure you want to unarchive "${draggedVehicle.nickname || draggedVehicle.name}"?` 
          : `Are you sure you want to archive "${draggedVehicle.nickname || draggedVehicle.name}"? It will still be visible but with limited information.`,
        confirmText: draggedIsArchived ? 'Unarchive' : 'Archive',
        isDangerous: false,
        onConfirm: async () => {
          // Update the vehicle's archived status
          const updates = { archived: !draggedIsArchived };
          if (!draggedIsArchived) {
            // Archiving: set display_order to max + 1
            const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
            updates.display_order = maxOrder + 1;
          }
          await updateVehicle(draggedVehicle.id, updates);
          
          // Reload vehicles to reflect the change
          await loadVehicles();
          
          setDraggedVehicle(null);
          setDragOverVehicle(null);
        }
      });
      
      // Clear drag state but don't reorder
      setDraggedVehicle(null);
      setDragOverVehicle(null);
      return;
    }

    // Normal reordering within same section
    const draggedIndex = vehicles.findIndex(v => v.id === draggedVehicle.id);
    const targetIndex = vehicles.findIndex(v => v.id === targetVehicle.id);

    const newVehicles = [...vehicles];
    const [removed] = newVehicles.splice(draggedIndex, 1);
    newVehicles.splice(targetIndex, 0, removed);

    setVehicles(newVehicles);
    setDraggedVehicle(null);
    setDragOverVehicle(null);

    // Update display_order in database
    updateVehiclesOrder(newVehicles);
  };

  const handleVehicleDragEnd = () => {
    setDraggedVehicle(null);
    setDragOverVehicle(null);
    setDragOverArchiveZone(false);
  };

  const handleArchiveZoneDrop = (shouldArchive) => {
    if (!draggedVehicle) return;

    const draggedIsArchived = draggedVehicle.archived || false;
    
    // If already in the correct state, do nothing
    if (draggedIsArchived === shouldArchive) {
      setDraggedVehicle(null);
      setDragOverArchiveZone(false);
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: shouldArchive ? 'Archive Vehicle' : 'Unarchive Vehicle',
      message: shouldArchive 
        ? `Are you sure you want to archive "${draggedVehicle.nickname || draggedVehicle.name}"? It will still be visible but with limited information.`
        : `Are you sure you want to unarchive "${draggedVehicle.nickname || draggedVehicle.name}"?`,
      confirmText: shouldArchive ? 'Archive' : 'Unarchive',
      isDangerous: false,
      onConfirm: async () => {
        const updates = { archived: shouldArchive };
        if (shouldArchive) {
          // Archiving: set display_order to max + 1
          const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
          updates.display_order = maxOrder + 1;
        }
        await updateVehicle(draggedVehicle.id, updates);
        await loadVehicles();
      }
    });

    setDraggedVehicle(null);
    setDragOverArchiveZone(false);
  };

  // Tab change handler to track animation direction
  const handleTabChange = (newTab) => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  const updateProjectsOrder = async (orderedProjects) => {
    try {
      // Update each project with its new display order
      const updates = orderedProjects.map((project, index) => ({
        id: project.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('projects')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating project order:', error);
    }
  };

  const updateVehiclesOrder = async (orderedVehicles) => {
    try {
      // Update each vehicle with its new display order
      const updates = orderedVehicles.map((vehicle, index) => ({
        id: vehicle.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('vehicles')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating vehicle order:', error);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [deliveredFilter, setDeliveredFilter] = useState('all'); // 'all', 'only', 'hide'
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isSorting, setIsSorting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPartDetailModal, setShowPartDetailModal] = useState(false);
  const [viewingPart, setViewingPart] = useState(null);
  const [partDetailView, setPartDetailView] = useState('detail'); // 'detail', 'edit', or 'manage-vendors'
  const [trackingModalPartId, setTrackingModalPartId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  const [originalPartData, setOriginalPartData] = useState(null); // Track original data for unsaved changes detection
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [partModalView, setPartModalView] = useState(null); // null = edit part, 'manage-vendors' = manage vendors view
  const [editingVendor, setEditingVendor] = useState(null); // { oldName: string, newName: string }
  // Project-related state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [originalProjectData, setOriginalProjectData] = useState(null); // Track original data for unsaved changes detection
  const [projectModalEditMode, setProjectModalEditMode] = useState(false); // Track if editing within project detail modal
  const [editingTodoId, setEditingTodoId] = useState(null); // Track which todo is being edited
  const [editingTodoText, setEditingTodoText] = useState(''); // Temp text while editing
  const [newTodoText, setNewTodoText] = useState(''); // Text for new todo input
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    priority: 'not_set',
    status: 'planning',
    vehicle_id: null
  });
  const [showAddProjectVehicleDropdown, setShowAddProjectVehicleDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Always start with false to match SSR
  const [darkModeInitialized, setDarkModeInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch by not rendering until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize dark mode after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        setDarkMode(JSON.parse(saved));
      } else {
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
      setDarkModeInitialized(true);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && darkModeInitialized) {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode, darkModeInitialized]);

  // Apply dark scrollbar styles to both html and body for cross-browser compatibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Detect if Safari (not Chrome)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (darkMode) {
        document.documentElement.classList.add('dark-scrollbar');
        document.body.classList.add('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'dark';
        }
      } else {
        document.documentElement.classList.remove('dark-scrollbar');
        document.body.classList.remove('dark-scrollbar');
        // Only set color-scheme for Safari
        if (isSafari) {
          document.documentElement.style.colorScheme = 'light';
        }
      }
    }
  }, [darkMode]);

  // Scroll to top when switching between vehicle and project view in modal
  useEffect(() => {
    if (showVehicleDetailModal) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        // Find all scrollable containers in the modal and scroll to top
        const scrollContainers = document.querySelectorAll('.max-h-\\[calc\\(90vh-180px\\)\\]');
        scrollContainers.forEach(container => {
          container.scrollTop = 0;
        });
      }, 50);
    }
  }, [vehicleModalProjectView, showVehicleDetailModal]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showAddModal || showTrackingModal || 
                          showAddProjectModal || showProjectDetailModal ||
                          showAddVehicleModal || showVehicleDetailModal ||
                          showPartDetailModal;
    if (isAnyModalOpen) {
      // Calculate scrollbar width before locking
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Store current scroll position when opening a modal
      if (savedScrollPosition.current === 0) {
        savedScrollPosition.current = window.scrollY;
      }
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollPosition.current}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Remove fixed positioning but maintain scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      // Restore scroll position
      if (savedScrollPosition.current > 0) {
        window.scrollTo(0, savedScrollPosition.current);
        savedScrollPosition.current = 0; // Reset for next modal
      }
    }
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
    };
  }, [showAddModal, showTrackingModal, showAddProjectModal, 
      showProjectDetailModal, showAddVehicleModal, showVehicleDetailModal, showPartDetailModal]);

  const [newPart, setNewPart] = useState({
    part: '',
    partNumber: '',
    vendor: '',
    price: '',
    shipping: '',
    duties: '',
    tracking: '',
    status: 'pending',
    projectId: null
  });

  // Check if there are unsaved changes in vehicle edit mode
  const hasUnsavedVehicleChanges = () => {
    if (!vehicleModalEditMode || vehicleModalEditMode !== 'vehicle' || !originalVehicleData || !viewingVehicle) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'nickname', 'name', 'year', 'license_plate', 'vin', 'insurance_policy',
      'fuel_filter', 'air_filter', 'oil_filter', 'oil_type', 'oil_capacity',
      'oil_brand', 'drain_plug', 'battery', 'color'
    ];
    for (const field of fieldsToCheck) {
      if (viewingVehicle[field] !== originalVehicleData[field]) {
        return true;
      }
    }
    // Check if a new image has been selected
    if (vehicleImageFile !== null) {
      return true;
    }
    return false;
  };

  const hasUnsavedProjectChanges = () => {
    if (!projectModalEditMode || !originalProjectData || !viewingProject) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'name', 'description', 'budget', 'priority', 
      'vehicle_id'
    ];
    for (const field of fieldsToCheck) {
      if (viewingProject[field] !== originalProjectData[field]) {
        return true;
      }
    }
    return false;
  };

  const hasUnsavedPartChanges = () => {
    if (!originalPartData || !editingPart) {
      return false;
    }
    // Check if any field has changed
    const fieldsToCheck = [
      'part', 'partNumber', 'vendor', 'price', 'shipping', 'duties', 
      'tracking', 'status', 'projectId'
    ];
    for (const field of fieldsToCheck) {
      if (String(editingPart[field] || '') !== String(originalPartData[field] || '')) {
        return true;
      }
    }
    return false;
  };

  const vendors = useMemo(() => {
    const vendorSet = new Set(parts.map(p => p.vendor).filter(v => v));
    return ['all', ...Array.from(vendorSet).sort()];
  }, [parts]);

  const updatePartStatus = async (partId, newStatus) => {
    // If changing to shipped, show tracking modal
    if (newStatus === 'shipped') {
      setTrackingModalPartId(partId);
      setShowTrackingModal(true);
      setOpenDropdown(null);
      return;
    }
    try {
      const statusMap = {
        delivered: { delivered: true, shipped: true, purchased: true },
        purchased: { delivered: false, shipped: false, purchased: true },
        pending: { delivered: false, shipped: false, purchased: false }
      };
      const updates = statusMap[newStatus];
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update(updates)
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === partId) {
          return { ...part, ...updates };
        }
        return part;
      }));
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error updating part status:', error);
      alert('Error updating part status. Please try again.');
    }
  };

  const saveTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true,
          tracking: trackingInput
        })
        .eq('id', trackingModalPartId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return { 
            ...part, 
            delivered: false, 
            shipped: true, 
            purchased: true,
            tracking: trackingInput 
          };
        }
        return part;
      }));
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      console.error('Error saving tracking info:', error);
      alert('Error saving tracking info. Please try again.');
    }
  };

  const skipTrackingInfo = async () => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          delivered: false,
          shipped: true,
          purchased: true
        })
        .eq('id', trackingModalPartId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === trackingModalPartId) {
          return { 
            ...part, 
            delivered: false, 
            shipped: true, 
            purchased: true
          };
        }
        return part;
      }));
      setShowTrackingModal(false);
      setTrackingModalPartId(null);
      setTrackingInput('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const saveEditedPart = async () => {
    const price = parseFloat(editingPart.price) || 0;
    const shipping = parseFloat(editingPart.shipping) || 0;
    const duties = parseFloat(editingPart.duties) || 0;
    const total = price + shipping + duties;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({
          ...statusMap[editingPart.status],
          part: editingPart.part,
          part_number: editingPart.partNumber,
          vendor: editingPart.vendor,
          price,
          shipping,
          duties,
          total,
          tracking: editingPart.tracking,
          project_id: editingPart.projectId || null
        })
        .eq('id', editingPart.id);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => {
        if (part.id === editingPart.id) {
          return {
            ...part,
            ...statusMap[editingPart.status],
            part: editingPart.part,
            partNumber: editingPart.partNumber,
            vendor: editingPart.vendor,
            price,
            shipping,
            duties,
            total,
            tracking: editingPart.tracking,
            projectId: editingPart.projectId || null
          };
        }
        return part;
      }));
      setEditingPart(null);
      setPartModalView(null);
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Error saving part. Please try again.');
    }
  };

  const deletePart = async (partId) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);
      if (error) throw error;
        // Update local state
        setParts(prevParts => prevParts.filter(part => part.id !== partId));
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Error deleting part. Please try again.');
      }
  };

  // Vendor management functions
  const renameVendor = async (oldName, newName) => {
    if (!newName || !newName.trim()) {
      alert('Vendor name cannot be empty');
      return;
    }

    try {
      const partsToUpdate = parts.filter(p => p.vendor === oldName);
      // Update all parts in database
      const { error } = await supabase
        .from('parts')
        .update({ vendor: newName.trim() })
        .eq('vendor', oldName);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.vendor === oldName ? { ...part, vendor: newName.trim() } : part
      ));
      // Update editingPart if it has the old vendor
      if (editingPart && editingPart.vendor === oldName) {
        setEditingPart({ ...editingPart, vendor: newName.trim() });
      }
      setEditingVendor(null);
    } catch (error) {
      console.error('Error renaming vendor:', error);
      alert('Error renaming vendor. Please try again.');
    }
  };

  const deleteVendor = async (vendorName) => {
    try {
      const partsWithVendor = parts.filter(p => p.vendor === vendorName);
      // Update all parts in database to have empty vendor
      const { error } = await supabase
        .from('parts')
        .update({ vendor: '' })
        .eq('vendor', vendorName);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.vendor === vendorName ? { ...part, vendor: '' } : part
      ));
      // Update editingPart if it has this vendor
      if (editingPart && editingPart.vendor === vendorName) {
        setEditingPart({ ...editingPart, vendor: '' });
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Error deleting vendor. Please try again.');
    }
  };

  const unlinkPartFromProject = async (partId) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({ project_id: null })
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.id === partId ? { ...part, projectId: null } : part
      ));
    } catch (error) {
      console.error('Error unlinking part:', error);
      alert('Error unlinking part. Please try again.');
    }
  };

  const updatePartProject = async (partId, projectId) => {
    try {
      // Update in database
      const { error } = await supabase
        .from('parts')
        .update({ project_id: projectId || null })
        .eq('id', partId);
      if (error) throw error;
      // Update local state
      setParts(prevParts => prevParts.map(part => 
        part.id === partId ? { ...part, projectId: projectId || null } : part
      ));
    } catch (error) {
      console.error('Error updating part project:', error);
      alert('Error updating part project. Please try again.');
    }
  };

  const addNewPart = async () => {
    const price = parseFloat(newPart.price) || 0;
    const shipping = parseFloat(newPart.shipping) || 0;
    const duties = parseFloat(newPart.duties) || 0;
    const total = price + shipping + duties;
    const statusMap = {
      delivered: { delivered: true, shipped: true, purchased: true },
      shipped: { delivered: false, shipped: true, purchased: true },
      purchased: { delivered: false, shipped: false, purchased: true },
      pending: { delivered: false, shipped: false, purchased: false }
    };
    try {
      // Insert into database
      const { data, error } = await supabase
        .from('parts')
        .insert({
          ...statusMap[newPart.status],
          part: newPart.part,
          part_number: newPart.partNumber,
          vendor: newPart.vendor,
          price,
          shipping,
          duties,
          total,
          tracking: newPart.tracking,
          project_id: newPart.projectId || null
        })
        .select()
        .single();
      if (error) throw error;
      // Add to local state with the ID from database
      const partToAdd = {
        id: data.id,
        ...statusMap[newPart.status],
        part: newPart.part,
        partNumber: newPart.partNumber,
        vendor: newPart.vendor,
        price,
        shipping,
        duties,
        total,
        tracking: newPart.tracking,
        projectId: newPart.projectId || null
      };
      setParts([...parts, partToAdd]);
      setShowAddModal(false);
      setNewPart({
        part: '',
        partNumber: '',
        vendor: '',
        price: '',
        shipping: '',
        duties: '',
        tracking: '',
        status: 'pending',
        projectId: null
      });
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Error adding part. Please try again.');
    }
  };

  const handleSort = (field) => {
    // Trigger animation
    setIsSorting(true);
    
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
    
    // Remove animation class after animation completes
    setTimeout(() => setIsSorting(false), 400);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 transition-transform duration-300 animate-in spin-in-180" /> 
      : <ChevronDown className="w-4 h-4 transition-transform duration-300 animate-in spin-in-180" />;
  };

  const filteredParts = useMemo(() => {
    let sorted = parts
      .filter(part => {
        const matchesSearch = part.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            part.vendor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'delivered' && part.delivered) ||
                             (statusFilter === 'shipped' && part.shipped && !part.delivered) ||
                             (statusFilter === 'purchased' && part.purchased && !part.shipped) ||
                             (statusFilter === 'pending' && !part.purchased);
        const matchesVendor = vendorFilter === 'all' || part.vendor === vendorFilter;
        const matchesDeliveredFilter = 
          deliveredFilter === 'all' ? true :
          deliveredFilter === 'only' ? part.delivered :
          deliveredFilter === 'hide' ? !part.delivered : true;
        return matchesSearch && matchesStatus && matchesVendor && matchesDeliveredFilter;
      })
      .sort((a, b) => {
        let aVal, bVal;
        // Special handling for status sorting
        if (sortBy === 'status') {
          // Assign numeric values: pending=0, purchased=1, shipped=2, delivered=3
          aVal = a.delivered ? 3 : (a.shipped ? 2 : (a.purchased ? 1 : 0));
          bVal = b.delivered ? 3 : (b.shipped ? 2 : (b.purchased ? 1 : 0));
        } else if (sortBy === 'project') {
          // Sort by project name
          const aProject = projects.find(p => p.id === a.projectId);
          const bProject = projects.find(p => p.id === b.projectId);
          aVal = (aProject?.name || '').toLowerCase();
          bVal = (bProject?.name || '').toLowerCase();
          // Sort empty values to the end
          if (!aVal && bVal) return 1;
          if (aVal && !bVal) return -1;
        } else if (sortBy === 'vehicle') {
          // Sort by vehicle name (via project)
          const aProject = projects.find(p => p.id === a.projectId);
          const bProject = projects.find(p => p.id === b.projectId);
          const aVehicle = aProject?.vehicle_id ? vehicles.find(v => v.id === aProject.vehicle_id) : null;
          const bVehicle = bProject?.vehicle_id ? vehicles.find(v => v.id === bProject.vehicle_id) : null;
          aVal = (aVehicle?.nickname || aVehicle?.name || '').toLowerCase();
          bVal = (bVehicle?.nickname || bVehicle?.name || '').toLowerCase();
          // Sort empty values to the end
          if (!aVal && bVal) return 1;
          if (aVal && !bVal) return -1;
        } else {
          aVal = a[sortBy];
          bVal = b[sortBy];
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
        }
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    return sorted;
  }, [parts, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder, projects, vehicles, deliveredFilter]);

  // Get unique vendors from existing parts for the dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = parts
      .map(p => p.vendor)
      .filter(v => v && v.trim() !== '')
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique values
      .sort();
    return vendors;
  }, [parts]);

  const stats = useMemo(() => {
    // Filter out pending items (items where purchased is false) for cost calculations
    const purchasedParts = parts.filter(p => p.purchased);
    return {
      total: parts.length,
      delivered: parts.filter(p => p.delivered).length,
      shipped: parts.filter(p => p.shipped && !p.delivered).length,
      purchased: parts.filter(p => p.purchased && !p.shipped).length,
      pending: parts.filter(p => !p.purchased).length,
      totalCost: purchasedParts.reduce((sum, p) => sum + p.total, 0),
      totalPrice: purchasedParts.reduce((sum, p) => sum + p.price, 0),
      totalShipping: purchasedParts.reduce((sum, p) => sum + p.shipping, 0),
      totalDuties: purchasedParts.reduce((sum, p) => sum + p.duties, 0),
    };
  }, [parts]);

  const getStatusIcon = (part) => {
    if (part.delivered) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (part.shipped) return <Truck className="w-4 h-4 text-blue-600" />;
    if (part.purchased) return <ShoppingCart className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (part) => {
    if (part.delivered) return 'Delivered';
    if (part.shipped) return 'Shipped';
    if (part.purchased) return 'Ordered';
    return 'Pending';
  };

  const getStatusColor = (part) => {
    if (part.delivered) {
      return darkMode 
        ? 'bg-green-900/20 text-green-400 border-green-700/50' 
        : 'bg-green-50 text-green-700 border-green-200';
    }
    if (part.shipped) {
      return darkMode 
        ? 'bg-blue-900/20 text-blue-400 border-blue-700/50' 
        : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (part.purchased) {
      return darkMode 
        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    return darkMode 
      ? 'bg-gray-700 text-gray-400 border-gray-600' 
      : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusTextColor = (part) => {
    if (part.delivered) {
      return darkMode ? 'text-green-400' : 'text-green-700';
    }
    if (part.shipped) {
      return darkMode ? 'text-blue-400' : 'text-blue-700';
    }
    if (part.purchased) {
      return darkMode ? 'text-yellow-400' : 'text-yellow-700';
    }
    return darkMode ? 'text-gray-400' : 'text-gray-700';
  };

  const getTrackingUrl = (tracking) => {
    if (!tracking) return null;
    // If it's already a full URL, return it
    if (tracking.startsWith('http')) {
      return tracking;
    }
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return `https://www.orangeconnex.com/tracking?language=en&trackingnumber=${tracking}`;
    }
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return `https://www.ecmsglobal.com/en-us/tracking.html?orderNumber=${tracking}`;
    }
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return `https://www.ups.com/track?tracknum=${tracking}&loc=en_US&requester=ST/trackdetails`;
    }
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    }
    // Check if it's a USPS tracking number (20-22 digits or specific patterns)
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    }
    // Check if it's a DHL tracking number (10-11 digits)
    if (/^\d{10,11}$/.test(tracking)) {
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tracking}`;
    }
    // For generic text like "Local", "USPS", "FedEx" without tracking number
    return null;
  };

  const getCarrierName = (tracking) => {
    if (!tracking) return null;
    // Check if it's an Amazon URL or tracking
    if (tracking.toLowerCase().includes('amazon.com') || tracking.toLowerCase().includes('amzn')) {
      return 'Amazon';
    }
    // Check if it's a FedEx URL
    if (tracking.toLowerCase().includes('fedex.com')) {
      return 'FedEx';
    }
    // Check if it's an Orange Connex tracking number (starts with EX)
    if (tracking.startsWith('EX')) {
      return 'Orange Connex';
    }
    // Check if it's an ECMS tracking number (starts with ECSDT)
    if (tracking.startsWith('ECSDT')) {
      return 'ECMS';
    }
    // Check if it's a UPS tracking number
    if (tracking.startsWith('1Z')) {
      return 'UPS';
    }
    // Check if it's a FedEx tracking number (12-14 digits)
    if (/^\d{12,14}$/.test(tracking)) {
      return 'FedEx';
    }
    // Check if it's a USPS tracking number
    if (/^\d{20,22}$/.test(tracking) || /^(94|92|93)\d{20}$/.test(tracking)) {
      return 'USPS';
    }
    // Check if it's a DHL tracking number
    if (/^\d{10,11}$/.test(tracking)) {
      return 'DHL';
    }
    // For text like "Local", "USPS", "FedEx", "ECMS" etc.
    const upper = tracking.toUpperCase();
    if (upper.includes('UPS')) return 'UPS';
    if (upper.includes('FEDEX')) return 'FedEx';
    if (upper.includes('USPS')) return 'USPS';
    if (upper.includes('DHL')) return 'DHL';
    if (upper.includes('ECMS')) return 'ECMS';
    if (upper.includes('LOCAL')) return 'Local';
    return tracking; // Return as-is if unknown
  };

  const StatusDropdown = ({ part }) => {
    const isOpen = openDropdown === part.id;
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [isPositioned, setIsPositioned] = useState(false);
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 200; // Height of 4-item dropdown with padding
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Simple: open upward if not enough space below
        const openUpward = spaceBelow < dropdownHeight;
        setDropdownPosition(openUpward ? 'top' : 'bottom');
        
        // Calculate fixed position
        setDropdownStyle({
          left: `${rect.left}px`,
          top: openUpward ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
          minWidth: '140px'
        });
        
        setIsPositioned(true);
      } else {
        setIsPositioned(false);
      }
    }, [isOpen]);
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : part.id);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-md ${getStatusColor(part)}`}
          style={{ width: '8.25rem' }}
        >
          {getStatusIcon(part)}
          <span className="flex-1 text-left">{getStatusText(part)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && isPositioned && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(null);
              }}
            />
            <div 
              className={`fixed rounded-lg shadow-lg border py-1 z-50 ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}
              style={dropdownStyle}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'delivered');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-green-900/30' 
                    : 'text-gray-700 hover:bg-green-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span>Delivered</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'shipped');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-blue-900/30' 
                    : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <Truck className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span>Shipped</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'purchased');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-yellow-900/30' 
                    : 'text-gray-700 hover:bg-yellow-50'
                }`}
              >
                <ShoppingCart className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span>Ordered</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartStatus(part.id, 'pending');
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <span>Pending</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const ProjectDropdown = ({ part }) => {
    const isOpen = openDropdown === `project-${part.id}`;
    const selectedProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const [isPositioned, setIsPositioned] = useState(false);
    // Get priority color for selected project
    const getPriorityButtonColor = (priority) => {
      const colors = {
        not_set: darkMode ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-800 border-blue-200',
        low: darkMode ? 'bg-green-900/30 text-green-200 border-green-700' : 'bg-green-50 text-green-800 border-green-200',
        medium: darkMode ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700' : 'bg-yellow-50 text-yellow-800 border-yellow-200',
        high: darkMode ? 'bg-red-900/30 text-red-200 border-red-700' : 'bg-red-50 text-red-800 border-red-200'
      };
      return colors[priority] || colors.not_set;
    };
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Calculate dropdown height based on number of projects
        const itemHeight = 40;
        const maxVisibleItems = 6;
        const actualItems = Math.min(projects.length + 1, maxVisibleItems);
        const dropdownHeight = actualItems * itemHeight + 20; // Add padding
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Simple: open upward if not enough space below
        const openUpward = spaceBelow < dropdownHeight;
        setDropdownPosition(openUpward ? 'top' : 'bottom');
        
        // Calculate fixed position - on mobile align right, on desktop align left
        const isMobile = window.innerWidth < 768;
        setDropdownStyle({
          left: isMobile ? 'auto' : `${rect.left}px`,
          right: isMobile ? `${window.innerWidth - rect.right}px` : 'auto',
          top: openUpward ? `${rect.top - dropdownHeight - 4}px` : `${rect.bottom + 4}px`,
          minWidth: '180px',
          maxHeight: '240px'
        });
        
        setIsPositioned(true);
      } else {
        setIsPositioned(false);
      }
    }, [isOpen, projects.length]);
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(isOpen ? null : `project-${part.id}`);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:shadow-md ${
            selectedProject 
              ? getPriorityButtonColor(selectedProject.priority)
              : (darkMode ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300')
          }`}
          style={{ minWidth: '8.25rem', maxWidth: '10rem' }}
        >
          <span className="flex-1 text-left truncate">{selectedProject ? selectedProject.name : 'None'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && isPositioned && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(null);
              }}
            />
            <div 
              className={`fixed rounded-lg shadow-lg border py-1 z-50 overflow-y-auto scrollbar-hide ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}
              style={{
                ...dropdownStyle,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updatePartProject(part.id, null);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-400'
                }`} />
                <span>None</span>
              </button>
              {projects.map(project => {
                const priorityColor = {
                  not_set: darkMode ? 'bg-blue-500' : 'bg-blue-600',
                  low: darkMode ? 'bg-green-500' : 'bg-green-600',
                  medium: darkMode ? 'bg-yellow-500' : 'bg-yellow-600',
                  high: darkMode ? 'bg-red-500' : 'bg-red-600'
                };
                return (
                  <button
                    key={project.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePartProject(part.id, project.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      darkMode 
                        ? 'text-gray-300 hover:bg-blue-900/20' 
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      priorityColor[project.priority] || priorityColor.not_set
                    }`} />
                    <span className="truncate">{project.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // Don't render main content until mounted on client to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-6 transition-colors duration-200 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark-scrollbar' 
        : 'bg-gradient-to-br from-slate-200 to-slate-300'
    }`}>
      <style>{fontStyles}{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .vehicle-dropdown-scroll::-webkit-scrollbar {
          display: none;
        }
        .vehicle-dropdown-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        /* Custom 800px breakpoint */
        .hidden-below-800 {
          display: none;
        }
        @media (min-width: 800px) {
          .hidden-below-800 {
            display: block;
          }
          .flex-below-800 {
            display: flex;
          }
          .grid-below-800 {
            display: grid;
          }
        }
        .show-below-800 {
          display: block;
        }
        @media (min-width: 800px) {
          .show-below-800 {
            display: none;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 sm:mb-4 min-h-[52px] sm:min-h-[60px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Takumi Garage" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>TAKUMI GARAGE</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
              {/* Vehicle Filter - Only visible on Projects tab */}
              {activeTab === 'projects' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowVehicleFilterDropdown(!showVehicleFilterDropdown);
                    }}
                    className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-100' 
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {projectVehicleFilter !== 'all' && (() => {
                        const selectedVehicle = vehicles.find(v => String(v.id) === String(projectVehicleFilter));
                        return selectedVehicle ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full border"
                              style={{ 
                                backgroundColor: selectedVehicle.color || '#3B82F6',
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                              }}
                            />
                            <span className="hidden sm:inline">{selectedVehicle.nickname || selectedVehicle.name}</span>
                          </>
                        ) : null;
                      })()}
                      {projectVehicleFilter === 'all' && <span>All</span>}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showVehicleFilterDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowVehicleFilterDropdown(false)}
                      />
                      <div className={`absolute right-0 z-20 mt-1 min-w-[240px] w-max rounded-lg border shadow-lg py-1 max-h-60 overflow-y-auto ${
                        darkMode ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-300'
                      }`}>
                        <button
                          onClick={() => {
                            setIsFilteringProjects(true);
                            setProjectVehicleFilter('all');
                            setShowVehicleFilterDropdown(false);
                            setTimeout(() => setIsFilteringProjects(false), 500);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                            projectVehicleFilter === 'all'
                              ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                          }`}
                        >
                          All
                        </button>
                        {vehicles.map(vehicle => (
                          <button
                            key={vehicle.id}
                            onClick={() => {
                              setIsFilteringProjects(true);
                              setProjectVehicleFilter(String(vehicle.id));
                              setShowVehicleFilterDropdown(false);
                              setTimeout(() => setIsFilteringProjects(false), 500);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                              String(projectVehicleFilter) === String(vehicle.id)
                                ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                : darkMode ? 'hover:bg-gray-700 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div 
                              className="w-3 h-3 rounded-full border flex-shrink-0"
                              style={{ 
                                backgroundColor: vehicle.color || '#3B82F6',
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                              }}
                            />
                            <span className="truncate">
                              {vehicle.nickname ? `${vehicle.nickname} (${vehicle.name})` : vehicle.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors ${
                  activeTab !== 'vehicles' ? 'hidden sm:flex' : ''
                } ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'parts') setShowAddModal(true);
                  else if (activeTab === 'projects') setShowAddProjectModal(true);
                  else if (activeTab === 'vehicles') setShowAddVehicleModal(true);
                }}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors bg-blue-600 hover:bg-blue-700 text-white ${
                  darkMode ? '' : ''
                }`}
                title="Add New"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-slate-200'
        }`}>
          <div className="flex relative">
            <button
              ref={(el) => (tabRefs.current['vehicles'] = el)}
              onClick={() => handleTabChange('vehicles')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('vehicles')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'vehicles'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-sm sm:text-base">Vehicles</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['projects'] = el)}
              onClick={() => handleTabChange('projects')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('projects')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'projects'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="text-sm sm:text-base">Projects</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['parts'] = el)}
              onClick={() => handleTabChange('parts')}
              onMouseEnter={() => !isTouchDevice && setHoverTab('parts')}
              onMouseLeave={() => !isTouchDevice && setHoverTab(null)}
              onTouchStart={() => setHoverTab(null)}
              className={`flex items-center justify-center sm:justify-start gap-2 flex-1 sm:flex-initial px-3 sm:px-6 py-3 font-medium transition-all relative z-10 ${
                activeTab === 'parts'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-slate-600'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-sm sm:text-base">Parts</span>
            </button>
            {/* Animated hover background */}
            {hoverTab && tabRefs.current[hoverTab] && (
              <div
                className={`absolute top-0 bottom-1 rounded-lg transition-all duration-300 ease-out ${
                  darkMode ? 'bg-gray-700/50' : 'bg-slate-200/50'
                }`}
                style={{
                  left: `${tabRefs.current[hoverTab].offsetLeft}px`,
                  width: `${tabRefs.current[hoverTab].offsetWidth}px`
                }}
              />
            )}
            {/* Animated underline */}
            <div
              className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out z-10 ${
                darkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`}
              style={{
                left: `${underlineStyle.left}px`,
                width: `${underlineStyle.width}px`
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="garage-spinner mx-auto mb-4">
                <div className="door-segment"></div>
                <div className="door-segment"></div>
                <div className="door-segment"></div>
                <div className="door-segment"></div>
              </div>
              <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-slate-600'}`}>Opening your garage...</p>
            </div>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
        {/* Add New Part Modal */}
        {showAddModal && (
          <div 
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
              isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
            onClick={() => handleCloseModal(() => setShowAddModal(false))}
          >
            <div 
              className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
                isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
              } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h2 className={`text-2xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Part</h2>
                <button
                  onClick={() => handleCloseModal(() => setShowAddModal(false))}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 modal-scrollable">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Part Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPart.part}
                      onChange={(e) => setNewPart({ ...newPart, part: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="e.g., Front Bumper"
                      required
                    />
                  </div>
                  <div></div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={newPart.partNumber}
                      onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="e.g., 12345-67890"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.price}
                      onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Shipping ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.shipping}
                      onChange={(e) => setNewPart({ ...newPart, shipping: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Import Duties ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPart.duties}
                      onChange={(e) => setNewPart({ ...newPart, duties: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Tracking Link
                    </label>
                    <input
                      type="text"
                      value={newPart.tracking}
                      onChange={(e) => setNewPart({ ...newPart, tracking: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                      placeholder="e.g., FedEx, USPS"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Status
                    </label>
                    <select
                      value={newPart.status}
                      onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                      style={selectDropdownStyle}
                    >
                      <option value="pending">Pending</option>
                      <option value="purchased">Ordered</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Vendor
                    </label>
                    <VendorSelect 
                      value={newPart.vendor}
                      onChange={(value) => setNewPart({ ...newPart, vendor: value })}
                      darkMode={darkMode}
                      uniqueVendors={uniqueVendors}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    </label>
                    <select
                      value={newPart.projectId || ''}
                      onChange={(e) => setNewPart({ ...newPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                      style={selectDropdownStyle}
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(newPart.price || newPart.shipping || newPart.duties) && (
                    <div className={`md:col-span-2 border rounded-lg p-4 ${
                      darkMode 
                        ? 'bg-blue-900/30 border-blue-700' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>Calculated Total:</span>
                        <span className={`text-2xl font-bold ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          ${((parseFloat(newPart.price) || 0) + (parseFloat(newPart.shipping) || 0) + (parseFloat(newPart.duties) || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className={`border-t ${
                darkMode ? 'border-gray-700' : 'border-slate-200'
              }`}></div>
              <div className="p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addNewPart}
                    disabled={!newPart.part}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      !newPart.part
                        ? darkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Add Part
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Info Modal */}
        {showTrackingModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop-enter modal-backdrop"
            onClick={() => {
              setShowTrackingModal(false);
              setTrackingModalPartId(null);
              setTrackingInput('');
            }}
          >
            <div 
              className={`rounded-lg shadow-xl max-w-md w-full modal-popup-enter ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <h2 className={`text-xl font-bold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Add Tracking Info</h2>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingModalPartId(null);
                    setTrackingInput('');
                  }}
                  className={`transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 modal-scrollable">
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Enter the tracking number for this shipment (optional)
                </p>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder="e.g., 1Z999AA10123456784"
                  autoFocus
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={skipTrackingInfo}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Skip
                  </button>
                  <button
                    onClick={saveTrackingInfo}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Part Detail Modal */}
        {showPartDetailModal && viewingPart && (
          <div 
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
              isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
            onClick={() => handleCloseModal(() => {
              setShowPartDetailModal(false);
              setViewingPart(null);
              setPartDetailView('detail');
              setEditingPart(null);
              setOriginalPartData(null);
            })}
          >
            <div 
              className={`rounded-lg shadow-xl max-w-4xl w-full modal-content overflow-hidden transition-all duration-700 ease-in-out grid ${
                isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
              } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
              style={{
                gridTemplateRows: partDetailView === 'detail' ? 'auto 1fr auto' : 'auto 1fr auto',
                maxHeight: partDetailView === 'detail' ? 'calc(100vh - 2rem)' : 'calc(100vh - 2rem)',
                transition: 'max-height 0.7s ease-in-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 border-b px-6 py-4 rounded-t-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
              }`} style={{ zIndex: 10 }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`text-2xl font-bold ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                    {partDetailView === 'manage-vendors' ? 'Vendors' : (partDetailView === 'edit' ? 'Edit Part' : viewingPart.part)}
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Vehicle Badge - Mobile only in edit view */}
                    {partDetailView === 'edit' && (() => {
                      const partProject = editingPart?.projectId ? projects.find(p => p.id === editingPart.projectId) : null;
                      const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                      return vehicle && (
                        <span 
                          className={`md:hidden inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                            darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <Car className="w-3 h-3 mr-1" />
                          <span style={{ color: vehicle.color || '#3B82F6' }}>
                            {vehicle.nickname || vehicle.name}
                          </span>
                        </span>
                      );
                    })()}
                    <button
                    onClick={() => handleCloseModal(() => {
                      setShowPartDetailModal(false);
                      setViewingPart(null);
                      setPartDetailView('detail');
                      setEditingPart(null);
                      setOriginalPartData(null);
                    })}
                    className={`transition-colors flex-shrink-0 ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                  </div>
                </div>
              </div>

              {/* Detail View */}
              {partDetailView === 'detail' && (
              <div className="p-4 sm:p-6 modal-scrollable slide-in-left">
                {/* Status Badge (left) and Vehicle Badge (right) on same row */}
                <div className="flex items-center justify-between mb-6 gap-3">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(viewingPart)}`}>
                    {getStatusIcon(viewingPart)}
                    <span>{getStatusText(viewingPart)}</span>
                  </div>
                  {(() => {
                    const partProject = viewingPart.projectId ? projects.find(p => p.id === viewingPart.projectId) : null;
                    const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                    return vehicle && (
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                          darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <Car className="w-3 h-3 mr-1" />
                        <span style={{ color: vehicle.color || '#3B82F6' }}>
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </span>
                    );
                  })()}
                </div>

                {/* Part Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className={`rounded-lg p-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Part Info</h3>
                    <div className="space-y-4">
                      {viewingPart.partNumber && viewingPart.partNumber !== '-' && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Part Number</p>
                          <p className={`text-base font-mono ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>{viewingPart.partNumber}</p>
                        </div>
                      )}
                      {/* Vendor and Project on same row */}
                      <div className="grid grid-cols-2 gap-4">
                        {viewingPart.vendor && (
                          <div>
                            <p className={`text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>Vendor</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVendorColor(viewingPart.vendor)}`}>
                              {viewingPart.vendor}
                            </span>
                          </div>
                        )}
                        {viewingPart.projectId && (() => {
                          const project = projects.find(p => p.id === viewingPart.projectId);
                          return project && (
                            <div>
                              <p className={`text-sm font-medium mb-2 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Project</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                darkMode ? 'bg-blue-900/30 text-blue-200 border border-blue-700' : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}>
                                {project.name}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Cost Breakdown */}
                  <div className={`rounded-lg p-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Cost Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Part Price</span>
                        <span className={`text-lg font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>${viewingPart.price.toFixed(2)}</span>
                      </div>
                      {viewingPart.shipping > 0 && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Shipping</span>
                          <span className={`text-lg font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${viewingPart.shipping.toFixed(2)}</span>
                        </div>
                      )}
                      {viewingPart.duties > 0 && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Import Duties</span>
                          <span className={`text-lg font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${viewingPart.duties.toFixed(2)}</span>
                        </div>
                      )}
                      <div className={`pt-3 mt-3 border-t flex justify-between items-center ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <span className={`text-base font-semibold ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>Total</span>
                        <span className={`text-2xl font-bold ${
                          darkMode ? 'text-green-400' : 'text-green-600'
                        }`}>${viewingPart.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Information */}
                {viewingPart.tracking && (
                  <div className={`pt-6 border-t ${
                    darkMode ? 'border-gray-700' : 'border-slate-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Tracking Information</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>Carrier:</span>
                      {getTrackingUrl(viewingPart.tracking) ? (
                        <a
                          href={getTrackingUrl(viewingPart.tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track via {getCarrierName(viewingPart.tracking)}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {getCarrierName(viewingPart.tracking)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Footer */}
              {partDetailView === 'detail' && (
              <div className={`sticky bottom-0 border-t p-4 flex justify-end ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
              }`}>
                <PrimaryButton
                  onClick={() => {
                    const partData = {
                      ...viewingPart,
                      status: viewingPart.delivered ? 'delivered' : (viewingPart.shipped ? 'shipped' : (viewingPart.purchased ? 'purchased' : 'pending'))
                    };
                    setEditingPart(partData);
                    setOriginalPartData({ ...partData });
                    setPartDetailView('edit');
                  }}
                  icon={Edit2}
                >
                  Edit
                </PrimaryButton>
              </div>
              )}
              {/* Edit View */}
              {partDetailView === 'edit' && editingPart && (
              <div className="p-6 modal-scrollable slide-in-right relative">
                {/* Vehicle Badge - Desktop only in upper right */}
                {(() => {
                  const partProject = editingPart.projectId ? projects.find(p => p.id === editingPart.projectId) : null;
                  const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                  return vehicle && (
                    <div className="hidden md:block absolute top-6 right-6 z-10">
                      <span 
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                          darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <Car className="w-3 h-3 mr-1" />
                        <span style={{ color: vehicle.color || '#3B82F6' }}>
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </span>
                    </div>
                  );
                })()}

                <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                  {/* LEFT COLUMN - Non-price fields */}
                  <div className="order-1 md:order-none space-y-4">
                    {/* Part Name */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Part Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingPart.part}
                        onChange={(e) => setEditingPart({ ...editingPart, part: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="e.g., Front Bumper"
                        required
                      />
                    </div>

                    {/* Part Number */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Part Number
                      </label>
                      <input
                        type="text"
                        value={editingPart.partNumber}
                        onChange={(e) => setEditingPart({ ...editingPart, partNumber: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="e.g., 12345-67890"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Status
                      </label>
                      <select
                        value={editingPart.status}
                        onChange={(e) => setEditingPart({ ...editingPart, status: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                        style={selectDropdownStyle}
                      >
                        <option value="pending">Pending</option>
                        <option value="purchased">Ordered</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    {/* Project */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                      </label>
                      <select
                        value={editingPart.projectId || ''}
                        onChange={(e) => setEditingPart({ ...editingPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                        style={selectDropdownStyle}
                      >
                        <option value="">No Project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vendor Dropdown */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Vendor
                      </label>
                      <select
                        value={uniqueVendors.includes(editingPart.vendor) ? editingPart.vendor : ''}
                        onChange={(e) => setEditingPart({ ...editingPart, vendor: e.target.value })}
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
                    </div>

                    {/* Add New Vendor */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                        Or add new vendor:
                      </label>
                      <input
                        type="text"
                        value={uniqueVendors.includes(editingPart.vendor) ? '' : editingPart.vendor}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditingPart({ ...editingPart, vendor: newValue });
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="Enter new vendor name"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN - Price fields */}
                  <div className="order-2 md:order-none flex flex-col gap-4">
                    {/* Empty space to align with Part Name on left */}
                    <div className="hidden md:block h-[70px]"></div>
                    
                    {/* Tracking Number */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={editingPart.tracking}
                        onChange={(e) => setEditingPart({ ...editingPart, tracking: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="e.g., 1Z999AA10123456784"
                      />
                    </div>
                    
                    {/* Price */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPart.price}
                        onChange={(e) => setEditingPart({ ...editingPart, price: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Shipping */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Shipping ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPart.shipping}
                        onChange={(e) => setEditingPart({ ...editingPart, shipping: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Duties */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        Import Duties ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPart.duties}
                        onChange={(e) => setEditingPart({ ...editingPart, duties: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                            : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                        }`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Price Breakdown Box - aligned to bottom */}
                    <div className={`mt-auto border rounded-lg p-4 ${
                      darkMode 
                        ? 'bg-gray-700/50 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-slate-700'
                          }`}>Price:</span>
                          <span className={`text-sm font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            ${(parseFloat(editingPart.price) || 0).toFixed(2)}
                          </span>
                        </div>
                        {(parseFloat(editingPart.shipping) || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>Shipping:</span>
                            <span className={`text-sm font-medium ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              ${(parseFloat(editingPart.shipping) || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {(parseFloat(editingPart.duties) || 0) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>Import Duties:</span>
                            <span className={`text-sm font-medium ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              ${(parseFloat(editingPart.duties) || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-center justify-between pt-2 border-t ${
                          darkMode ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          <span className={`text-base font-semibold ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>Total:</span>
                          <span className={`text-xl font-bold ${
                            darkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            ${((parseFloat(editingPart.price) || 0) + (parseFloat(editingPart.shipping) || 0) + (parseFloat(editingPart.duties) || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
              {/* Edit Footer */}
              {partDetailView === 'edit' && (
              <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPartDetailView('detail');
                      setEditingPart(null);
                      setOriginalPartData(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center text-sm border ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete Part',
                        message: 'Are you sure you want to delete this part? This action cannot be undone.',
                        confirmText: 'Delete',
                        onConfirm: async () => {
                          await deletePart(viewingPart.id);
                          setShowPartDetailModal(false);
                          setViewingPart(null);
                          setPartDetailView('detail');
                          setEditingPart(null);
                          setOriginalPartData(null);
                        }
                      });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                      darkMode
                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPartDetailView('manage-vendors')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Vendors
                  </button>
                  <button
                    onClick={async () => {
                      await saveEditedPart();
                      // Update viewingPart with the saved changes
                      setViewingPart({
                        ...viewingPart,
                        ...editingPart,
                        price: parseFloat(editingPart.price) || 0,
                        shipping: parseFloat(editingPart.shipping) || 0,
                        duties: parseFloat(editingPart.duties) || 0,
                        total: (parseFloat(editingPart.price) || 0) + (parseFloat(editingPart.shipping) || 0) + (parseFloat(editingPart.duties) || 0),
                        delivered: editingPart.status === 'delivered',
                        shipped: editingPart.status === 'delivered' || editingPart.status === 'shipped',
                        purchased: editingPart.status === 'delivered' || editingPart.status === 'shipped' || editingPart.status === 'purchased'
                      });
                      setPartDetailView('detail');
                    }}
                    disabled={!editingPart.part}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      !editingPart.part
                        ? darkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span className="sm:hidden">Save</span>
                    <span className="hidden sm:inline">Save Changes</span>
                  </button>
                </div>
              </div>
              )}

              {/* Manage Vendors View */}
              {partDetailView === 'manage-vendors' && (
              <div className="p-6 modal-scrollable slide-in-right">
                {uniqueVendors.length === 0 ? (
                  <div className={`text-center py-12 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No vendors yet. Add parts with vendors to see them here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uniqueVendors.map(vendor => {
                      const partCount = parts.filter(p => p.vendor === vendor).length;
                      const isEditing = editingVendor?.oldName === vendor;
                      return (
                        <div 
                          key={vendor}
                          className={`p-4 rounded-lg border ${
                            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingVendor.newName}
                                  onChange={(e) => setEditingVendor({ ...editingVendor, newName: e.target.value })}
                                  className={`w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    darkMode 
                                      ? 'bg-gray-800 border-gray-600 text-gray-100' 
                                      : 'bg-slate-50 border-slate-300 text-slate-800'
                                  }`}
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVendorColor(vendor)}`}>
                                    {vendor}
                                  </span>
                                  <span className={`text-sm ${
                                    darkMode ? 'text-gray-400' : 'text-slate-600'
                                  }`}>
                                    {partCount} {partCount === 1 ? 'part' : 'parts'}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      renameVendor(vendor, editingVendor.newName);
                                      setEditingVendor(null);
                                    }}
                                    disabled={!editingVendor.newName.trim() || editingVendor.newName === vendor}
                                    className={`p-2 rounded-lg transition-colors ${
                                      !editingVendor.newName.trim() || editingVendor.newName === vendor
                                        ? darkMode 
                                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : darkMode
                                          ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                                          : 'bg-green-50 hover:bg-green-100 text-green-600'
                                    }`}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingVendor(null)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      darkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                    }`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingVendor({ oldName: vendor, newName: vendor })}
                                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                      darkMode
                                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                    }`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Delete Vendor',
                                        message: `Are you sure you want to delete "${vendor}"? This will remove the vendor from ${partCount} ${partCount === 1 ? 'part' : 'parts'}.`,
                                        confirmText: 'Delete',
                                        onConfirm: () => deleteVendor(vendor)
                                      });
                                    }}
                                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                      darkMode
                                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400'
                                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
              {partDetailView === 'manage-vendors' && (
              <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
              }`}>
                <button
                  onClick={() => {
                    setPartDetailView('edit');
                    setEditingVendor(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <PrimaryButton
                  onClick={() => {
                    setPartDetailView('edit');
                    setEditingVendor(null);
                  }}
                >
                  Done
                </PrimaryButton>
              </div>
              )}

            </div>
          </div>
        )}

        {/* PARTS TAB CONTENT */}
        {activeTab === 'parts' && (
          <div className="slide-in-left">
          <>
        {/* Statistics and Cost Breakdown - Side by Side */}
        <div className="flex flex-col gap-6 mb-6 stats-container-800">
          <style>{`
            @media (min-width: 800px) {
              .stats-container-800 {
                display: grid !important;
                grid-template-columns: 1.5fr 1fr !important;
              }
              .stats-cards-800 {
                display: flex !important;
                flex-direction: column !important;
                gap: 1rem !important;
                height: 100% !important;
                justify-content: space-between !important;
                order: 0 !important;
              }
              .stats-cards-800 > div:first-child {
                flex-shrink: 0 !important;
              }
              .stats-cards-800 .space-y-4 {
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }
              .cost-breakdown-800 {
                order: 0 !important;
              }
              .search-box-800 {
                display: block !important;
              }
              .circular-progress-800 {
                display: flex !important;
              }
              .mobile-progress-800 {
                display: none !important;
              }
            }
          `}</style>
          {/* Statistics Cards - 3 column grid on mobile */}
          <div className="space-y-4 order-1 stats-cards-800">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div 
                onClick={() => {
                  setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased');
                  setDeliveredFilter('all');
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-yellow-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'purchased' ? 'ring-2 ring-yellow-500' : ''}`}
              >
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Ordered</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.purchased}</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped');
                  setDeliveredFilter('all');
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-blue-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'shipped' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Shipped</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.shipped}</p>
                </div>
              </div>

              <div 
                onClick={() => {
                  // Cycle through: all -> only -> hide -> all
                  setDeliveredFilter(prev => 
                    prev === 'all' ? 'only' : 
                    prev === 'only' ? 'hide' : 'all'
                  );
                  setStatusFilter('all');
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 ${
                  deliveredFilter === 'hide' ? 'border-red-500' : 'border-green-500'
                } relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  deliveredFilter === 'hide' 
                    ? (darkMode ? 'bg-gray-900' : 'bg-gray-300') 
                    : (darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50')
                } ${deliveredFilter !== 'all' ? `ring-2 ${deliveredFilter === 'hide' ? 'ring-red-500' : 'ring-green-500'}` : ''}`}
              >
                <CheckCircle className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  deliveredFilter === 'hide' ? 'text-red-500' : 'text-green-500'
                } opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4`} />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Delivered</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.delivered}</p>
                </div>
              </div>
            </div>

            {/* Search Box - Shows in left column at 800px+ */}
            <div className={`hidden search-box-800 rounded-lg shadow-md p-3 ${
              darkMode ? 'bg-gray-800' : 'bg-slate-100'
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Cost Breakdown - order-2 on mobile, full column width at 800px+ */}
          <div className="order-2 cost-breakdown-800">
            <div className={`rounded-lg shadow-md p-3 pb-2 h-full flex flex-col ${
              darkMode ? 'bg-gray-800' : 'bg-slate-100'
            }`}>
            <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <TrendingUp className="w-4 h-4" />
              Cost Breakdown
            </h3>
            <div className="flex gap-4 flex-1">
              {/* Circular Progress - Desktop Only */}
              <div className="hidden circular-progress-800 items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className={darkMode ? 'text-gray-700' : 'text-gray-200'}
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats.delivered / stats.total))}`}
                      className="text-green-500 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {Math.round((stats.delivered / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="grid grid-cols-1 gap-0.5 flex-1">
                <div className={`flex items-center justify-between py-0.5`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Parts</p>
                  <PriceDisplay 
                    amount={stats.totalPrice}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between py-0.5`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Shipping</p>
                  <PriceDisplay 
                    amount={stats.totalShipping}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between py-0.5 border-b ${
                  darkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Import Duties</p>
                  <PriceDisplay 
                    amount={stats.totalDuties}
                    className={`text-sm font-semibold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                <div className={`flex items-center justify-between`}>
                  <p className={`text-sm font-bold ${
                    darkMode ? 'text-gray-200' : 'text-slate-800'
                  }`}>Total</p>
                  <PriceDisplay 
                    amount={stats.totalCost}
                    className={`text-base font-bold truncate ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}
                    darkMode={darkMode}
                  />
                </div>
                
                {/* Mobile Progress Bar */}
                <div className="pt-1 md:pt-1.5 mt-auto mobile-progress-800">
                  <p className={`text-xs mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>Progress</p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 rounded-full h-2 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      {Math.round((stats.delivered / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Search Box - Mobile only */}
          <div className={`md:hidden rounded-lg shadow-md p-3 order-3 ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          }`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search parts..."
                className={`w-full pl-10 pr-10 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parts Table */}
        {/* Desktop Table View - Hidden below 800px */}
        {filteredParts.length > 0 ? (
        <div className={`hidden-below-800 rounded-lg shadow-md ${
          darkMode ? 'bg-gray-800' : 'bg-slate-100'
        }`}>
          <div className="overflow-x-auto overflow-y-visible rounded-lg">
            <table className={`w-full ${isSorting ? 'table-sorting' : ''}`}>
              <thead className={`border-b ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-100 border-slate-200'
              }`}>
                <tr>
                  <th 
                    onClick={() => handleSort('status')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part</th>
                  <th className={`hidden px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part #</th>
                  <th 
                    onClick={() => handleSort('vendor')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Vendor
                      {getSortIcon('vendor')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('project')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Project
                      {getSortIcon('project')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vehicle')}
                    className={`hidden xl:table-cell px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Vehicle
                      {getSortIcon('vehicle')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total')}
                    className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Total
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Tracking</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-slate-200'
              }`}>
                {filteredParts.map((part) => (
                  <tr 
                    key={part.id} 
                    onClick={() => {
                      setViewingPart(part);
                      setShowPartDetailModal(true);
                    }}
                    className={`transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusDropdown part={part} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>{part.part}</div>
                    </td>
                    <td className="hidden px-6 py-4">
                      {part.partNumber && part.partNumber !== '-' ? (
                        <div className={`text-sm font-mono ${
                          darkMode ? 'text-gray-300' : 'text-slate-600'
                        }`}>{part.partNumber}</div>
                      ) : (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Part #
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {part.vendor ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-center ${getVendorColor(part.vendor)}`}>
                          {part.vendor}
                        </span>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-center border ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Vendor
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ProjectDropdown part={part} />
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 text-center">
                      {(() => {
                        const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                        const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                        return vehicle ? (
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                              darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            <Car className="w-3 h-3 mr-1" />
                            <span style={{ color: vehicle.color || '#3B82F6' }}>
                              {vehicle.nickname || vehicle.name}
                            </span>
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                            darkMode 
                              ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}>
                            No Vehicle
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {part.tracking ? (
                        getTrackingUrl(part.tracking) ? (
                          <a
                            href={getTrackingUrl(part.tracking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-400 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors w-28"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getCarrierName(part.tracking)}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <div className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md w-28 ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {getCarrierName(part.tracking)}
                          </div>
                        )
                      ) : (
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md w-28 border ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          No Tracking
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`px-6 py-4 border-t ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Showing <span className="font-semibold">{filteredParts.length}</span> of <span className="font-semibold">{stats.total}</span> parts
            </p>
          </div>
        </div>
        ) : (
          <div className={`hidden-below-800 text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          }`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all' 
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
            {!searchTerm && statusFilter === 'all' && vendorFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add First Part
              </button>
            )}
          </div>
        )}

        {/* Mobile Card View - Visible only below 800px */}
        {filteredParts.length > 0 ? (
        <div className="show-below-800 grid grid-cols-1 gap-4">
            {filteredParts.map((part) => (
              <div 
                key={part.id}
                onClick={() => {
                  setViewingPart(part);
                  setShowPartDetailModal(true);
                }}
                className={`relative rounded-lg shadow-lg p-4 transition-all hover:shadow-xl cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-800' 
                    : 'bg-slate-100'
                }`}
              >
                {/* Card Header - Part Name and Vehicle Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`text-base font-bold flex-1 ${
                    darkMode ? 'text-gray-100' : 'text-slate-800'
                  }`}>
                    {part.part}
                  </h3>
                  {/* Vehicle Badge - Top Right */}
                  {(() => {
                    const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                    const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                    return vehicle && (
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <Car className="w-3 h-3 mr-1" />
                        <span style={{ color: vehicle.color || '#3B82F6' }}>
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </span>
                    );
                  })()}
                </div>

                {/* Vendor and Project Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  {/* Vendor on Left (or "none" badge if no vendor) */}
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Vendor:</p>
                    {part.vendor ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                        {part.vendor}
                      </span>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        none
                      </span>
                    )}
                  </div>
                  
                  {/* Project on Right (with label) */}
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Project:</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ProjectDropdown part={part} />
                    </div>
                  </div>
                </div>

                {/* Part Number and Status Row - Mobile only */}
                <div className="mb-3 sm:hidden">
                  <div className="flex items-center justify-between gap-3">
                    {/* Part Number on Left */}
                    {part.partNumber && part.partNumber !== '-' ? (
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Part #:</p>
                        <p className={`text-sm font-mono ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{part.partNumber}</p>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    {/* Status on Right (no label) */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusDropdown part={part} />
                    </div>
                  </div>
                </div>
                
                {/* Desktop: Show full price breakdown */}
                <div className="mb-3 hidden sm:block">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Price</p>
                        <p className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>${part.price.toFixed(2)}</p>
                      </div>
                      {part.shipping > 0 && (
                        <div>
                          <p className={`text-xs mb-0.5 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Ship</p>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${part.shipping.toFixed(2)}</p>
                        </div>
                      )}
                      {part.duties > 0 && (
                        <div>
                          <p className={`text-xs mb-0.5 ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>Duties</p>
                          <p className={`text-sm font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>${part.duties.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Total</p>
                        <p className={`text-base font-bold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>${part.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className={`my-3 border-t ${
                  darkMode ? 'border-gray-700' : 'border-slate-200'
                }`}></div>

                {/* Tracking and Total Price Row (Mobile Only) */}
                <div className="flex items-center justify-between gap-3 sm:hidden">
                  {/* Tracking on Left */}
                  <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                    {part.tracking ? (
                      getTrackingUrl(part.tracking) ? (
                        <a
                          href={getTrackingUrl(part.tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track: {getCarrierName(part.tracking)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {getCarrierName(part.tracking)}
                        </div>
                      )
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}>
                        No Tracking
                      </span>
                    )}
                  </div>
                  
                  {/* Total Price on Right */}
                  <div className="flex items-baseline gap-1">
                    <p className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-slate-600'
                    }`}>Total:</p>
                    <PriceDisplay 
                      amount={part.total}
                      className={`text-xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                      }`}
                      darkMode={darkMode}
                    />
                  </div>
                </div>

                {/* Desktop: Tracking Only */}
                <div className="hidden sm:block">
                  <div className="inline-block" onClick={(e) => e.stopPropagation()}>
                    {part.tracking ? (
                      getTrackingUrl(part.tracking) ? (
                        <a
                          href={getTrackingUrl(part.tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Track: {getCarrierName(part.tracking)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {getCarrierName(part.tracking)}
                        </div>
                      )
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700/50 text-gray-500 border-gray-600' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}>
                        No Tracking
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`show-below-800 text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          }`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all' 
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
            {!searchTerm && statusFilter === 'all' && vendorFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add First Part
              </button>
            )}
          </div>
        )}
        </>
          </div>
        )}

        {/* PROJECTS TAB CONTENT */}
        {activeTab === 'projects' && (
          <div className={previousTab === 'vehicles' ? 'slide-in-left' : 'slide-in-right'}>
          <>
            {/* Projects Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isFilteringProjects ? 'projects-filtering' : ''}`}>
              {projects
                .filter(project => {
                  if (projectVehicleFilter === 'all') return true;
                  // Convert both to strings for comparison since select values are strings
                  return String(project.vehicle_id) === String(projectVehicleFilter);
                })
                .map((project) => {
                // Calculate spent based on linked parts
                const linkedPartsTotal = calculateProjectTotal(project.id, parts);
                const progress = project.budget > 0 ? (linkedPartsTotal / project.budget) * 100 : 0;
                const statusColors = getStatusColors(darkMode);
                const priorityColors = getPriorityColors(darkMode);

                return (
                  <div
                    key={project.id}
                    data-project-id={project.id}
                    onDragOver={(e) => handleDragOver(e, project)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, project)}
                    onClick={() => {
                      setViewingProject(project);
                      setOriginalProjectData({ ...project }); // Save original data for unsaved changes check
                      setProjectModalEditMode(false);
                      setShowProjectDetailModal(true);
                    }}
                    className={`relative rounded-lg shadow-lg pt-3 pb-6 px-6 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer ${
                      draggedProject?.id === project.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : dragOverProject?.id === project.id
                          ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                          : ''
                    } ${cardBg(darkMode)}`}
                  >
                    {/* Drag Handle - Hidden on mobile */}
                    <div 
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, project);
                        // Set the entire card as the drag image, positioned at top-left
                        const card = e.currentTarget.closest('[data-project-id]');
                        if (card) {
                          // Position the drag image so cursor is at the grip icon location (top-left area)
                          e.dataTransfer.setDragImage(card, 20, 20);
                        }
                      }}
                      onDragEnd={handleDragEnd}
                      className={`absolute top-2 left-2 cursor-grab active:cursor-grabbing hidden md:block ${
                        darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Edit Button - Top Right */}
                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setViewingProject(project);
                          setOriginalProjectData({ ...project }); // Save original data for unsaved changes check
                          setProjectModalEditMode(true);
                          setShowProjectDetailModal(true);
                        }}
                        className={`p-2 rounded-md transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                        }`}
                        title="Edit project"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Project Header */}
                    <div className="mb-4 mt-8">
                      <div className="mb-2">
                        <h3 className={`text-xl font-bold ${primaryText(darkMode)}`}>
                          {project.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[project.status]
                        }`}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {(() => {
                          const vehicle = project.vehicle_id ? vehicles.find(v => v.id === project.vehicle_id) : null;
                          return vehicle && (
                            <span 
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              <Car className="w-3 h-3 mr-1" />
                              <span style={{ color: vehicle.color || '#3B82F6' }}>
                                {vehicle.nickname || vehicle.name}
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4" style={{ height: '3.75rem' }}>
                      <p className={`text-sm line-clamp-3 overflow-hidden ${
                        project.description 
                          ? secondaryText(darkMode)
                          : (darkMode ? 'text-gray-500 italic' : 'text-gray-500 italic')
                      }`}
                      style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {project.description || 'No description added'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Budget Used
                        </span>
                        <span className={`text-sm font-bold ${
                          darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className={`w-full rounded-full h-3 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div
                          className={`h-3 rounded-full transition-all ${
                            progress > 90
                              ? 'bg-red-500'
                              : progress > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget Info */}
                    <div className={`grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Spent
                        </p>
                        <p className={`text-lg font-bold ${
                          linkedPartsTotal > project.budget
                            ? (darkMode ? 'text-red-400' : 'text-red-600')
                            : (darkMode ? 'text-green-400' : 'text-green-600')
                        }`}>
                          ${linkedPartsTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Budget
                        </p>
                        <p className={`text-lg font-bold ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>
                          ${Math.round(project.budget || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Dates and Priority */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          Priority:
                        </span>
                        <span className={`text-sm font-bold ${priorityColors[project.priority]}`}>
                          {project.priority?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Linked Parts */}
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === project.id);
                      return (
                        <div className={`mt-4 pt-4 border-t ${
                          darkMode ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              <Package className="w-4 h-4" />
                              Linked Parts ({linkedParts.length})
                            </span>
                          </div>
                          {linkedParts.length > 0 ? (
                            <div className={`grid grid-cols-2 gap-1 ${
                              linkedParts.length === 6 ? 'pb-6' : ''
                            }`}>
                              {linkedParts.slice(0, 6).map((part) => (
                                <div 
                                  key={part.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <span className="truncate block">{part.part}</span>
                                </div>
                              ))}
                              {linkedParts.length > 6 && (
                                <div className={`col-span-2 text-xs text-center pt-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>
                                  +{linkedParts.length - 6} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <Package className={`w-8 h-8 mx-auto mb-1.5 opacity-40 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <p className={`text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                No parts linked
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Todo Counter - Bottom Right */}
                    {project.todos && project.todos.length > 0 && (
                      <div className="absolute bottom-2 right-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <CheckCircle className={`w-3.5 h-3.5 ${
                              darkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              {project.todos.filter(t => t.completed).length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className={`w-3.5 h-3.5 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              {project.todos.filter(t => !t.completed).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State - Vehicle has no projects */}
            {projectVehicleFilter !== 'all' && projects.filter(project => String(project.vehicle_id) === String(projectVehicleFilter)).length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Car className={`w-16 h-16 mx-auto mb-4 opacity-40 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Selected vehicle has no linked projects
                </h3>
                <p className={`${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Create a project or link an existing one to this vehicle
                </p>
              </div>
            )}

            {/* Empty State - No projects at all */}
            {projects.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Wrench className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  No Projects Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Start organizing your restoration by creating your first project
                </p>
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create First Project
                </button>
              </div>
            )}

            {/* Add Project Modal */}
            {showAddProjectModal && (
              <div 
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
                  isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
                }`}
                onClick={() => handleCloseModal(() => setShowAddProjectModal(false))}
              >
                <div 
                  className={`rounded-lg shadow-xl max-w-4xl w-full overflow-hidden modal-content grid ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                  style={{
                    gridTemplateRows: 'auto 1fr auto',
                    maxHeight: '90vh'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className={`px-6 py-4 border-b flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      Add Project
                    </h2>
                    <button
                      onClick={() => handleCloseModal(() => setShowAddProjectModal(false))}
                      className={`transition-colors ${
                        darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content - takes flexible space */}
                  <div className="p-6 pb-6 md:pb-64 overflow-y-auto" style={{ minHeight: 0 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Project Name, Priority/Vehicle, Budget */}
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-slate-700'
                          }`}>
                            Project Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                            }`}
                            placeholder="e.g., Interior Restoration"
                            required
                          />
                        </div>

                        {/* Priority and Vehicle Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              Priority
                            </label>
                            <select
                              value={newProject.priority}
                              onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                              className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                  : 'bg-slate-50 border-slate-300 text-slate-800'
                              }`}
                            >
                              <option value="not_set">Not Set</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                <span>Vehicle</span>
                              </div>
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAddProjectVehicleDropdown(!showAddProjectVehicleDropdown);
                                }}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between gap-2 ${
                                  darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                                    : 'bg-slate-50 border-slate-300 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {newProject.vehicle_id ? (() => {
                                    const selectedVehicle = vehicles.find(v => v.id === newProject.vehicle_id);
                                    return selectedVehicle ? (
                                      <>
                                        <div 
                                          className="w-3 h-3 rounded-full border flex-shrink-0"
                                          style={{ 
                                            backgroundColor: selectedVehicle.color || '#3B82F6',
                                            borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                                          }}
                                        />
                                        <span className="truncate">{selectedVehicle.nickname || selectedVehicle.name}</span>
                                      </>
                                    ) : 'No vehicle';
                                  })() : 'No vehicle'}
                                </div>
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                              </button>
                              {showAddProjectVehicleDropdown && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowAddProjectVehicleDropdown(false)}
                                  />
                                  <div className={`absolute right-0 md:left-0 z-20 mt-1 rounded-lg border shadow-lg py-1 max-h-60 overflow-y-auto ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-300'
                                  }`}
                                  style={{
                                    minWidth: '200px'
                                  }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewProject({ ...newProject, vehicle_id: null });
                                        setShowAddProjectVehicleDropdown(false);
                                      }}
                                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                        !newProject.vehicle_id
                                          ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                          : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                                      }`}
                                    >
                                      No vehicle
                                    </button>
                                    {vehicles.map(vehicle => (
                                      <button
                                        key={vehicle.id}
                                        type="button"
                                        onClick={() => {
                                          setNewProject({ ...newProject, vehicle_id: vehicle.id });
                                          setShowAddProjectVehicleDropdown(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                                          newProject.vehicle_id === vehicle.id
                                            ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                            : darkMode ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-100 text-gray-900'
                                        }`}
                                      >
                                        <div 
                                          className="w-3 h-3 rounded-full border flex-shrink-0"
                                          style={{ 
                                            backgroundColor: vehicle.color || '#3B82F6',
                                            borderColor: darkMode ? '#4B5563' : '#D1D5DB'
                                          }}
                                        />
                                        <span className="truncate">
                                          {vehicle.nickname ? `${vehicle.nickname} (${vehicle.name})` : `${vehicle.name}`}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Budget Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-slate-700'
                            }`}>
                              Budget ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={newProject.budget}
                              onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                              }`}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Description (taller) */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-slate-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          className={`w-full h-48 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                              : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                          placeholder="Brief description of the project"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer - natural height only */}
                  <div className={`p-6 border-t ${
                    darkMode ? 'border-gray-700' : 'border-slate-200'
                  }`}>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddProjectModal(false)}
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
                          if (!newProject.name) {
                            alert('Please enter a project name');
                            return;
                          }
                          await addProject(newProject);
                          setNewProject({
                            name: '',
                            description: '',
                            budget: '',
                            priority: 'not_set',
                            status: 'planning'
                          });
                          setShowAddProjectModal(false);
                        }}
                        disabled={!newProject.name}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                          !newProject.name
                            ? darkMode 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Add Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Detail Modal */}
            {showProjectDetailModal && viewingProject && (
              <div 
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop ${
                  isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
                }`}
                onClick={() => handleCloseModal(() => {
                  // Check for unsaved changes
                  if (hasUnsavedProjectChanges()) {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Unsaved Changes',
                      message: 'You have unsaved changes. Are you sure you want to close without saving?',
                      confirmText: 'Discard',
                      cancelText: 'Go Back',
                      onConfirm: () => {
                        setShowProjectDetailModal(false);
                        setViewingProject(null);
                        setOriginalProjectData(null);
                        setProjectModalEditMode(false);
                      }
                    });
                    return;
                  }
                  setShowProjectDetailModal(false);
                  setViewingProject(null);
                  setOriginalProjectData(null);
                  setProjectModalEditMode(false);
                })}
              >
                <div 
                  className={`rounded-lg shadow-xl max-w-5xl w-full overflow-hidden modal-content transition-all duration-700 ease-in-out grid ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                  style={{
                    gridTemplateRows: 'auto 1fr auto',
                    maxHeight: projectModalEditMode ? '90vh' : '85vh',
                    transition: 'max-height 0.7s ease-in-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <h2 className={`text-2xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                        {viewingProject.name}
                      </h2>
                      <button
                        onClick={() => handleCloseModal(() => {
                          // Check for unsaved changes
                          if (hasUnsavedProjectChanges()) {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Unsaved Changes',
                              message: 'You have unsaved changes. Are you sure you want to close without saving?',
                              confirmText: 'Discard',
                              cancelText: 'Go Back',
                              onConfirm: () => {
                                setShowProjectDetailModal(false);
                                setViewingProject(null);
                                setOriginalProjectData(null);
                                setProjectModalEditMode(false);
                              }
                            });
                            return;
                          }
                          setShowProjectDetailModal(false);
                          setViewingProject(null);
                          setOriginalProjectData(null);
                          setProjectModalEditMode(false);
                        })}
                        className={`p-2 rounded-md transition-colors flex-shrink-0 ${
                          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content - with slide animation */}
                  <div className="relative min-h-[calc(90vh-180px)]">
                    {/* Project Details View */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        projectModalEditMode
                          ? 'absolute opacity-0 pointer-events-none' 
                          : 'relative opacity-100'
                      }`}
                    >
                      <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                        <ProjectDetailView
                          project={viewingProject}
                          parts={parts}
                          darkMode={darkMode}
                          vehicle={viewingProject.vehicle_id ? vehicles.find(v => v.id === viewingProject.vehicle_id) : null}
                          updateProject={async (projectId, updates) => {
                            await updateProject(projectId, updates);
                            // Refresh the viewing project with the latest data
                            await loadProjects();
                            const updatedProject = projects.find(p => p.id === projectId);
                            if (updatedProject) {
                              setViewingProject({ ...updatedProject, ...updates });
                            }
                          }}
                          getStatusColors={getStatusColors}
                          getPriorityColors={getPriorityColors}
                          getStatusText={getStatusText}
                          getStatusTextColor={getStatusTextColor}
                          getVendorColor={getVendorColor}
                          calculateProjectTotal={calculateProjectTotal}
                          editingTodoId={editingTodoId}
                          setEditingTodoId={setEditingTodoId}
                          editingTodoText={editingTodoText}
                          setEditingTodoText={setEditingTodoText}
                          newTodoText={newTodoText}
                          setNewTodoText={setNewTodoText}
                        />
                      </div>
                    </div>

                    {/* Edit Project View - Slides in for editing */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        projectModalEditMode
                          ? 'relative opacity-100' 
                          : 'absolute opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                        <ProjectEditForm
                          project={viewingProject}
                          onProjectChange={setViewingProject}
                          vehicles={vehicles}
                          parts={parts}
                          unlinkPartFromProject={unlinkPartFromProject}
                          getVendorColor={getVendorColor}
                          darkMode={darkMode}
                        />

                        <LinkedPartsSection
                          projectId={viewingProject.id}
                          parts={parts}
                          unlinkPartFromProject={unlinkPartFromProject}
                          getVendorColor={getVendorColor}
                          darkMode={darkMode}
                          setConfirmDialog={setConfirmDialog}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer with conditional buttons */}
                  <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
                  }`}>
                    {projectModalEditMode ? (
                      <button
                        onClick={() => {
                          // Check for unsaved changes before going back
                          if (hasUnsavedProjectChanges()) {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Unsaved Changes',
                              message: 'You have unsaved changes. Are you sure you want to go back without saving?',
                              confirmText: 'Discard',
                              cancelText: 'Keep Editing',
                              onConfirm: () => {
                                // Restore original data
                                if (originalProjectData) {
                                  setViewingProject({ ...originalProjectData });
                                }
                                setProjectModalEditMode(false);
                              }
                            });
                            return;
                          }
                          setProjectModalEditMode(false);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                        }`}
                        title="Back"
                      >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                      </button>
                    ) : (
                      <div></div>
                    )}
                    {projectModalEditMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const partsForProject = parts.filter(p => p.projectId === viewingProject.id);
                            const hasParts = partsForProject.length > 0;
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Delete Project',
                              message: hasParts
                                ? `This project has ${partsForProject.length} part(s) linked to it. Deleting it will unlink these parts. This action cannot be undone.`
                                : 'Are you sure you want to permanently delete this project? This action cannot be undone.',
                              confirmText: 'Delete',
                              onConfirm: async () => {
                                await deleteProject(viewingProject.id);
                                setShowProjectDetailModal(false);
                                setViewingProject(null);
                                setOriginalProjectData(null);
                                setProjectModalEditMode(false);
                              }
                            });
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm mr-4 ${
                            darkMode
                              ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                              : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                        <button
                          onClick={async () => {
                            // Toggle on_hold status
                            const newStatus = viewingProject.status === 'on_hold' ? 'in_progress' : 'on_hold';
                            const updatedProject = { ...viewingProject, status: newStatus };
                            await updateProject(viewingProject.id, {
                              status: newStatus
                            });
                            setViewingProject(updatedProject);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                            viewingProject.status === 'on_hold'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                          }`}
                        >
                          {viewingProject.status === 'on_hold' ? 'Resume' : 'Pause'}
                        </button>
                        <PrimaryButton
                          onClick={async () => {
                            await updateProject(viewingProject.id, {
                              name: viewingProject.name,
                              description: viewingProject.description,
                              budget: parseFloat(viewingProject.budget),
                              priority: viewingProject.priority,
                              vehicle_id: viewingProject.vehicle_id || null,
                              todos: viewingProject.todos || []
                            });
                            // Update viewing data with saved changes
                            const updatedProject = {
                              ...viewingProject,
                              budget: parseFloat(viewingProject.budget)
                            };
                            setViewingProject(updatedProject);
                            setOriginalProjectData({ ...updatedProject });
                            setProjectModalEditMode(false);
                          }}
                        >
                          <span className="sm:hidden">Save</span>
                          <span className="hidden sm:inline">Save Changes</span>
                        </PrimaryButton>
                      </div>
                    ) : (
                      <PrimaryButton
                        onClick={() => {
                          setProjectModalEditMode(true);
                        }}
                        icon={Edit2}
                      >
                        Edit
                      </PrimaryButton>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
          </div>
        )}

        {/* VEHICLES TAB CONTENT */}
        {activeTab === 'vehicles' && (
          <div className="slide-in-right">
          <>
            {/* Active Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.filter(v => !v.archived).map((vehicle) => (
                <div
                  key={vehicle.id}
                  data-vehicle-id={vehicle.id}
                  onDragOver={(e) => handleVehicleDragOver(e, vehicle)}
                  onDragLeave={handleVehicleDragLeave}
                  onDrop={(e) => handleVehicleDrop(e, vehicle)}
                  onClick={() => {
                    setViewingVehicle(vehicle);
                    setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                    setShowVehicleDetailModal(true);
                  }}
                  className={`relative rounded-lg shadow-lg pt-3 ${vehicle.archived ? 'pb-3' : 'pb-4'} px-6 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border-t-4 ${
                    draggedVehicle?.id === vehicle.id 
                      ? 'ring-2 ring-blue-500 ring-offset-2' 
                      : dragOverVehicle?.id === vehicle.id
                        ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                        : ''
                  } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                  style={{ borderTopColor: getMutedColor(vehicle.color, darkMode) }}
                >
                  {/* Drag Handle - Hidden on mobile */}
                  <div 
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleVehicleDragStart(e, vehicle);
                      // Set the entire card as the drag image, positioned at top-left
                      const card = e.currentTarget.closest('[data-vehicle-id]');
                      if (card) {
                        // Position the drag image so cursor is at the grip icon location (top-left area)
                        e.dataTransfer.setDragImage(card, 20, 20);
                      }
                    }}
                    onDragEnd={handleVehicleDragEnd}
                    className={`absolute top-2 left-2 cursor-grab active:cursor-grabbing hidden md:block ${
                      darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Edit Button - Top Right */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingVehicle(vehicle);
                        setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                        setVehicleModalEditMode('vehicle');
                        setShowVehicleDetailModal(true);
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                      }`}
                      title="Edit vehicle"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Vehicle Image */}
                  {vehicle.image_url && (
                    <div className="mb-4 mt-10 relative">
                      <img 
                        src={vehicle.image_url} 
                        alt={vehicle.nickname || vehicle.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-48 object-cover rounded-lg border ${
                          vehicle.archived 
                            ? 'grayscale opacity-40' 
                            : ''
                        } ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}`}
                      />
                      {vehicle.archived && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-2xl font-bold px-6 py-2 rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900/80 text-gray-300 border-2 border-gray-600' 
                              : 'bg-white/80 text-gray-700 border-2 border-gray-400'
                          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                            ARCHIVED
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Header */}
                  <div className={`mb-4 ${vehicle.image_url ? 'mt-4' : 'mt-8'}`}>
                    <h3 className={`text-xl font-bold mb-1 ${
                      darkMode ? 'text-gray-100' : 'text-slate-800'
                    }`}>
                      {vehicle.nickname || [vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                    </h3>
                    {vehicle.nickname && (
                      <p className={`text-sm mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-slate-600'
                      }`}>
                        {[vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {!vehicle.archived && (
                      <>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {vehicle.vin && (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'
                            }`}>
                              VIN: {vehicle.vin}
                            </span>
                          )}
                          {vehicle.license_plate && (
                            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                              darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {vehicle.license_plate}
                            </span>
                          )}
                        </div>

                        {/* Project Badges */}
                        {(() => {
                          const vehicleProjects = getVehicleProjects(vehicle.id);
                          return (
                            <div className={`mt-4 pt-4 border-t ${
                              darkMode ? 'border-gray-700' : 'border-slate-200'
                            }`}>
                              <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>
                                Projects ({vehicleProjects.length})
                              </h4>
                              {vehicleProjects.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {vehicleProjects.slice(0, 4).map((project) => (
                                    <span
                                      key={project.id}
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                        darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                                      }`}
                                      style={{ 
                                        borderLeftWidth: '3px', 
                                        borderLeftColor: getPriorityBorderColor(project.priority),
                                        width: 'calc(50% - 4px)'
                                      }}
                                    >
                                      <Wrench className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{project.name}</span>
                                    </span>
                                  ))}
                                  {vehicleProjects.length > 4 && (
                                    <div className="w-full text-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                        darkMode ? 'text-gray-500' : 'text-gray-600'
                                      }`}>
                                        +{vehicleProjects.length - 4} more
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <Wrench className={`w-8 h-8 mx-auto mb-2 opacity-40 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                  <p className={`text-xs ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    No projects linked
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                    {vehicle.archived && vehicle.vin && (
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'
                        }`}>
                          VIN: {vehicle.vin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Archived Vehicles Section */}
            {vehicles.filter(v => v.archived).length > 0 && (
              <>
                <div className={`my-8 border-t ${
                  darkMode ? 'border-gray-700' : 'border-slate-300'
                }`}>
                  <h2 className={`text-lg font-semibold mt-8 mb-6 ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    Archived Vehicles
                  </h2>
                </div>

                {/* Archive Drop Zone - appears when dragging an active vehicle */}
                {draggedVehicle && !draggedVehicle.archived && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverArchiveZone(true);
                    }}
                    onDragLeave={() => setDragOverArchiveZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleArchiveZoneDrop(true);
                    }}
                    className={`hidden md:block mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                      dragOverArchiveZone
                        ? darkMode
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-600 bg-blue-100/50'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800/50'
                          : 'border-gray-300 bg-gray-100/50'
                    }`}
                  >
                    <p className={`text-center text-sm ${
                      dragOverArchiveZone
                        ? darkMode ? 'text-blue-400' : 'text-blue-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Drop here to archive
                    </p>
                  </div>
                )}

                {/* Unarchive Drop Zone - appears when dragging an archived vehicle */}
                {draggedVehicle && draggedVehicle.archived && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverArchiveZone(true);
                    }}
                    onDragLeave={() => setDragOverArchiveZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleArchiveZoneDrop(false);
                    }}
                    className={`hidden md:block mb-6 p-6 rounded-lg border-2 border-dashed transition-all ${
                      dragOverArchiveZone
                        ? darkMode
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-green-600 bg-green-100/50'
                        : darkMode
                          ? 'border-gray-600 bg-gray-800/50'
                          : 'border-gray-300 bg-gray-100/50'
                    }`}
                  >
                    <p className={`text-center text-sm ${
                      dragOverArchiveZone
                        ? darkMode ? 'text-green-400' : 'text-green-600'
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Drop here to unarchive
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {vehicles.filter(v => v.archived).map((vehicle) => (
                    <div
                      key={vehicle.id}
                      data-vehicle-id={vehicle.id}
                      onDragOver={(e) => handleVehicleDragOver(e, vehicle)}
                      onDragLeave={handleVehicleDragLeave}
                      onDrop={(e) => handleVehicleDrop(e, vehicle)}
                      onClick={() => {
                        setViewingVehicle(vehicle);
                        setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                        setShowVehicleDetailModal(true);
                      }}
                      className={`relative rounded-lg shadow-lg pt-2 pb-2 px-3 transition-all duration-200 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border-t-4 ${
                        draggedVehicle?.id === vehicle.id 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : dragOverVehicle?.id === vehicle.id
                            ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                            : ''
                      } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                      style={{ borderTopColor: getMutedColor(vehicle.color, darkMode) }}
                    >
                      {/* Drag Handle - Hidden on mobile */}
                      <div 
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleVehicleDragStart(e, vehicle);
                          // Set the entire card as the drag image, positioned at top-left
                          const card = e.currentTarget.closest('[data-vehicle-id]');
                          if (card) {
                            // Position the drag image so cursor is at the grip icon location (top-left area)
                            e.dataTransfer.setDragImage(card, 20, 20);
                          }
                        }}
                        onDragEnd={handleVehicleDragEnd}
                        className={`absolute top-1 left-1 cursor-grab active:cursor-grabbing hidden md:block ${
                          darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Edit Button - Top Right */}
                      <div className="absolute top-1 right-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingVehicle(vehicle);
                            setOriginalVehicleData({ ...vehicle }); // Save original data for unsaved changes check
                            setVehicleModalEditMode('vehicle');
                            setShowVehicleDetailModal(true);
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            darkMode ? 'hover:bg-gray-700 text-gray-500 hover:text-blue-400' : 'hover:bg-gray-100 text-gray-500 hover:text-blue-600'
                          }`}
                          title="Edit vehicle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Vehicle Image */}
                      {vehicle.image_url && (
                        <div className="mb-2 mt-8 relative">
                          <img 
                            src={vehicle.image_url} 
                            alt={vehicle.name}
                            className={`w-full h-32 object-cover rounded-lg border grayscale opacity-40 ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'
                            }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-lg font-bold px-4 py-1 rounded-lg ${
                              darkMode 
                                ? 'bg-gray-900/80 text-gray-300 border-2 border-gray-600' 
                                : 'bg-white/80 text-gray-700 border-2 border-gray-400'
                            }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                              ARCHIVED
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Header */}
                      <div className={`mb-2 ${vehicle.image_url ? 'mt-2' : 'mt-8'}`}>
                        <h3 className={`text-base font-bold mb-1 ${
                          darkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>
                          {vehicle.nickname || [vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                        </h3>
                        {vehicle.nickname && (
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            {[vehicle.year, vehicle.make, vehicle.name].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {vehicles.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-slate-100'
              }`}>
                <Car className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  No Vehicles Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Add your first vehicle to track maintenance and information
                </p>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add First Vehicle
                </button>
              </div>
            )}

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
              <div 
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
                  isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
                }`}
                onClick={() => handleCloseModal(() => setShowAddVehicleModal(false))}
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
                      onClick={() => handleCloseModal(() => setShowAddVehicleModal(false))}
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

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-slate-700'
                          }`}>
                            Insurance Policy
                          </label>
                          <input
                            type="text"
                            value={newVehicle.insurance_policy}
                            onChange={(e) => setNewVehicle({ ...newVehicle, insurance_policy: e.target.value })}
                            className={inputClasses(darkMode)}
                            placeholder=""
                          />
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
                          setShowAddVehicleModal(false);
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
                          setShowAddVehicleModal(false);
                          setNewVehicle({
                            nickname: '',
                            name: '',
                            make: '',
                            year: '',
                            license_plate: '',
                            vin: '',
                            insurance_policy: '',
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
            )}


            {/* Vehicle Detail Modal */}
            {showVehicleDetailModal && viewingVehicle && (
              <div 
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-backdrop ${
                  isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
                }`}
                onClick={() => handleCloseModal(() => {
                  // Check for unsaved changes
                  if (hasUnsavedVehicleChanges()) {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Unsaved Changes',
                      message: 'You have unsaved changes. Are you sure you want to close without saving?',
                      confirmText: 'Discard',
                      cancelText: 'Go Back',
                      onConfirm: () => {
                        setShowVehicleDetailModal(false);
                        setViewingVehicle(null);
                        setOriginalVehicleData(null);
                        setVehicleModalProjectView(null);
                        setVehicleModalEditMode(null);
                        clearImageSelection();
                      }
                    });
                    return;
                  }
                  setShowVehicleDetailModal(false);
                  setViewingVehicle(null);
                  setOriginalVehicleData(null);
                  setVehicleModalProjectView(null);
                  setVehicleModalEditMode(null);
                  clearImageSelection();
                })}
              >
                <div 
                  className={`rounded-lg shadow-xl max-w-5xl w-full overflow-hidden modal-content transition-all duration-700 ease-in-out grid ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-slate-100'}`}
                  style={{
                    gridTemplateRows: 'auto 1fr auto',
                    maxHeight: vehicleModalEditMode ? '90vh' : '85vh',
                    transition: 'max-height 0.7s ease-in-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <h2 className={`text-2xl font-bold ${
                        darkMode ? 'text-gray-100' : 'text-slate-800'
                      }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                        {vehicleModalProjectView ? vehicleModalProjectView.name : (viewingVehicle.nickname || viewingVehicle.name || 'Vehicle Details')}
                      </h2>
                      {!vehicleModalProjectView && viewingVehicle.archived && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                            : 'bg-gray-200 text-gray-700 border border-gray-400'
                        }`}>
                          Archived
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCloseModal(() => {
                        // Check for unsaved changes
                        if (hasUnsavedVehicleChanges()) {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Unsaved Changes',
                            message: 'You have unsaved changes. Are you sure you want to close without saving?',
                            confirmText: 'Discard',
                            cancelText: 'Go Back',
                            onConfirm: () => {
                              setShowVehicleDetailModal(false);
                              setViewingVehicle(null);
                              setOriginalVehicleData(null);
                              setVehicleModalProjectView(null);
                              setVehicleModalEditMode(null);
                              clearImageSelection();
                            }
                          });
                          return;
                        }
                        setShowVehicleDetailModal(false);
                        setViewingVehicle(null);
                        setOriginalVehicleData(null);
                        setVehicleModalProjectView(null);
                        setVehicleModalEditMode(null);
                        clearImageSelection();
                      })}
                      className={`p-2 rounded-md transition-colors ${
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content - with slide animation */}
                  <div className="relative min-h-[calc(90vh-180px)]">
                    {/* Vehicle Details View */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        vehicleModalProjectView || vehicleModalEditMode
                          ? 'absolute opacity-0 pointer-events-none' 
                          : 'relative opacity-100'
                      }`}
                    >
                      <div className="p-6 pb-12 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                    {/* Top Section: Image and Basic Info side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info Card - Half width on desktop, two column layout - appears second on mobile */}
                      <div className={`order-last md:order-first rounded-lg p-6 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Basic Info
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-4">
                            {viewingVehicle.year && (
                              <div>
                                <p className={`text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>Year</p>
                                <p className={`text-base ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>{viewingVehicle.year}</p>
                              </div>
                            )}
                            {viewingVehicle.make && (
                              <div>
                                <p className={`text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>Make</p>
                                <p className={`text-base ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>{viewingVehicle.make}</p>
                              </div>
                            )}
                            {viewingVehicle.name && (
                              <div>
                                <p className={`text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>Model</p>
                                <p className={`text-base ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>{viewingVehicle.name}</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-4">
                            {viewingVehicle.license_plate && (
                              <div>
                                <p className={`text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>License Plate</p>
                                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                  darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {viewingVehicle.license_plate}
                                </span>
                              </div>
                            )}
                            {viewingVehicle.vin && (
                              <div>
                                <p className={`text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>VIN</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-900'
                                }`}>
                                  {viewingVehicle.vin}
                                </span>
                              </div>
                            )}
                            {viewingVehicle.insurance_policy && (
                              <div>
                                <p className={`text-sm font-medium mb-1 ${
                                  darkMode ? 'text-gray-400' : 'text-slate-600'
                                }`}>Insurance Policy</p>
                                <p className={`text-base ${
                                  darkMode ? 'text-gray-100' : 'text-slate-800'
                                }`}>{viewingVehicle.insurance_policy}</p>
                              </div>
                            )}
                          </div>
                          {/* Total Spent on Linked Projects */}
                          {(() => {
                            const vehicleProjects = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                            const totalSpent = calculateVehicleTotalSpent(viewingVehicle.id, projects, parts);
                            const totalBudget = vehicleProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
                            const linkedPartsCount = vehicleProjects.reduce((count, project) => {
                              return count + parts.filter(part => part.projectId === project.id).length;
                            }, 0);
                            return (
                              <div className={`col-span-2 pt-4 mt-4 border-t ${
                                darkMode ? 'border-gray-600' : 'border-gray-300'
                              }`}>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className={`text-sm font-medium mb-2 ${
                                      darkMode ? 'text-gray-400' : 'text-slate-600'
                                    }`}>Total Spent</p>
                                    <p className={`text-2xl font-bold ${
                                      darkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>${totalSpent.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium mb-2 ${
                                      darkMode ? 'text-gray-400' : 'text-slate-600'
                                    }`}>Total Budget</p>
                                    <p className={`text-2xl font-bold ${
                                      darkMode ? 'text-gray-100' : 'text-slate-800'
                                    }`}>${Math.round(totalBudget)}</p>
                                  </div>
                                </div>
                                <div className={`flex items-center gap-4 mt-2 text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {vehicleProjects.length > 0 && (
                                    <>
                                      <span>{vehicleProjects.length} project{vehicleProjects.length !== 1 ? 's' : ''}</span>
                                      {linkedPartsCount > 0 && <span>•</span>}
                                    </>
                                  )}
                                  {linkedPartsCount > 0 && (
                                    <span>{linkedPartsCount} part{linkedPartsCount !== 1 ? 's' : ''}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {/* Vehicle Image - Half width on desktop - appears first on mobile */}
                      {viewingVehicle.image_url && (
                        <div className="order-first md:order-last rounded-lg overflow-hidden">
                          <img 
                            src={viewingVehicle.image_url} 
                            alt={viewingVehicle.nickname || viewingVehicle.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover min-h-[300px]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Maintenance Section (includes filters, oil, battery) */}
                    <div className={`pt-6 border-t ${
                      darkMode ? 'border-gray-700' : 'border-slate-200'
                    }`}>
                      <h3 className={`text-lg font-semibold mb-3 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Maintenance
                      </h3>
                      {(viewingVehicle.fuel_filter || viewingVehicle.air_filter || viewingVehicle.oil_filter || viewingVehicle.oil_type || viewingVehicle.oil_capacity || viewingVehicle.oil_brand || viewingVehicle.drain_plug || viewingVehicle.battery) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Mobile order: fuel filter, air filter, battery, oil filter, oil capacity, oil type, oil brand, drain plug */}
                          {viewingVehicle.fuel_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Fuel Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.fuel_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.air_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Air Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.air_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.battery && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Battery Type</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.battery}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Oil Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.oil_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_capacity && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Oil Capacity</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.oil_capacity}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_type && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Oil Type</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.oil_type}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_brand && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Oil Brand</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.oil_brand}</p>
                            </div>
                          )}
                          {viewingVehicle.drain_plug && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-slate-600'
                              }`}>Drain Plug</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>{viewingVehicle.drain_plug}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`text-center py-8 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <Gauge className={`w-12 h-12 mx-auto mb-3 ${
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                          <p className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            No maintenance information added yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Projects Section */}
                    {(() => {
                      const vehicleProjects = getVehicleProjects(viewingVehicle.id);
                      return (
                        <div className={`pt-6 border-t ${
                          darkMode ? 'border-gray-700' : 'border-slate-200'
                        }`}>
                          <h3 className={`text-lg font-semibold mb-3 ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Wrench className="w-5 h-5" />
                              <span>Projects ({vehicleProjects.length})</span>
                            </div>
                          </h3>
                          {vehicleProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {vehicleProjects.map((project) => {
                                const projectParts = parts.filter(p => p.projectId === project.id);
                                const projectTotal = projectParts.reduce((sum, part) => sum + part.total, 0);
                                const completedTodos = project.todos ? project.todos.filter(t => t.completed).length : 0;
                                const uncompletedTodos = project.todos ? project.todos.filter(t => !t.completed).length : 0;

                                return (
                                  <button
                                    key={project.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVehicleModalProjectView(project);
                                    }}
                                    className={`flex flex-col rounded-lg p-4 border-l-4 text-left transition-all hover:shadow-md cursor-pointer ${
                                      darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                    style={{ borderLeftColor: getPriorityBorderColor(project.priority) }}
                                  >
                                    <h4 className={`font-semibold mb-2 ${
                                      darkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                      {project.name}
                                    </h4>
                                    <p className={`text-sm mb-3 line-clamp-3 overflow-hidden ${
                                      project.description 
                                        ? (darkMode ? 'text-gray-400' : 'text-slate-600')
                                        : (darkMode ? 'text-gray-500 italic' : 'text-gray-500 italic')
                                    }`}
                                    style={{ height: '3.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                      {project.description || 'No description added'}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-xs mt-auto">
                                      <div className="flex items-center gap-1">
                                        <Package className={`w-3 h-3 ${
                                          darkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`} />
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                          {projectParts.length} parts
                                        </span>
                                      </div>
                                      <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                      <div className="flex items-center gap-1">
                                        <BadgeDollarSign className={`w-3 h-3 ${
                                          darkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`} />
                                        <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                          ${projectTotal.toFixed(2)}
                                        </span>
                                      </div>
                                      {project.todos && project.todos.length > 0 && (
                                        <>
                                          <span className={darkMode ? 'text-gray-600' : 'text-gray-400'}>•</span>
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                              <CheckCircle className={`w-3 h-3 ${
                                                darkMode ? 'text-green-400' : 'text-green-600'
                                              }`} />
                                              <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                                {completedTodos}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Clock className={`w-3 h-3 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-500'
                                              }`} />
                                              <span className={darkMode ? 'text-gray-400' : 'text-slate-600'}>
                                                {uncompletedTodos}
                                              </span>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className={`text-center py-8 rounded-lg border ${
                              darkMode ? 'bg-gray-700/30 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                            }`}>
                              <Wrench className="w-12 h-12 mx-auto mb-2 opacity-40" />
                              <p className="text-sm">
                                No projects linked
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                      </div>
                    </div>

                    {/* Project Details View - Slides in from right */}
                    {vehicleModalProjectView && !vehicleModalEditMode && (
                      <div 
                        className={`w-full transition-all duration-500 ease-in-out ${
                          vehicleModalProjectView && !vehicleModalEditMode
                            ? 'relative opacity-100' 
                            : 'absolute opacity-0 pointer-events-none'
                        }`}
                      >
                        <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                          <ProjectDetailView
                            project={vehicleModalProjectView}
                            parts={parts}
                            darkMode={darkMode}
                            updateProject={async (projectId, updates) => {
                              await updateProject(projectId, updates);
                              // Refresh the viewing project with the latest data
                              await loadProjects();
                              const updatedProject = projects.find(p => p.id === projectId);
                              if (updatedProject) {
                                setVehicleModalProjectView({ ...updatedProject, ...updates });
                              }
                            }}
                            getStatusColors={getStatusColors}
                            getPriorityColors={getPriorityColors}
                            getStatusText={getStatusText}
                            getStatusTextColor={getStatusTextColor}
                            getVendorColor={getVendorColor}
                            calculateProjectTotal={calculateProjectTotal}
                            editingTodoId={editingTodoId}
                            setEditingTodoId={setEditingTodoId}
                            editingTodoText={editingTodoText}
                            setEditingTodoText={setEditingTodoText}
                            newTodoText={newTodoText}
                            setNewTodoText={setNewTodoText}
                          />
                        </div>
                      </div>
                    )}

                    {/* Edit Project View - Slides in for editing */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        vehicleModalEditMode === 'project'
                          ? 'relative opacity-100' 
                          : 'absolute opacity-0 pointer-events-none'
                      }`}
                    >
                      {vehicleModalProjectView && (
                        <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                          <ProjectEditForm
                            project={vehicleModalProjectView}
                            onProjectChange={setVehicleModalProjectView}
                            vehicles={vehicles}
                            parts={parts}
                            unlinkPartFromProject={unlinkPartFromProject}
                            getVendorColor={getVendorColor}
                            darkMode={darkMode}
                          />

                          <LinkedPartsSection
                            projectId={vehicleModalProjectView.id}
                            parts={parts}
                            unlinkPartFromProject={unlinkPartFromProject}
                            getVendorColor={getVendorColor}
                            darkMode={darkMode}
                            setConfirmDialog={setConfirmDialog}
                          />
                        </div>
                      )}
                    </div>

                    {/* Edit Vehicle View - Slides in for editing */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        vehicleModalEditMode === 'vehicle'
                          ? 'relative opacity-100' 
                          : 'absolute opacity-0 pointer-events-none'
                      }`}
                    >
                      {viewingVehicle && (
                        <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
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
                                  value={viewingVehicle.nickname || ''}
                                  onChange={(e) => setViewingVehicle({ ...viewingVehicle, nickname: e.target.value })}
                                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    darkMode 
                                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                                  }`}
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
                                      value={viewingVehicle.color || '#3B82F6'}
                                      onChange={(e) => setViewingVehicle({ ...viewingVehicle, color: e.target.value })}
                                      className="h-10 w-20 rounded cursor-pointer border-2 border-gray-300"
                                    />
                                    <span className={`text-sm font-mono ${
                                      darkMode ? 'text-gray-400' : 'text-slate-600'
                                    }`}>{viewingVehicle.color || '#3B82F6'}</span>
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
                                    value={viewingVehicle.year || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, year: e.target.value })}
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
                                    value={viewingVehicle.make || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, make: e.target.value })}
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
                                    value={viewingVehicle.name}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, name: e.target.value })}
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
                                    value={viewingVehicle.license_plate || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, license_plate: e.target.value })}
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
                                    value={viewingVehicle.vin || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, vin: e.target.value })}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                      darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                        : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>
                              </div>

                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-slate-700'
                                }`}>
                                  Insurance Policy
                                </label>
                                <input
                                  type="text"
                                  value={viewingVehicle.insurance_policy || ''}
                                  onChange={(e) => setViewingVehicle({ ...viewingVehicle, insurance_policy: e.target.value })}
                                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    darkMode 
                                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                                  }`}
                                  placeholder=""
                                />
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
                                {/* Current Image or Preview */}
                                {(vehicleImagePreview || viewingVehicle.image_url) && (
                                  <div className="mb-3 relative">
                                    <img 
                                      src={vehicleImagePreview || viewingVehicle.image_url} 
                                      alt="Vehicle"
                                      className={`w-full h-full object-cover rounded-lg ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                      }`}
                                      style={{ minHeight: '400px' }}
                                    />
                                    <button
                                      onClick={() => {
                                        if (vehicleImagePreview) {
                                          clearImageSelection();
                                        } else {
                                          setViewingVehicle({ ...viewingVehicle, image_url: '' });
                                        }
                                      }}
                                      className="absolute top-2 right-2 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                {/* File Upload Button */}
                                {!vehicleImagePreview && !viewingVehicle.image_url && (
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
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-slate-700'
                                  }`}>
                                    Fuel Filter
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.fuel_filter || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, fuel_filter: e.target.value })}
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
                                    Air Filter
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.air_filter || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, air_filter: e.target.value })}
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
                                    Oil Filter
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.oil_filter || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_filter: e.target.value })}
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
                                    Oil Type
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.oil_type || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_type: e.target.value })}
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
                                    Oil Capacity
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.oil_capacity || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_capacity: e.target.value })}
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
                                    Oil Brand
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.oil_brand || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, oil_brand: e.target.value })}
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
                                    Drain Plug
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.drain_plug || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, drain_plug: e.target.value })}
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
                                    Battery Type
                                  </label>
                                  <input
                                    type="text"
                                    value={viewingVehicle.battery || ''}
                                    onChange={(e) => setViewingVehicle({ ...viewingVehicle, battery: e.target.value })}
                                    className={inputClasses(darkMode)}
                                    placeholder=""
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with Edit Button */}
                  <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-100'
                  }`}>
                    {(vehicleModalProjectView || vehicleModalEditMode) ? (
                      <button
                        onClick={() => {
                          if (vehicleModalEditMode) {
                            // Check for unsaved changes before going back
                            if (hasUnsavedVehicleChanges()) {
                              setConfirmDialog({
                                isOpen: true,
                                title: 'Unsaved Changes',
                                message: 'You have unsaved changes. Are you sure you want to go back without saving?',
                                confirmText: 'Discard',
                                cancelText: 'Keep Editing',
                                onConfirm: () => {
                                  // Restore original data
                                  if (originalVehicleData) {
                                    setViewingVehicle({ ...originalVehicleData });
                                  }
                                  clearImageSelection();
                                  setVehicleModalEditMode(null);
                                }
                              });
                              return;
                            }
                            setVehicleModalEditMode(null);
                          } else {
                            setVehicleModalProjectView(null);
                          }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600 hover:border-gray-500' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300 hover:border-gray-400'
                        }`}
                        title={vehicleModalEditMode ? 'Back' : 'Back to vehicle'}
                      >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                      </button>
                    ) : (
                      <div></div>
                    )}
                    {vehicleModalEditMode ? (
                      <div className="flex items-center gap-2">
                        {vehicleModalEditMode === 'vehicle' && (
                          <>
                            <button
                              onClick={async () => {
                                const projectsForVehicle = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                                const projectIds = projectsForVehicle.map(p => p.id);
                                const partsForVehicle = parts.filter(part => projectIds.includes(part.projectId));
                                const hasProjects = projectsForVehicle.length > 0;
                                const hasParts = partsForVehicle.length > 0;
                                let message = 'Are you sure you want to permanently delete this vehicle? This action cannot be undone.';
                                if (hasProjects || hasParts) {
                                  const items = [];
                                  if (hasProjects) items.push(`${projectsForVehicle.length} project(s)`);
                                  if (hasParts) items.push(`${partsForVehicle.length} part(s)`);
                                  message = `This vehicle has ${items.join(' and ')} linked to it. Deleting it will unlink these items. This action cannot be undone.`;
                                }
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Vehicle',
                                  message: message,
                                  confirmText: 'Delete',
                                  onConfirm: async () => {
                                    await deleteVehicle(viewingVehicle.id);
                                    setShowVehicleDetailModal(false);
                                    setViewingVehicle(null);
                                    setOriginalVehicleData(null);
                                    setVehicleModalEditMode(null);
                                  }
                                });
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm mr-4 ${
                                darkMode
                                  ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                            <button
                              onClick={async () => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: viewingVehicle.archived ? 'Unarchive Vehicle' : 'Archive Vehicle',
                                  message: viewingVehicle.archived 
                                    ? 'Are you sure you want to unarchive this vehicle?' 
                                    : 'Are you sure you want to archive this vehicle? It will still be visible but with limited information.',
                                  confirmText: viewingVehicle.archived ? 'Unarchive' : 'Archive',
                                  isDangerous: false,
                                  onConfirm: async () => {
                                    // When archiving, set display_order to a high number to move to end
                                    // When unarchiving, keep current display_order
                                    const updates = { 
                                      archived: !viewingVehicle.archived 
                                    };
                                    if (!viewingVehicle.archived) {
                                      // Archiving: set display_order to max + 1
                                      const maxOrder = Math.max(...vehicles.map(v => v.display_order || 0), 0);
                                      updates.display_order = maxOrder + 1;
                                    }
                                    const updatedVehicle = { 
                                      ...viewingVehicle, 
                                      ...updates
                                    };
                                    await updateVehicle(viewingVehicle.id, updates);
                                    setViewingVehicle(updatedVehicle);
                                    setOriginalVehicleData({ ...updatedVehicle });
                                  }
                                });
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                                viewingVehicle.archived
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                              }`}
                            >
                              {viewingVehicle.archived ? 'Unarchive' : 'Archive'}
                            </button>
                          </>
                        )}
                        {vehicleModalEditMode === 'project' && (
                          <button
                            onClick={async () => {
                              // Toggle on_hold status
                              const newStatus = vehicleModalProjectView.status === 'on_hold' ? 'in_progress' : 'on_hold';
                              const updatedProject = { ...vehicleModalProjectView, status: newStatus };
                              await updateProject(vehicleModalProjectView.id, {
                                status: newStatus
                              });
                              setVehicleModalProjectView(updatedProject);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                              vehicleModalProjectView.status === 'on_hold'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : darkMode
                                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
                            }`}
                          >
                            {vehicleModalProjectView.status === 'on_hold' ? 'Resume' : 'Pause'}
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            // Save logic based on what's being edited
                            if (vehicleModalEditMode === 'vehicle') {
                              // Upload new image if one is selected
                              let updatedVehicle = { ...viewingVehicle };
                              if (vehicleImageFile) {
                                const imageUrl = await uploadVehicleImage(vehicleImageFile);
                                if (imageUrl) {
                                  updatedVehicle.image_url = imageUrl;
                                }
                              }
                              await updateVehicle(viewingVehicle.id, updatedVehicle);
                              clearImageSelection();
                              // Update viewing data with saved changes
                              setViewingVehicle(updatedVehicle);
                              setOriginalVehicleData({ ...updatedVehicle });
                            } else if (vehicleModalEditMode === 'project') {
                              await updateProject(vehicleModalProjectView.id, {
                                name: vehicleModalProjectView.name,
                                description: vehicleModalProjectView.description,
                                budget: parseFloat(vehicleModalProjectView.budget),
                                priority: vehicleModalProjectView.priority,
                                vehicle_id: vehicleModalProjectView.vehicle_id || null,
                                todos: vehicleModalProjectView.todos || []
                              });
                            }
                            setVehicleModalEditMode(null);
                          }}
                          disabled={uploadingImage}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                            uploadingImage
                              ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {uploadingImage ? (
                            'Saving...'
                          ) : (
                            <>
                              <span className="sm:hidden">Save</span>
                              <span className="hidden sm:inline">Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : !vehicleModalProjectView ? (
                      <button
                        onClick={() => {
                          setVehicleModalEditMode('vehicle');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Vehicle
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setVehicleModalEditMode('project');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Project
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
          </div>
        )}

        </>
        )}
      </div>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDangerous={confirmDialog.isDangerous !== false}
        darkMode={darkMode}
      />
    </div>
  );
};

export default TakumiGarage;
