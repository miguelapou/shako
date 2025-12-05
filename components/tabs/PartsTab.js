import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  Search, Package, TrendingUp, Truck, CheckCircle, Clock,
  ChevronDown, Plus, X, ExternalLink, ShoppingCart, Car,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import PriceDisplay from '../ui/PriceDisplay';
import { getVendorDisplayColor } from '../../utils/colorUtils';
import { getTrackingUrl, getCarrierName } from '../../utils/trackingUtils';

const PartsTab = ({
  tabContentRef,
  stats,
  filteredParts,
  darkMode,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  deliveredFilter,
  setDeliveredFilter,
  vendorFilter,
  setVendorFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  isSorting,
  setIsSorting,
  isStatusFiltering,
  setIsStatusFiltering,
  isFilteringParts,
  openDropdown,
  setOpenDropdown,
  projects,
  vehicles,
  vendorColors,
  setShowAddModal,
  setShowPartDetailModal,
  setViewingPart,
  updatePartStatus,
  updatePartProject,
  handleSort,
  getSortIcon,
  getStatusIcon,
  getStatusText,
  getStatusColor,
  getVendorColor
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // Load from localStorage or default to 10
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('partsTableRowsPerPage');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });

  // Save rowsPerPage to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('partsTableRowsPerPage', rowsPerPage.toString());
    }
  }, [rowsPerPage]);

  // Save scroll position before filter changes
  const scrollPositionRef = useRef(0);
  const [containerMinHeight, setContainerMinHeight] = useState('100vh');

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredParts.length, searchTerm, statusFilter, deliveredFilter, vendorFilter]);

  // Prevent scroll restoration when filtering
  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      const originalScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      return () => {
        window.history.scrollRestoration = originalScrollRestoration;
      };
    }
  }, []);

  // Maintain minimum height to prevent scroll jumping
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[PartsTab] Filter changed. Status:', statusFilter, 'Delivered:', deliveredFilter);
      console.log('[PartsTab] Current scroll:', window.scrollY);
    }
  }, [statusFilter, deliveredFilter]);

  // Helper function to change page with animation
  const handlePageChange = (newPage) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
      setIsPaginating(true);
      setCurrentPage(newPage);
      setTimeout(() => setIsPaginating(false), 600);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredParts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedParts = filteredParts.slice(startIndex, endIndex);

  // Internal StatusDropdown component
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

  // Internal ProjectDropdown component
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

  return (
    <div
      ref={tabContentRef}
      className="slide-in-left"
    >
      <>
        {/* Statistics and Cost Breakdown - Side by Side */}
        <div className="flex flex-col gap-6 mb-1 stats-container-800">
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
          <div className="space-y-4 order-2 stats-cards-800">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const currentScroll = window.scrollY || window.pageYOffset;
                  console.log('[Ordered Card] Clicked at scroll position:', currentScroll);
                  // Calculate required height to maintain scroll position
                  const requiredHeight = Math.max(currentScroll + window.innerHeight, window.innerHeight);
                  console.log('[Ordered Card] Setting container minHeight to:', requiredHeight);
                  // Force synchronous render of height change
                  flushSync(() => {
                    setContainerMinHeight(`${requiredHeight}px`);
                  });
                  console.log('[Ordered Card] Height applied, now filtering');
                  // Force synchronous render of filter changes
                  flushSync(() => {
                    scrollPositionRef.current = currentScroll;
                    setIsStatusFiltering(true);
                    setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased');
                    setDeliveredFilter('all');
                  });
                  // Explicitly restore scroll position after both renders complete
                  console.log('[Ordered Card] Restoring scroll to:', currentScroll);
                  window.scrollTo(0, currentScroll);
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  console.log('[Ordered Card] Touch start');
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                  console.log('[Ordered Card] Touch move');
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  console.log('[Ordered Card] Touch end');
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-yellow-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'purchased' ? 'ring-2 ring-yellow-500' : ''}`}
                style={{ touchAction: 'manipulation' }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  const currentScroll = window.scrollY || window.pageYOffset;
                  console.log('[Shipped Card] Clicked at scroll position:', currentScroll);
                  // Calculate required height to maintain scroll position
                  const requiredHeight = Math.max(currentScroll + window.innerHeight, window.innerHeight);
                  console.log('[Shipped Card] Setting container minHeight to:', requiredHeight);
                  // Force synchronous render of height change
                  flushSync(() => {
                    setContainerMinHeight(`${requiredHeight}px`);
                  });
                  console.log('[Shipped Card] Height applied, now filtering');
                  // Force synchronous render of filter changes
                  flushSync(() => {
                    scrollPositionRef.current = currentScroll;
                    setIsStatusFiltering(true);
                    setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped');
                    setDeliveredFilter('all');
                  });
                  // Explicitly restore scroll position after both renders complete
                  console.log('[Shipped Card] Restoring scroll to:', currentScroll);
                  window.scrollTo(0, currentScroll);
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  console.log('[Shipped Card] Touch start');
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                  console.log('[Shipped Card] Touch move');
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  console.log('[Shipped Card] Touch end');
                }}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 border-blue-500 relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${statusFilter === 'shipped' ? 'ring-2 ring-blue-500' : ''}`}
                style={{ touchAction: 'manipulation' }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  const currentScroll = window.scrollY || window.pageYOffset;
                  // Save scroll position BEFORE state changes
                  scrollPositionRef.current = currentScroll;
                  setIsStatusFiltering(true);
                  // Cycle through: all -> only -> hide -> all
                  setDeliveredFilter(prev =>
                    prev === 'all' ? 'only' :
                    prev === 'only' ? 'hide' : 'all'
                  );
                  setStatusFilter('all');
                  setTimeout(() => setIsStatusFiltering(false), 900);
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={`rounded-lg shadow-md p-3 sm:p-4 md:p-4 border-l-4 ${
                  deliveredFilter === 'hide' ? 'border-red-500' : 'border-green-500'
                } relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  deliveredFilter === 'hide'
                    ? (darkMode ? 'bg-gray-900' : 'bg-gray-300')
                    : (darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50')
                } ${deliveredFilter !== 'all' ? `ring-2 ${deliveredFilter === 'hide' ? 'ring-red-500' : 'ring-green-500'}` : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                <CheckCircle className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  deliveredFilter === 'hide' ? 'text-red-500' : 'text-green-500'
                } opacity-20 absolute top-2 sm:top-4 right-2 sm:right-4`} />
                <div key={deliveredFilter} className={deliveredFilter === 'hide' ? 'status-card-content' : ''}>
                  <p className={`text-xs sm:text-sm mb-1 sm:mb-2 md:mb-3 ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>{deliveredFilter === 'hide' ? 'Undelivered' : 'Delivered'}</p>
                  <p className={`text-xl sm:text-2xl md:text-2xl font-bold truncate ${
                    darkMode ? 'text-gray-100' : 'text-gray-800'
                  }`}>{deliveredFilter === 'hide' ? stats.undelivered : stats.delivered}</p>
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

          {/* Cost Breakdown - order-1 on mobile (appears first), full column width at 800px+ */}
          <div className="order-1 cost-breakdown-800">
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
                  darkMode ? 'border-gray-700' : 'border-gray-300'
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
        </div>

        {/* Search Box - Mobile only */}
        <div className={`show-below-800 rounded-lg shadow-md p-3 order-3 mb-6 ${
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

        {/* Parts Table */}
        {/* Desktop Table View - Hidden below 800px */}
        {filteredParts.length > 0 ? (
        <div className={`hidden-below-800 rounded-lg shadow-md ${
          darkMode ? 'bg-gray-800' : 'bg-slate-100'
        }`}>
          <div className="overflow-x-auto overflow-y-visible rounded-lg">
            <table className={`w-full min-w-[900px] ${isStatusFiltering || isFilteringParts ? 'table-status-filtering' : isSorting ? 'table-sorting' : isPaginating ? 'table-status-filtering' : ''}`}>
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
                    className={`hidden min-[1100px]:table-cell px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
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
                {paginatedParts.map((part) => (
                  <tr
                    key={part.id}
                    onClick={() => {
                      setViewingPart(part);
                      setShowPartDetailModal(true);
                    }}
                    className={`transition-colors cursor-pointer parts-table-row ${
                      darkMode ? 'dark' : 'light'
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
                        vendorColors[part.vendor] ? (
                          (() => {
                            const colors = getVendorDisplayColor(vendorColors[part.vendor], darkMode);
                            return (
                              <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-center border"
                                style={{
                                  backgroundColor: colors.bg,
                                  color: colors.text,
                                  borderColor: colors.border
                                }}
                              >
                                {part.vendor}
                              </span>
                            );
                          })()
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-center ${getVendorColor(part.vendor, vendorColors)}`}>
                            {part.vendor}
                          </span>
                        )
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
                    <td className="hidden min-[1100px]:table-cell px-6 py-4 text-center">
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
                {/* Empty rows to maintain consistent height */}
                {Array.from({ length: rowsPerPage - paginatedParts.length }).map((_, index) => (
                  <tr key={`empty-${index}`}>
                    <td colSpan="8" className="px-6 py-4">
                      <div className="h-[2rem]"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`px-6 py-4 border-t parts-table-footer ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Left: Showing text and rows per page dropdown */}
              <div className="flex items-center gap-4">
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredParts.length)}</span> of <span className="font-semibold">{filteredParts.length}</span> parts
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="rowsPerPage" className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-slate-600'
                  }`}>
                    Rows per page:
                  </label>
                  <select
                    id="rowsPerPage"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setIsPaginating(true);
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      setTimeout(() => setIsPaginating(false), 600);
                    }}
                    className={`px-3 py-2 pr-8 rounded border text-sm appearance-none ${
                      darkMode
                        ? 'bg-gray-600 border-gray-500 text-gray-200'
                        : 'bg-white border-slate-300 text-slate-700'
                    } cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>

              {/* Right: Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded border transition-colors ${
                      currentPage === 1
                        ? darkMode ? 'text-gray-600 border-gray-700 cursor-not-allowed' : 'text-slate-400 border-slate-300 cursor-not-allowed'
                        : darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-600' : 'text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* First page button (double arrow) */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded border transition-colors ${
                      currentPage === 1
                        ? darkMode ? 'text-gray-600 border-gray-700 cursor-not-allowed' : 'text-slate-400 border-slate-300 cursor-not-allowed'
                        : darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-600' : 'text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </button>

                  {/* Current page display */}
                  <div className={`min-w-[4rem] px-3 py-2 rounded border text-sm text-center font-medium ${
                    darkMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-500 text-white border-blue-400'
                  }`}>
                    {currentPage} / {totalPages}
                  </div>

                  {/* Last page button (double arrow) */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded border transition-colors ${
                      currentPage === totalPages
                        ? darkMode ? 'text-gray-600 border-gray-700 cursor-not-allowed' : 'text-slate-400 border-slate-300 cursor-not-allowed'
                        : darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-600' : 'text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </button>

                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded border transition-colors ${
                      currentPage === totalPages
                        ? darkMode ? 'text-gray-600 border-gray-700 cursor-not-allowed' : 'text-slate-400 border-slate-300 cursor-not-allowed'
                        : darkMode ? 'text-gray-300 border-gray-600 hover:bg-gray-600' : 'text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className={`hidden-below-800 text-center py-16 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-slate-100'
          } ${isStatusFiltering || isSorting ? 'animate-fade-in' : ''}`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
          </div>
        )}

        {/* Mobile Card View - Visible only below 800px */}
        {filteredParts.length > 0 ? (
        <div
          className={`show-below-800 grid grid-cols-1 gap-4 ${isStatusFiltering || isFilteringParts ? 'cards-status-filtering' : ''}`}
          style={{ minHeight: containerMinHeight }}
        >
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
                      vendorColors[part.vendor] ? (
                        (() => {
                          const colors = getVendorDisplayColor(vendorColors[part.vendor], darkMode);
                          return (
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: colors.border
                              }}
                            >
                              {part.vendor}
                            </span>
                          );
                        })()
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor, vendorColors)}`}>
                          {part.vendor}
                        </span>
                      )
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
          } ${isStatusFiltering || isSorting ? 'animate-fade-in' : ''}`}>
            <Package className={`w-20 h-20 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-slate-700'
            }`}>
              No Parts Found
            </h3>
            <p className={`${
              darkMode ? 'text-gray-400' : 'text-slate-600'
            }`}>
              {searchTerm || statusFilter !== 'all' || vendorFilter !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'Start tracking your parts by adding your first one'}
            </p>
          </div>
        )}
      </>
    </div>
  );
};

export default PartsTab;
