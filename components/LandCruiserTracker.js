import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Package, DollarSign, TrendingUp, Truck, CheckCircle, Clock, XCircle, ChevronDown, Plus, X, ExternalLink, ChevronUp, Edit2, Trash2, Moon, Sun, Wrench, List, Target, Calendar, GripVertical, ShoppingCart, Car, Upload, Image as ImageIcon } from 'lucide-react';
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
  low: darkMode ? 'text-green-400' : 'text-green-600',
  medium: darkMode ? 'text-yellow-400' : 'text-yellow-600',
  high: darkMode ? 'text-red-400' : 'text-red-600'
});

// Priority border colors
const getPriorityBorderColor = (priority) => {
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colors[priority] || '#6b7280';
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

// Dark mode class helper
const dmClass = (darkMode, darkClass, lightClass) => {
  return darkMode ? darkClass : lightClass;
};

// Common input field classes
const inputClasses = (darkMode, additionalClasses = '') => {
  const base = `w-full md:max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${additionalClasses}`;
  const theme = darkMode 
    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  return `${base} ${theme}`;
};

// Common select field classes
const selectClasses = (darkMode, additionalClasses = '') => {
  const base = `w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${additionalClasses}`;
  const theme = darkMode 
    ? 'bg-gray-700 border-gray-600 text-gray-100' 
    : 'bg-white border-gray-300 text-gray-900';
  return `${base} ${theme}`;
};

// Common button classes
const buttonClasses = (darkMode, variant = 'primary') => {
  if (variant === 'primary') {
    return 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors';
  }
  if (variant === 'secondary') {
    return darkMode 
      ? 'px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg font-medium transition-colors'
      : 'px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors';
  }
  return '';
};

// ========================================
// REUSABLE COMPONENTS
// ========================================

// ProjectDetailView - Reusable component for displaying project details with todos and linked parts
const ProjectDetailView = ({ 
  project, 
  parts, 
  darkMode, 
  updateProject,
  getStatusColors,
  getPriorityColors,
  getStatusText,
  getVendorColor,
  calculateProjectTotal,
  editingTodoId,
  setEditingTodoId,
  editingTodoText,
  setEditingTodoText,
  newTodoText,
  setNewTodoText
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

  // Reset on project change
  React.useEffect(() => {
    hasInitialized.current = false;
    prevPositions.current = {};
  }, [project.id]);

  // Sort todos: completed first (by completion time), then uncompleted (by creation time)
  const sortedTodos = React.useMemo(() => {
    if (!project.todos) return [];
    return [...project.todos].sort((a, b) => {
      // If both have same completion status
      if (a.completed === b.completed) {
        if (a.completed) {
          // Both completed: sort by completed_at (oldest completed first, newest at bottom)
          const aCompletedAt = a.completed_at ? new Date(a.completed_at) : new Date(a.created_at);
          const bCompletedAt = b.completed_at ? new Date(b.completed_at) : new Date(b.created_at);
          return aCompletedAt - bCompletedAt;
        } else {
          // Both uncompleted: sort by created_at (most recently created first)
          return new Date(b.created_at) - new Date(a.created_at);
        }
      }
      // Different completion status: completed items first
      return b.completed - a.completed;
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
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
          statusColors[project.status]
        }`}>
          {project.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-2 ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>Description</h3>
          <p className={`text-base ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {project.description}
          </p>
        </div>
      )}

      {/* Budget Progress */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${
          darkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>Budget Used</h3>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            ${linkedPartsTotal.toFixed(2)} / ${project.budget?.toFixed(2) || '0.00'}
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
      <div className={`grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg ${
        darkMode ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <div>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Priority</p>
          <p className={`text-lg font-bold ${priorityColors[project.priority]}`}>
            {project.priority?.toUpperCase()}
          </p>
        </div>
        <div>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Parts Linked</p>
          <p className={`text-lg font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {linkedParts.length}
          </p>
        </div>
        <div>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Start Date</p>
          <p className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString() : 'TBD'}
          </p>
        </div>
        <div>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Target Date</p>
          <p className={`text-sm font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {project.target_date ? new Date(project.target_date + 'T00:00:00').toLocaleDateString() : 'Not set'}
          </p>
        </div>
      </div>

      {/* To-Do List Section */}
      <div className={`pt-6 border-t ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
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
          {sortedTodos.map((todo) => (
            <div 
              key={todo.id}
              ref={(el) => todoRefs.current[todo.id] = el}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
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
                        completed_at: newCompleted ? new Date().toISOString() : null
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
                <input
                  type="text"
                  value={editingTodoText}
                  onChange={(e) => setEditingTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
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
                  autoFocus
                  className={`flex-1 text-sm px-2 py-1 rounded border-2 focus:outline-none ${
                    darkMode
                      ? 'bg-gray-600 border-blue-500 text-gray-100'
                      : 'bg-white border-blue-500 text-gray-800'
                  }`}
                />
              ) : (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTodoId(todo.id);
                    setEditingTodoText(todo.text);
                  }}
                  className={`flex-1 text-sm cursor-pointer hover:opacity-70 transition-opacity ${
                    todo.completed
                      ? darkMode
                        ? 'text-gray-500 line-through'
                        : 'text-gray-400 line-through'
                      : darkMode
                        ? 'text-gray-200'
                        : 'text-gray-800'
                  }`}
                  title="Click to edit"
                >
                  {todo.text}
                </span>
              )}
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this to-do item?')) {
                    const updatedTodos = project.todos.filter(t => t.id !== todo.id);
                    updateProject(project.id, {
                      todos: updatedTodos
                    });
                  }
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
            className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-colors ${
              darkMode 
                ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500 focus-within:border-blue-500 focus-within:bg-gray-700' 
                : 'bg-gray-50/50 border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:bg-white'
            }`}
          >
            {/* Empty checkbox placeholder */}
            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 ${
              darkMode ? 'border-gray-600' : 'border-gray-300'
            }`} />
            
            {/* Input field */}
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newTodoText.trim()) {
                    const currentTodos = project.todos || [];
                    const newTodo = {
                      id: Date.now(),
                      text: newTodoText.trim(),
                      completed: false,
                      created_at: new Date().toISOString()
                    };
                    updateProject(project.id, {
                      todos: [...currentTodos, newTodo]
                    });
                    setNewTodoText('');
                  }
                }
              }}
              placeholder="Add a to-do item..."
              className={`flex-1 text-sm px-2 py-1 bg-transparent border-0 focus:outline-none ${
                darkMode
                  ? 'text-gray-100 placeholder-gray-500'
                  : 'text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Linked Parts List */}
      {linkedParts.length > 0 && (
        <div className={`pt-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
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
                className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {part.part}
                    </h4>
                    {part.vendor && (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                        {part.vendor}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {getStatusText(part)}
                  </div>
                </div>
                
                {part.partNumber && part.partNumber !== '-' && (
                  <p className={`text-xs font-mono mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Part #: {part.partNumber}
                  </p>
                )}
                
                <div className={`pt-3 border-t space-y-2 ${
                  darkMode ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
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
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
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
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
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
                    <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
                      Total:
                    </span>
                    <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
                      ${part.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedParts.length === 0 && (
        <div className={`text-center py-8 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <Package className={`w-12 h-12 mx-auto mb-3 ${
            darkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            No parts linked to this project yet
          </p>
        </div>
      )}
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

  /* Scrollbar styles for light mode */
  :root {
    scrollbar-color: #cbd5e1 #f1f5f9;
  }

  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Scrollbar styles for dark mode */
  .dark-scrollbar {
    scrollbar-color: #4b5563 #1f2937;
  }

  .dark-scrollbar ::-webkit-scrollbar-track {
    background: #1f2937;
  }

  .dark-scrollbar ::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-color: #1f2937;
  }

  .dark-scrollbar ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
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
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>

      <div></div>

      <div className="md:col-span-2">
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Description
        </label>
        <textarea
          value={project.description}
          onChange={(e) => onProjectChange({ ...project, description: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          rows="3"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
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
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Priority
        </label>
        <select
          value={project.priority}
          onChange={(e) => onProjectChange({ ...project, priority: e.target.value })}
          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Status
        </label>
        <select
          value={project.status}
          onChange={(e) => onProjectChange({ ...project, status: e.target.value })}
          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span>Linked Vehicle</span>
          </div>
        </label>
        <select
          value={project.vehicle_id || ''}
          onChange={(e) => onProjectChange({ ...project, vehicle_id: e.target.value ? parseInt(e.target.value) : null })}
          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">No vehicle</option>
          {vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.nickname || vehicle.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Start Date
        </label>
        <input
          type="date"
          value={project.start_date ? project.start_date.split('T')[0] : ''}
          onChange={(e) => onProjectChange({ ...project, start_date: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Target Date
        </label>
        <input
          type="date"
          value={project.target_date ? project.target_date.split('T')[0] : ''}
          onChange={(e) => onProjectChange({ ...project, target_date: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
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
  darkMode
}) => {
  const linkedParts = parts.filter(part => part.projectId === projectId);
  
  if (linkedParts.length === 0) {
    return null;
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
        {linkedParts.map((part) => (
          <div 
            key={part.id}
            className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium truncate ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
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
                if (window.confirm(`Are you sure you want to unlink "${part.part}" from this project?`)) {
                  unlinkPartFromProject(part.id);
                }
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
    </div>
  );
};

const LandCruiserTracker = () => {
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

  // Track if we're transitioning between modals to prevent scroll jumping
  const isTransitioningModals = useRef(false);
  const savedScrollPosition = useRef(0);

  // Refs for tab underline animation
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  // Vehicle modal states
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [vehicleModalProjectView, setVehicleModalProjectView] = useState(null); // Track if viewing project within vehicle modal
  const [vehicleModalEditMode, setVehicleModalEditMode] = useState(null); // 'vehicle' or 'project' - track if editing within modal
  const [newVehicle, setNewVehicle] = useState({
    nickname: '',
    name: '',
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
        // For parts tab (rightmost): add right padding to prevent overflow on mobile
        let leftOffset = offsetLeft;
        let width = offsetWidth;
        
        if (activeTab === 'parts') {
          const rightPadding = 12;
          width = offsetWidth - rightPadding;
        }
        
        setUnderlineStyle({
          left: leftOffset,
          width: width
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateUnderline, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);

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
      } else {
        // If no data, initialize with default data
        await initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading parts:', error);
      alert('Error loading parts from database');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultData = async () => {
    const defaultParts = [
      { id: 1, delivered: true, shipped: true, purchased: true, part: "Cup Holder", partNumber: "-", vendor: "Etsy", price: 52.00, shipping: 0, duties: 0, total: 52.00, tracking: "9434609206094903332736" },
      { id: 2, delivered: false, shipped: true, purchased: true, part: "Sony Stereo", partNumber: "XAV-AX6000", vendor: "Best Buy", price: 436.99, shipping: 0, duties: 0, total: 436.99, tracking: "480723763892" },
      { id: 3, delivered: true, shipped: true, purchased: true, part: "FR Fender Rubber", partNumber: "53878-90K00", vendor: "Partsnext", price: 17.54, shipping: 3.29, duties: 132.65, total: 20.83, tracking: "1Z48537W0440715302" },
      { id: 4, delivered: true, shipped: true, purchased: true, part: "FL Fender Rubber", partNumber: "53879-90K00", vendor: "Partsnext", price: 17.54, shipping: 0, duties: 0, total: 17.54, tracking: "1Z48537W0440715302" },
      { id: 5, delivered: true, shipped: true, purchased: true, part: "RR Fender Rubber", partNumber: "61783-90K00", vendor: "Partsnext", price: 10.68, shipping: 3.29, duties: 0, total: 13.97, tracking: "1Z48537W0440715302" },
      { id: 6, delivered: true, shipped: true, purchased: true, part: "RL Fender Rubber", partNumber: "61784-90K00", vendor: "Partsnext", price: 10.68, shipping: 0, duties: 0, total: 10.68, tracking: "1Z48537W0440715302" },
      { id: 7, delivered: true, shipped: true, purchased: true, part: "Front Grille", partNumber: "53101-60050", vendor: "Partsnext", price: 126.20, shipping: 106.03, duties: 0, total: 232.23, tracking: "1Z48537W0440715302" },
      { id: 8, delivered: true, shipped: true, purchased: true, part: "Gear Shift Knob", partNumber: "33504-24010-C1", vendor: "Partsnext", price: 31.95, shipping: 0, duties: 0, total: 31.95, tracking: "1Z48537W0440715302" },
      { id: 9, delivered: true, shipped: true, purchased: true, part: "Accelerator Pad", partNumber: "78111-95110", vendor: "Partsnext", price: 7.02, shipping: 0, duties: 0, total: 7.02, tracking: "1Z48537W0440715302" },
      { id: 10, delivered: true, shipped: true, purchased: true, part: "Clutch & Brake Pad", partNumber: "31321-14020", vendor: "Partsnext", price: 4.36, shipping: 3.29, duties: 0, total: 7.65, tracking: "1Z48537W0440715302" },
      { id: 11, delivered: false, shipped: false, purchased: true, part: "Steering Wheel (Older)", partNumber: "-", vendor: "eBay", price: 210.00, shipping: 90.00, duties: 0, total: 300.00, tracking: "" },
      { id: 12, delivered: true, shipped: true, purchased: true, part: "Steering Wheel (Original)", partNumber: "-", vendor: "eBay", price: 226.00, shipping: 65.00, duties: 0, total: 291.00, tracking: "885304602390" },
      { id: 13, delivered: true, shipped: true, purchased: true, part: "Transfer Case Knob", partNumber: "36303-60211-C0", vendor: "eBay", price: 21.60, shipping: 18.35, duties: 0, total: 39.95, tracking: "885344165215" },
      { id: 14, delivered: true, shipped: true, purchased: true, part: "Winch Cover", partNumber: "38286-60111", vendor: "eBay", price: 211.10, shipping: 0, duties: 0, total: 211.10, tracking: "885474166695" },
      { id: 15, delivered: true, shipped: true, purchased: true, part: "Fog Light Switch", partNumber: "84160-90K01", vendor: "eBay", price: 42.99, shipping: 0, duties: 0, total: 42.99, tracking: "9400108106245393635087" },
      { id: 16, delivered: true, shipped: true, purchased: true, part: "Diesel Badge", partNumber: "75315-90A02", vendor: "eBay", price: 33.90, shipping: 0, duties: 0, total: 33.90, tracking: "9400150206242016493978" },
      { id: 17, delivered: true, shipped: true, purchased: true, part: "Hitch", partNumber: "-", vendor: "eBay", price: 55.87, shipping: 0, duties: 0, total: 55.87, tracking: "885492205088" },
      { id: 18, delivered: true, shipped: true, purchased: true, part: "4 Pin Trailer Connector", partNumber: "-", vendor: "eBay", price: 29.99, shipping: 8.35, duties: 0, total: 38.34, tracking: "9400108106245426390983" },
      { id: 19, delivered: true, shipped: true, purchased: true, part: "Rear Bumper Step (Split)", partNumber: "51987-60021", vendor: "eBay", price: 85.00, shipping: 18.00, duties: 0, total: 103.00, tracking: "2450562144" },
      { id: 20, delivered: true, shipped: true, purchased: true, part: "Key", partNumber: "90999-00212", vendor: "eBay", price: 16.99, shipping: 0, duties: 0, total: 16.99, tracking: "9234690403371000425709" },
      { id: 21, delivered: false, shipped: true, purchased: true, part: "FR/FL Fender Rubber", partNumber: "53851-90K00-01", vendor: "eBay", price: 65.24, shipping: 22.00, duties: 0, total: 87.24, tracking: "ECSDT00000000052" },
      { id: 22, delivered: false, shipped: false, purchased: true, part: "Rear Door Latch", partNumber: "69206-10050-B0", vendor: "eBay", price: 10.21, shipping: 19.53, duties: 0, total: 29.74, tracking: "" },
      { id: 23, delivered: false, shipped: true, purchased: true, part: "Rear Door Card (LH)", partNumber: "64790-60020-S7", vendor: "eBay", price: 88.85, shipping: 51.81, duties: 0, total: 140.66, tracking: "https://www.fedex.com/fedextrack/?trknbr=885730110967&trkqual=2460984000~885730110967~FX" },
      { id: 24, delivered: false, shipped: true, purchased: true, part: "Rear Door Card (RH)", partNumber: "64780-60050-S7", vendor: "eBay", price: 62.62, shipping: 43.43, duties: 0, total: 106.05, tracking: "https://www.fedex.com/fedextrack/?trknbr=885730110967&trkqual=2460984000~885730110967~FX" },
      { id: 25, delivered: true, shipped: true, purchased: true, part: "RH Belt Cover", partNumber: "71811-60020-B0", vendor: "Toyota", price: 29.01, shipping: 0, duties: 0, total: 29.01, tracking: "Local" },
      { id: 26, delivered: true, shipped: true, purchased: true, part: "LH Belt Cover", partNumber: "71812-60040-B0", vendor: "Toyota", price: 36.38, shipping: 0, duties: 0, total: 36.38, tracking: "Local" },
      { id: 27, delivered: true, shipped: true, purchased: true, part: "Fuel Filter", partNumber: "23303-64010", vendor: "Toyota", price: 15.93, shipping: 0, duties: 0, total: 15.93, tracking: "Local" },
      { id: 28, delivered: true, shipped: true, purchased: true, part: "Oil Filter x 2", partNumber: "90915-30002", vendor: "Toyota", price: 36.77, shipping: 0, duties: 0, total: 36.77, tracking: "Local" },
      { id: 29, delivered: true, shipped: true, purchased: true, part: "Air Filter", partNumber: "17801-68020", vendor: "Toyota", price: 21.24, shipping: 0, duties: 0, total: 21.24, tracking: "Local" },
      { id: 30, delivered: true, shipped: true, purchased: true, part: "LH Inner Belt Assembly", partNumber: "73230-60181-B0", vendor: "Jauce", price: 56.03, shipping: 158.00, duties: 24.27, total: 423.55, tracking: "4730109366" },
      { id: 31, delivered: true, shipped: true, purchased: true, part: "RH Inner Belt Assembly", partNumber: "73230-60151-B0", vendor: "Jauce", price: 56.03, shipping: 0, duties: 0, total: 56.03, tracking: "4730109366" },
      { id: 32, delivered: true, shipped: true, purchased: true, part: "Dash Pad", partNumber: "55401-90K00-B0", vendor: "Jauce", price: 129.22, shipping: 0, duties: 0, total: 129.22, tracking: "4730109366" },
      { id: 33, delivered: true, shipped: true, purchased: true, part: "Front Speakers", partNumber: "DB402", vendor: "Amazon", price: 49.98, shipping: 0, duties: 0, total: 49.98, tracking: "" },
      { id: 34, delivered: true, shipped: true, purchased: true, part: "Rear Speakers", partNumber: "DB652", vendor: "Amazon", price: 69.35, shipping: 0, duties: 0, total: 69.35, tracking: "" },
      { id: 35, delivered: true, shipped: true, purchased: true, part: "Radio Wiring Harness", partNumber: "70-1761", vendor: "Amazon", price: 5.00, shipping: 0, duties: 0, total: 5.00, tracking: "" },
      { id: 36, delivered: false, shipped: true, purchased: true, part: "Oil Plug Gaskets", partNumber: "90430-12031", vendor: "Amazon", price: 14.74, shipping: 0, duties: 0, total: 14.74, tracking: "https://www.amazon.com/gp/your-account/ship-track?itemId=jkohkoonpjkqpsp&ref=ppx_yo2ov_dt_b_track_package&orderId=112-1718718-3841801" },
      { id: 37, delivered: true, shipped: true, purchased: true, part: "5 to 4 Wire Converter", partNumber: "-", vendor: "Amazon", price: 19.99, shipping: 0, duties: 0, total: 19.99, tracking: "https://www.amazon.com/gp/your-account/ship-track?itemId=jkogrpkqljlrqmp&ref=ppx_yo2ov_dt_b_track_package&packageIndex=0&orderId=112-0626844-5673038&shipmentId=PhG9YC6jb" },
      { id: 38, delivered: false, shipped: false, purchased: false, part: "Subwoofer", partNumber: "", vendor: "", price: 0, shipping: 0, duties: 0, total: 0, tracking: "" },
    ];

    try {
      // Insert all default parts
      for (const part of defaultParts) {
        await supabase.from('parts').insert({
          id: part.id,
          delivered: part.delivered,
          shipped: part.shipped,
          purchased: part.purchased,
          part: part.part,
          part_number: part.partNumber,
          vendor: part.vendor,
          price: part.price,
          shipping: part.shipping,
          duties: part.duties,
          total: part.total,
          tracking: part.tracking
        });
      }
      
      // Reload parts after initialization
      await loadParts();
    } catch (error) {
      console.error('Error initializing data:', error);
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
      } else {
        // Initialize with default projects
        await initializeDefaultProjects();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const initializeDefaultProjects = async () => {
    const defaultProjects = [
      { 
        name: "Interior Restoration", 
        description: "Complete interior refurbishment including seats, dashboard, and trim",
        status: "in_progress",
        budget: 2000,
        spent: 850,
        start_date: "2024-01-15",
        target_date: "2025-03-01",
        priority: "high"
      },
      { 
        name: "Engine Maintenance", 
        description: "Regular maintenance and upgrades to engine components",
        status: "in_progress",
        budget: 1500,
        spent: 600,
        start_date: "2024-02-01",
        target_date: "2025-06-01",
        priority: "medium"
      },
      { 
        name: "Exterior Body Work", 
        description: "Rust repair, paint, and body panel replacement",
        status: "planning",
        budget: 3500,
        spent: 0,
        start_date: null,
        target_date: "2025-12-01",
        priority: "low"
      }
    ];

    try {
      for (const project of defaultProjects) {
        await supabase.from('projects').insert(project);
      }
      await loadProjects();
    } catch (error) {
      console.error('Error initializing projects:', error);
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
          start_date: projectData.start_date && projectData.start_date.trim() !== '' ? projectData.start_date : null,
          target_date: projectData.target_date && projectData.target_date.trim() !== '' ? projectData.target_date : null,
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

  const updateProject = async (projectId, updates) => {
    try {
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
    if (!confirm('Are you sure you want to delete this project?')) return;
    
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
        setVehicles(data);
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
    
    if (projectsForVehicle.length > 0) {
      if (!confirm(`This vehicle has ${projectsForVehicle.length} project(s) linked to it. Deleting it will unlink these projects. Continue?`)) {
        return;
      }
    } else if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    
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
    if (draggedVehicle && draggedVehicle.id !== vehicle.id) {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showPartDetailModal, setShowPartDetailModal] = useState(false);
  const [viewingPart, setViewingPart] = useState(null);
  const [trackingModalPartId, setTrackingModalPartId] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  
  // Project-related state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showProjectDetailModal, setShowProjectDetailModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [projectModalEditMode, setProjectModalEditMode] = useState(false); // Track if editing within project detail modal
  const [editingTodoId, setEditingTodoId] = useState(null); // Track which todo is being edited
  const [editingTodoText, setEditingTodoText] = useState(''); // Temp text while editing
  const [newTodoText, setNewTodoText] = useState(''); // Text for new todo input
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: '',
    target_date: '',
    priority: 'medium',
    status: 'planning',
    vehicle_id: null
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    // Only access localStorage in the browser
    if (typeof window === 'undefined') return false;
    
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Save dark mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
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
    const isAnyModalOpen = showAddModal || showEditModal || showTrackingModal || 
                          showAddProjectModal || showProjectDetailModal ||
                          showAddVehicleModal || showVehicleDetailModal ||
                          showPartDetailModal;
    
    if (isAnyModalOpen) {
      // Store current scroll position when opening a modal
      if (savedScrollPosition.current === 0) {
        savedScrollPosition.current = window.scrollY;
      }
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollPosition.current}px`;
      document.body.style.width = '100%';
    } else {
      // Remove fixed positioning but maintain scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
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
    };
  }, [showAddModal, showEditModal, showTrackingModal, showAddProjectModal, 
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

  const openEditModal = (part) => {
    setEditingPart({
      ...part,
      status: part.delivered ? 'delivered' : (part.shipped ? 'shipped' : (part.purchased ? 'purchased' : 'pending'))
    });
    setShowEditModal(true);
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
      
      setShowEditModal(false);
      setEditingPart(null);
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Error saving part. Please try again.');
    }
  };

  const deletePart = async (partId) => {
    if (window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
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
    if (sortBy === field) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const filteredParts = useMemo(() => {
    return parts
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
        
        return matchesSearch && matchesStatus && matchesVendor;
      })
      .sort((a, b) => {
        let aVal, bVal;
        
        // Special handling for status sorting
        if (sortBy === 'status') {
          // Assign numeric values: pending=0, purchased=1, shipped=2, delivered=3
          aVal = a.delivered ? 3 : (a.shipped ? 2 : (a.purchased ? 1 : 0));
          bVal = b.delivered ? 3 : (b.shipped ? 2 : (b.purchased ? 1 : 0));
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
  }, [parts, searchTerm, statusFilter, vendorFilter, sortBy, sortOrder]);

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

  const VendorSelect = ({ value, onChange, darkMode }) => {
    return (
      <div className="space-y-2">
        <select
          value={uniqueVendors.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
        >
          <option value="">Select a vendor...</option>
          {uniqueVendors.map(vendor => (
            <option key={vendor} value={vendor}>{vendor}</option>
          ))}
        </select>
        
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Or enter a new vendor:
        </div>
        
        <input
          type="text"
          value={!uniqueVendors.includes(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
          placeholder="Enter new vendor name"
        />
      </div>
    );
  };

  const StatusDropdown = ({ part }) => {
    const isOpen = openDropdown === part.id;
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState('bottom');
    const [isPositioned, setIsPositioned] = useState(false);
    
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        // Calculate position immediately when opening
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 180; // Height of 4-item dropdown
        const viewportHeight = window.innerHeight;
        const tableFooterHeight = 70; // Account for "Showing X of Y parts" footer
        const spaceBelow = viewportHeight - rect.bottom - tableFooterHeight; // Include footer in calculation
        const spaceAbove = rect.top - 10; // 10px margin
        
        // Prefer bottom, but switch to top if not enough space below AND enough space above
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
        
        // Mark as positioned to show the dropdown
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
              className={`absolute left-0 ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} rounded-lg shadow-lg border py-1 z-20 min-w-[140px] ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}
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
    const [isPositioned, setIsPositioned] = useState(false);
    
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        // Calculate position immediately when opening
        const rect = buttonRef.current.getBoundingClientRect();
        // Calculate dropdown height based on number of projects
        const itemHeight = 40;
        const maxVisibleItems = 6; // max-h-60 = 240px / 40px per item
        const actualItems = Math.min(projects.length + 1, maxVisibleItems); // +1 for "None" option
        const dropdownHeight = actualItems * itemHeight;
        
        const viewportHeight = window.innerHeight;
        const tableFooterHeight = 70; // Account for "Showing X of Y parts" footer
        const spaceBelow = viewportHeight - rect.bottom - tableFooterHeight; // Include footer in calculation
        const spaceAbove = rect.top - 10; // 10px margin
        
        // Prefer bottom, but switch to top if not enough space below AND enough space above
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
        
        // Mark as positioned to show the dropdown
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
              ? (darkMode ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-800 border-blue-200')
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
              className={`absolute left-0 ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} rounded-lg shadow-lg border py-1 z-20 min-w-[180px] max-h-60 overflow-y-auto ${
                darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}
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
              {projects.map(project => (
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
                    darkMode ? 'bg-blue-500' : 'bg-blue-600'
                  }`} />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-3 sm:p-6 transition-colors duration-200 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark-scrollbar' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <style>{fontStyles}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Takumi Garage" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-slate-800'
              }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>TAKUMI GARAGE</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 sm:p-3 rounded-lg shadow-md transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
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
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex relative">
            <button
              ref={(el) => (tabRefs.current['vehicles'] = el)}
              onClick={() => handleTabChange('vehicles')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                activeTab === 'vehicles'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Car className="w-5 h-5" />
              <span>Vehicles</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['projects'] = el)}
              onClick={() => handleTabChange('projects')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                activeTab === 'projects'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span>Projects</span>
            </button>
            <button
              ref={(el) => (tabRefs.current['parts'] = el)}
              onClick={() => handleTabChange('parts')}
              className={`flex items-center gap-2 pl-5 pr-7 py-3 font-medium transition-all relative ${
                activeTab === 'parts'
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Parts</span>
            </button>
            {/* Animated underline */}
            <div
              className={`absolute bottom-0 h-0.5 transition-all duration-300 ease-out ${
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
              } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., Front Bumper"
                      required
                    />
                  </div>
                  
                  <div></div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 12345-67890"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., FedEx, USPS"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Status
                    </label>
                    <select
                      value={newPart.status}
                      onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="purchased">Ordered</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Vendor
                    </label>
                    <VendorSelect 
                      value={newPart.vendor}
                      onChange={(value) => setNewPart({ ...newPart, vendor: value })}
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    </label>
                    <select
                      value={newPart.projectId || ''}
                      onChange={(e) => setNewPart({ ...newPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
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
                          darkMode ? 'text-gray-300' : 'text-gray-700'
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
                darkMode ? 'border-gray-700' : 'border-gray-200'
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
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`border-b px-6 py-4 flex items-center justify-between rounded-t-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Enter the tracking number for this shipment (optional)
                </p>
                
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
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
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="e.g., 1Z999AA10123456784"
                  autoFocus
                />
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveTrackingInfo}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Save
                  </button>
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Part Modal */}
        {showEditModal && editingPart && (
          <div 
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop ${
              isModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
            }`}
            onClick={() => handleCloseModal(() => {
              setShowEditModal(false);
              setEditingPart(null);
            })}
          >
            <div 
              className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
                isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
              } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 border-b px-6 py-4 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`} style={{ zIndex: 10 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>Edit Part</h2>
                    {(() => {
                      const partProject = editingPart.projectId ? projects.find(p => p.id === editingPart.projectId) : null;
                      const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                      return vehicle && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <Car className="w-3 h-3 mr-1" style={{ color: vehicle.color || '#3B82F6' }} />
                          {vehicle.nickname || vehicle.name}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => handleCloseModal(() => {
                      setShowEditModal(false);
                      setEditingPart(null);
                    })}
                    className={`transition-colors ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 modal-scrollable">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-1">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., Front Bumper"
                      required
                    />
                  </div>
                  
                  <div></div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 12345-67890"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g., 1Z999AA10123456784"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Status
                    </label>
                    <select
                      value={editingPart.status}
                      onChange={(e) => setEditingPart({ ...editingPart, status: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] box-border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      style={{ width: '100%', WebkitAppearance: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="purchased">Ordered</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Vendor
                    </label>
                    <VendorSelect 
                      value={editingPart.vendor}
                      onChange={(value) => setEditingPart({ ...editingPart, vendor: value })}
                      darkMode={darkMode}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Project <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(optional)</span>
                    </label>
                    <select
                      value={editingPart.projectId || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, projectId: e.target.value ? parseInt(e.target.value) : null })}
                      className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={`md:col-span-2 border rounded-lg p-4 ${
                    darkMode 
                      ? 'bg-gray-700/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
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
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
              
              <div className={`border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}></div>
              
              <div className="p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      deletePart(editingPart.id);
                      setShowEditModal(false);
                      setEditingPart(null);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      darkMode 
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPart(null);
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
                    onClick={saveEditedPart}
                    disabled={!editingPart.part}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      !editingPart.part
                        ? darkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    Save Changes
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
            })}
          >
            <div 
              className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
                isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
              } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`sticky top-0 border-b px-6 py-4 rounded-t-lg ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`} style={{ zIndex: 10 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      {viewingPart.part}
                    </h2>
                    {(() => {
                      const partProject = viewingPart.projectId ? projects.find(p => p.id === viewingPart.projectId) : null;
                      const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                      return vehicle && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <Car className="w-3 h-3 mr-1" style={{ color: vehicle.color || '#3B82F6' }} />
                          {vehicle.nickname || vehicle.name}
                        </span>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => handleCloseModal(() => {
                      setShowPartDetailModal(false);
                      setViewingPart(null);
                    })}
                    className={`transition-colors ${
                      darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Status Badge */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(viewingPart)}`}>
                    {getStatusIcon(viewingPart)}
                    <span>{getStatusText(viewingPart)}</span>
                  </div>
                </div>

                {/* Part Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className={`rounded-lg p-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Part Information</h3>
                    <div className="space-y-4">
                      {viewingPart.partNumber && viewingPart.partNumber !== '-' && (
                        <div>
                          <p className={`text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Part Number</p>
                          <p className={`text-base font-mono ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>{viewingPart.partNumber}</p>
                        </div>
                      )}
                      {viewingPart.vendor && (
                        <div>
                          <p className={`text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
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
                              darkMode ? 'text-gray-400' : 'text-gray-600'
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
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Part Price</span>
                        <span className={`text-lg font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>${viewingPart.price.toFixed(2)}</span>
                      </div>
                      {viewingPart.shipping > 0 && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Shipping</span>
                          <span className={`text-lg font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>${viewingPart.shipping.toFixed(2)}</span>
                        </div>
                      )}
                      {viewingPart.duties > 0 && (
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Import Duties</span>
                          <span className={`text-lg font-semibold ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
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
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-3 ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>Tracking Information</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
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

              {/* Footer with Edit Button */}
              <div className={`sticky bottom-0 border-t p-4 flex justify-end ${
                darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <button
                  onClick={() => {
                    // Set transition flag to prevent scroll restoration
                    isTransitioningModals.current = true;
                    const partToEdit = viewingPart;
                    setEditingPart({
                      ...partToEdit,
                      status: partToEdit.delivered ? 'delivered' : (partToEdit.shipped ? 'shipped' : (partToEdit.purchased ? 'purchased' : 'pending'))
                    });
                    setShowEditModal(true);
                    // Close detail modal immediately
                    setShowPartDetailModal(false);
                    setViewingPart(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PARTS TAB CONTENT */}
        {activeTab === 'parts' && (
          <div className="slide-in-left">
          <>
        {/* Statistics and Cost Breakdown - Side by Side */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-6">
          {/* Statistics Cards - order-1 on mobile, contains search on desktop */}
          <div className="space-y-4 order-1 lg:order-none">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div 
                onClick={() => setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-yellow-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'purchased' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
              >
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Order Placed</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.purchased}</p>
                </div>
              </div>

              <div 
                onClick={() => setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-blue-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'shipped' ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>In Transit</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.shipped}</p>
                </div>
              </div>

              <div 
                onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
                className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-green-500 relative overflow-hidden cursor-pointer transition-all duration-200 ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'delivered' ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
              >
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Delivered</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{stats.delivered}</p>
                </div>
              </div>

              <div className={`rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border-l-4 border-purple-500 relative overflow-hidden ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4" />
                <div>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Total Spent</p>
                  <p className={`text-lg sm:text-2xl lg:text-3xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>${stats.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Search Box - Shows in left column on desktop only */}
            <div className={`hidden lg:block rounded-lg shadow-md p-3 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search parts..."
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
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

          {/* Cost Breakdown - order-2 on mobile */}
          <div className={`rounded-lg shadow-md p-4 sm:p-6 order-2 lg:order-none ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Cost Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Parts Cost</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalPrice.toFixed(2)}</p>
              </div>
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Shipping</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalShipping.toFixed(2)}</p>
              </div>
              <div className={`flex items-center justify-between py-2 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Import Duties</p>
                <p className={`text-base sm:text-xl font-semibold truncate ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>${stats.totalDuties.toFixed(2)}</p>
              </div>
              <div className="pt-2">
                <p className={`text-sm mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
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
                  <span className={`text-sm font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {Math.round((stats.delivered / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box - Mobile only (order-3, shows after cost breakdown) */}
          <div className={`lg:hidden rounded-lg shadow-md p-3 order-3 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search parts..."
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
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
        {/* Desktop Table View - Hidden on mobile */}
        {filteredParts.length > 0 ? (
        <div className={`hidden md:block rounded-lg shadow-md overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-100 border-slate-200'
              }`}>
                <tr>
                  <th 
                    onClick={() => handleSort('status')}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part</th>
                  <th className={`hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Part #</th>
                  <th 
                    onClick={() => handleSort('vendor')}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      Vendor
                      {getSortIcon('vendor')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Project</th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-slate-700'
                  }`}>Vehicle</th>
                  <th 
                    onClick={() => handleSort('price')}
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Price
                      {getSortIcon('price')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total')}
                    className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
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
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                        const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                        return vehicle ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                            darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}>
                            <Car className="w-3 h-3 mr-1" style={{ color: vehicle.color || '#3B82F6' }} />
                            {vehicle.nickname || vehicle.name}
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
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-100' : 'text-slate-900'
                      }`}>${part.price.toFixed(2)}</div>
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
          <div className={`hidden md:block text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
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

        {/* Mobile Card View - Visible only on mobile */}
        {filteredParts.length > 0 ? (
        <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredParts.map((part) => (
              <div 
                key={part.id}
                onClick={() => {
                  setViewingPart(part);
                  setShowPartDetailModal(true);
                }}
                className={`rounded-lg shadow-lg p-4 transition-all hover:shadow-xl cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-800' 
                    : 'bg-white'
                }`}
              >
                {/* Card Header - Part Name and Status */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className={`text-base font-bold flex-1 ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {part.part}
                  </h3>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown part={part} />
                  </div>
                </div>

                {/* Vendor (left) + Project (right) on same line */}
                <div className="mb-3">
                  <div className="flex items-center justify-between gap-3">
                    {part.vendor && (
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Vendor:</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor)}`}>
                          {part.vendor}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Project:</p>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ProjectDropdown part={part} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle info on second line if available */}
                  {(() => {
                    const partProject = part.projectId ? projects.find(p => p.id === part.projectId) : null;
                    const vehicle = partProject?.vehicle_id ? vehicles.find(v => v.id === partProject.vehicle_id) : null;
                    return vehicle && (
                      <div className="flex items-center gap-2 mt-2">
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Vehicle:</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          <Car className="w-3 h-3 mr-1" style={{ color: vehicle.color || '#3B82F6' }} />
                          {vehicle.nickname || vehicle.name}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Price Breakdown - More compact grid */}
                <div className={`p-3 rounded-lg mb-3 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className={`text-xs mb-0.5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Price</p>
                      <p className={`text-sm font-semibold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>${part.price.toFixed(2)}</p>
                    </div>
                    {part.shipping > 0 && (
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Ship</p>
                        <p className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>${part.shipping.toFixed(2)}</p>
                      </div>
                    )}
                    {part.duties > 0 && (
                      <div>
                        <p className={`text-xs mb-0.5 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Duties</p>
                        <p className={`text-sm font-semibold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>${part.duties.toFixed(2)}</p>
                      </div>
                    )}
                    <div className={part.shipping > 0 || part.duties > 0 ? '' : 'col-span-2'}>
                      <p className={`text-xs mb-0.5 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>Total</p>
                      <p className={`text-base font-bold ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>${part.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                <div onClick={(e) => e.stopPropagation()}>
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
                
                {/* Part Number - Bottom Right Corner */}
                {part.partNumber && part.partNumber !== '-' && (
                  <div className="flex justify-end mt-2">
                    <p className={`text-[10px] font-mono ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>{part.partNumber}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`md:hidden text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`mb-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
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
                      console.log('[MODAL ANIMATION] Project clicked, setting states...');
                      console.log('[MODAL ANIMATION] Current projectModalEditMode:', projectModalEditMode);
                      setViewingProject(project);
                      setProjectModalEditMode(false);
                      setShowProjectDetailModal(true);
                      console.log('[MODAL ANIMATION] States set - viewingProject:', project.name, 'editMode: false, showModal: true');
                    }}
                    className={`relative rounded-lg shadow-lg pt-3 pb-6 px-6 transition-all hover:shadow-xl cursor-pointer ${
                      draggedProject?.id === project.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : dragOverProject?.id === project.id
                          ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                          : ''
                    } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
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
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={`text-xl font-bold ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}>
                            {project.name}
                          </h3>
                          {(() => {
                            const vehicle = project.vehicle_id ? vehicles.find(v => v.id === project.vehicle_id) : null;
                            return vehicle && (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}>
                                <Car className="w-3 h-3 mr-1" style={{ color: vehicle.color || '#3B82F6' }} />
                                {vehicle.nickname || vehicle.name}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[project.status]
                      }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className={`text-sm mb-4 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {project.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
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
                          darkMode ? 'text-gray-400' : 'text-gray-600'
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
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Budget
                        </p>
                        <p className={`text-lg font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          ${project.budget?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    {/* Dates and Priority */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Started: {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString() : 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Target: {project.target_date ? new Date(project.target_date + 'T00:00:00').toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Priority:
                        </span>
                        <span className={`text-sm font-bold ${priorityColors[project.priority]}`}>
                          {project.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Linked Parts */}
                    {(() => {
                      const linkedParts = parts.filter(part => part.projectId === project.id);
                      if (linkedParts.length > 0) {
                        return (
                          <div className={`mt-4 pt-4 border-t ${
                            darkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <Package className="w-4 h-4" />
                                Linked Parts ({linkedParts.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {linkedParts.slice(0, 3).map((part) => (
                                <div 
                                  key={part.id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="truncate flex-1">{part.part}</span>
                                    <span className="ml-2 font-medium">${part.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                              {linkedParts.length > 3 && (
                                <div className={`text-xs text-center py-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  +{linkedParts.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Wrench className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No Projects Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
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
                  className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] modal-content ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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

                  <div className="p-6 modal-scrollable">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
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
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="e.g., Interior Restoration"
                          required
                        />
                      </div>

                      <div></div>

                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Description
                        </label>
                        <textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Brief description of the project"
                          rows="3"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
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
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Priority
                        </label>
                        <select
                          value={newProject.priority}
                          onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={newProject.start_date}
                          onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Target Date
                        </label>
                        <input
                          type="date"
                          value={newProject.target_date}
                          onChange={(e) => setNewProject({ ...newProject, target_date: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Status
                        </label>
                        <select
                          value={newProject.status}
                          onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="planning">Planning</option>
                          <option value="in_progress">In Progress</option>
                          <option value="on_hold">On Hold</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            <span>Linked Vehicle</span>
                          </div>
                        </label>
                        <select
                          value={newProject.vehicle_id || ''}
                          onChange={(e) => setNewProject({ ...newProject, vehicle_id: e.target.value ? parseInt(e.target.value) : null })}
                          className={`w-full px-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-100' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">No vehicle</option>
                          {vehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.nickname || vehicle.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}></div>
                  
                  <div className="p-6">
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
                            start_date: '',
                            target_date: '',
                            priority: 'medium',
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
                  console.log('[MODAL ANIMATION] Closing project modal');
                  setShowProjectDetailModal(false);
                  setViewingProject(null);
                  setProjectModalEditMode(false);
                })}
              >
                {console.log('[MODAL ANIMATION] Rendering project modal - editMode:', projectModalEditMode, 'project:', viewingProject.name)}
                <div 
                  className={`rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden modal-content ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className={`text-2xl font-bold ${
                            darkMode ? 'text-gray-100' : 'text-gray-800'
                          }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                            {viewingProject.name}
                          </h2>
                          {(() => {
                            const vehicle = viewingProject.vehicle_id ? vehicles.find(v => v.id === viewingProject.vehicle_id) : null;
                            return vehicle && (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}>
                                <Car className="w-3 h-3 mr-1 flex-shrink-0" style={{ color: vehicle.color || '#3B82F6' }} />
                                <span className="truncate">{vehicle.nickname || vehicle.name}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCloseModal(() => {
                          setShowProjectDetailModal(false);
                          setViewingProject(null);
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
                    {console.log('[MODAL ANIMATION] Content render - editMode:', projectModalEditMode)}
                    {/* Project Details View */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        projectModalEditMode
                          ? 'absolute opacity-0 pointer-events-none -translate-x-full' 
                          : 'relative opacity-100'
                      }`}
                    >
                      {console.log('[MODAL ANIMATION] Details View classes:', projectModalEditMode ? 'HIDDEN (absolute, opacity-0)' : 'VISIBLE (relative, opacity-100)')}
                      <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                        <ProjectDetailView
                          project={viewingProject}
                          parts={parts}
                          darkMode={darkMode}
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
                          ? 'relative opacity-100 translate-x-0' 
                          : 'absolute opacity-0 translate-x-full pointer-events-none'
                      }`}
                    >
                      {console.log('[MODAL ANIMATION] Edit View classes:', projectModalEditMode ? 'VISIBLE (relative, opacity-100)' : 'HIDDEN (absolute, opacity-0)')}
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
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer with conditional buttons */}
                  <div className={`sticky bottom-0 border-t p-4 flex items-center justify-between ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    {projectModalEditMode ? (
                      <button
                        onClick={() => {
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
                      <button
                        onClick={async () => {
                          await updateProject(viewingProject.id, {
                            name: viewingProject.name,
                            description: viewingProject.description,
                            budget: parseFloat(viewingProject.budget),
                            priority: viewingProject.priority,
                            start_date: viewingProject.start_date && viewingProject.start_date.trim() !== '' ? viewingProject.start_date : null,
                            target_date: viewingProject.target_date && viewingProject.target_date.trim() !== '' ? viewingProject.target_date : null,
                            status: viewingProject.status,
                            vehicle_id: viewingProject.vehicle_id || null,
                            todos: viewingProject.todos || []
                          });
                          setProjectModalEditMode(false);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          console.log('[MODAL ANIMATION] Edit button clicked - switching to edit mode');
                          setProjectModalEditMode(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
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
            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  data-vehicle-id={vehicle.id}
                  onDragOver={(e) => handleVehicleDragOver(e, vehicle)}
                  onDragLeave={handleVehicleDragLeave}
                  onDrop={(e) => handleVehicleDrop(e, vehicle)}
                  onClick={() => {
                    setViewingVehicle(vehicle);
                    setShowVehicleDetailModal(true);
                  }}
                  className={`relative rounded-lg shadow-lg pt-3 pb-6 px-6 transition-all hover:shadow-xl cursor-pointer border-t-4 ${
                    draggedVehicle?.id === vehicle.id 
                      ? 'ring-2 ring-blue-500 ring-offset-2' 
                      : dragOverVehicle?.id === vehicle.id
                        ? (darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
                        : ''
                  } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
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
                    <div className="mb-4 mt-10">
                      <img 
                        src={vehicle.image_url} 
                        alt={vehicle.nickname || vehicle.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-48 object-cover rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'
                        }`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          e.target.style.opacity = '1';
                        }}
                        style={{ opacity: 0, transition: 'opacity 0.3s ease-in' }}
                      />
                    </div>
                  )}

                  {/* Vehicle Header */}
                  <div className={`mb-4 ${vehicle.image_url ? 'mt-4' : 'mt-8'}`}>
                    <h3 className={`text-xl font-bold mb-1 ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {vehicle.nickname || (vehicle.year ? `${vehicle.year} ` : '') + vehicle.name}
                    </h3>
                    {vehicle.nickname && (
                      <p className={`text-sm mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {vehicle.vin && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
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
                      return vehicleProjects.length > 0 && (
                        <div className={`mt-4 pt-4 border-t ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Projects ({vehicleProjects.length})
                          </h4>
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
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                darkMode ? 'text-gray-500' : 'text-gray-600'
                              }`}>
                                +{vehicleProjects.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {vehicles.length === 0 && (
              <div className={`text-center py-12 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <Car className={`w-16 h-16 mx-auto mb-4 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No Vehicles Yet
                </h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
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
                  } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
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
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
                              darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>{newVehicle.color || '#3B82F6'}</span>
                            </div>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                              min="1900"
                              max="2100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Vehicle Name
                          </label>
                          <input
                            type="text"
                            value={newVehicle.name}
                            onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                            placeholder=""
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                    : darkMode ? 'text-gray-400' : 'text-gray-600'
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

                    {/* Full Width Sections Below */}
                    {/* Half Width Sections Below */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`pt-4 border-t ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-3 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Filters
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Fuel Filter
                            </label>
                            <input
                              type="text"
                              value={newVehicle.fuel_filter}
                              onChange={(e) => setNewVehicle({ ...newVehicle, fuel_filter: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Air Filter
                            </label>
                            <input
                              type="text"
                              value={newVehicle.air_filter}
                              onChange={(e) => setNewVehicle({ ...newVehicle, air_filter: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>

                      <div className={`pt-4 border-t ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-3 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Battery
                        </h3>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
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
                      </div>
                    </div>

                    {/* Oil Info Section - Full Width */}
                    <div className="mt-6">
                      <div className={`pt-4 border-t ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-3 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Oil Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
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
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Oil Type
                            </label>
                            <input
                              type="text"
                              value={newVehicle.oil_type}
                              onChange={(e) => setNewVehicle({ ...newVehicle, oil_type: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Oil Capacity
                            </label>
                            <input
                              type="text"
                              value={newVehicle.oil_capacity}
                              onChange={(e) => setNewVehicle({ ...newVehicle, oil_capacity: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Oil Brand
                            </label>
                            <input
                              type="text"
                              value={newVehicle.oil_brand}
                              onChange={(e) => setNewVehicle({ ...newVehicle, oil_brand: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Drain Plug
                            </label>
                            <input
                              type="text"
                              value={newVehicle.drain_plug}
                              onChange={(e) => setNewVehicle({ ...newVehicle, drain_plug: e.target.value })}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              }`}
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
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
                  setShowVehicleDetailModal(false);
                  setViewingVehicle(null);
                  setVehicleModalProjectView(null);
                  setVehicleModalEditMode(null);
                })}
              >
                <div 
                  className={`rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden modal-content ${
                    isModalClosing ? 'modal-popup-exit' : 'modal-popup-enter'
                  } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h2 className={`text-2xl font-bold ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`} style={{ fontFamily: "'FoundationOne', 'Courier New', monospace" }}>
                      {vehicleModalProjectView ? vehicleModalProjectView.name : (viewingVehicle.nickname || viewingVehicle.name || 'Vehicle Details')}
                    </h2>
                    <button
                      onClick={() => handleCloseModal(() => {
                        setShowVehicleDetailModal(false);
                        setViewingVehicle(null);
                        setVehicleModalProjectView(null);
                        setVehicleModalEditMode(null);
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
                          ? 'absolute opacity-0 pointer-events-none -translate-x-full' 
                          : 'relative opacity-100'
                      }`}
                    >
                      <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
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
                          {viewingVehicle.year && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Year</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.year}</p>
                            </div>
                          )}
                          {viewingVehicle.name && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Model</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.name}</p>
                            </div>
                          )}
                          {viewingVehicle.license_plate && (
                            <div className="col-span-2">
                              <p className={`text-sm font-medium mb-2 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>License Plate</p>
                              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                darkMode ? 'bg-blue-600 text-blue-100' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {viewingVehicle.license_plate}
                              </span>
                            </div>
                          )}
                          {viewingVehicle.vin && (
                            <div className="col-span-2">
                              <p className={`text-sm font-medium mb-2 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>VIN</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono ${
                                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {viewingVehicle.vin}
                              </span>
                            </div>
                          )}
                          {viewingVehicle.insurance_policy && (
                            <div className="col-span-2">
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Insurance Policy</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.insurance_policy}</p>
                            </div>
                          )}
                          
                          {/* Total Spent on Linked Projects */}
                          {(() => {
                            const vehicleProjects = projects.filter(p => p.vehicle_id === viewingVehicle.id);
                            const totalSpent = calculateVehicleTotalSpent(viewingVehicle.id, projects, parts);
                            
                            return (
                              <div className={`col-span-2 pt-4 mt-4 border-t ${
                                darkMode ? 'border-gray-600' : 'border-gray-300'
                              }`}>
                                <p className={`text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>Total Spent</p>
                                <p className={`text-2xl font-bold ${
                                  darkMode ? 'text-green-400' : 'text-green-600'
                                }`}>${totalSpent.toFixed(2)}</p>
                                {vehicleProjects.length > 0 && (
                                  <p className={`text-xs mt-1 ${
                                    darkMode ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    {vehicleProjects.length} project{vehicleProjects.length !== 1 ? 's' : ''}
                                  </p>
                                )}
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
                    {(viewingVehicle.fuel_filter || viewingVehicle.air_filter || viewingVehicle.oil_filter || viewingVehicle.oil_type || viewingVehicle.oil_capacity || viewingVehicle.oil_brand || viewingVehicle.drain_plug || viewingVehicle.battery) && (
                      <div className={`pt-6 border-t ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <h3 className={`text-lg font-semibold mb-3 ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          Maintenance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {viewingVehicle.fuel_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Fuel Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.fuel_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.air_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Air Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.air_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_filter && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Oil Filter</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.oil_filter}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_type && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Oil Type</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.oil_type}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_capacity && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Oil Capacity</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.oil_capacity}</p>
                            </div>
                          )}
                          {viewingVehicle.oil_brand && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Oil Brand</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.oil_brand}</p>
                            </div>
                          )}
                          {viewingVehicle.drain_plug && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Drain Plug</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.drain_plug}</p>
                            </div>
                          )}
                          {viewingVehicle.battery && (
                            <div>
                              <p className={`text-sm font-medium mb-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>Battery Type</p>
                              <p className={`text-base ${
                                darkMode ? 'text-gray-100' : 'text-gray-900'
                              }`}>{viewingVehicle.battery}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Projects Section */}
                    {(() => {
                      const vehicleProjects = getVehicleProjects(viewingVehicle.id);
                      return vehicleProjects.length > 0 && (
                        <div className={`pt-6 border-t ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <h3 className={`text-lg font-semibold mb-3 ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Wrench className="w-5 h-5" />
                              <span>Projects ({vehicleProjects.length})</span>
                            </div>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {vehicleProjects.map((project) => {
                              const projectParts = parts.filter(p => p.projectId === project.id);
                              const projectTotal = projectParts.reduce((sum, part) => sum + part.total, 0);
                              const deliveredCount = projectParts.filter(p => p.delivered).length;

                              return (
                                <button
                                  key={project.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVehicleModalProjectView(project);
                                  }}
                                  className={`rounded-lg p-4 border-l-4 text-left transition-all hover:shadow-md cursor-pointer ${
                                    darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                                  style={{ borderLeftColor: getPriorityBorderColor(project.priority) }}
                                >
                                  <h4 className={`font-semibold mb-2 ${
                                    darkMode ? 'text-gray-200' : 'text-gray-800'
                                  }`}>
                                    {project.name}
                                  </h4>
                                  {project.description && (
                                    <p className={`text-sm mb-3 ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {project.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Package className={`w-3 h-3 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`} />
                                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {projectParts.length} parts
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className={`w-3 h-3 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`} />
                                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {deliveredCount} delivered
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className={`w-3 h-3 ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`} />
                                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        ${projectTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
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
                            ? 'relative opacity-100 translate-x-0' 
                            : 'absolute opacity-0 translate-x-full pointer-events-none'
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
                          ? 'relative opacity-100 translate-x-0' 
                          : 'absolute opacity-0 translate-x-full pointer-events-none'
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
                          />
                        </div>
                      )}
                    </div>

                    {/* Edit Vehicle View - Slides in for editing */}
                    <div 
                      className={`w-full transition-all duration-500 ease-in-out ${
                        vehicleModalEditMode === 'vehicle'
                          ? 'relative opacity-100 translate-x-0' 
                          : 'absolute opacity-0 translate-x-full pointer-events-none'
                      }`}
                    >
                      {viewingVehicle && (
                        <div className="p-6 space-y-6 max-h-[calc(90vh-164px)] overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Basic Information */}
                            <div className="space-y-4">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Nickname *
                                </label>
                                <input
                                  type="text"
                                  value={viewingVehicle.nickname || ''}
                                  onChange={(e) => setViewingVehicle({ ...viewingVehicle, nickname: e.target.value })}
                                  className={inputClasses(darkMode)}
                                  placeholder=""
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>{viewingVehicle.color || '#3B82F6'}</span>
                                  </div>
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                    min="1900"
                                    max="2100"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Vehicle Name
                                </label>
                                <input
                                  type="text"
                                  value={viewingVehicle.name}
                                  onChange={(e) => setViewingVehicle({ ...viewingVehicle, name: e.target.value })}
                                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    darkMode 
                                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                  }`}
                                  placeholder=""
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>
                              </div>

                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Insurance Policy
                                </label>
                                <input
                                  type="text"
                                  value={viewingVehicle.insurance_policy || ''}
                                  onChange={(e) => setViewingVehicle({ ...viewingVehicle, insurance_policy: e.target.value })}
                                  className={inputClasses(darkMode)}
                                  placeholder=""
                                />
                              </div>
                            </div>

                            {/* Right Column - Image Upload */}
                            <div className="space-y-4">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                          : darkMode ? 'text-gray-400' : 'text-gray-600'
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

                          {/* Half Width Sections Below */}
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={`pt-4 border-t ${
                              darkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                              <h3 className={`text-lg font-semibold mb-3 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                Filters
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>
                              </div>
                            </div>

                            <div className={`pt-4 border-t ${
                              darkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                              <h3 className={`text-lg font-semibold mb-3 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                Battery
                              </h3>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
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

                          {/* Oil Info Section - Full Width */}
                          <div className="mt-6">
                            <div className={`pt-4 border-t ${
                              darkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                              <h3 className={`text-lg font-semibold mb-3 ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                Oil Info
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                    placeholder=""
                                  />
                                </div>

                                <div>
                                  <label className={`block text-sm font-medium mb-2 ${
                                    darkMode ? 'text-gray-300' : 'text-gray-700'
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
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
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
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    {(vehicleModalProjectView || vehicleModalEditMode) ? (
                      <button
                        onClick={() => {
                          if (vehicleModalEditMode) {
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
                          } else if (vehicleModalEditMode === 'project') {
                            await updateProject(vehicleModalProjectView.id, {
                              name: vehicleModalProjectView.name,
                              description: vehicleModalProjectView.description,
                              budget: parseFloat(vehicleModalProjectView.budget),
                              priority: vehicleModalProjectView.priority,
                              start_date: vehicleModalProjectView.start_date && vehicleModalProjectView.start_date.trim() !== '' ? vehicleModalProjectView.start_date : null,
                              target_date: vehicleModalProjectView.target_date && vehicleModalProjectView.target_date.trim() !== '' ? vehicleModalProjectView.target_date : null,
                              status: vehicleModalProjectView.status,
                              vehicle_id: vehicleModalProjectView.vehicle_id || null
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
                        {uploadingImage ? 'Saving...' : 'Save Changes'}
                      </button>
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
    </div>
  );
};

export default LandCruiserTracker;
