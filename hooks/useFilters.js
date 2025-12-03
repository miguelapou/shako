import { useState, useEffect } from 'react';

/**
 * Custom hook for managing filter and sort state with localStorage persistence
 *
 * Features:
 * - Parts filtering (search, delivered, status, vendor, date)
 * - Parts sorting (by various fields, asc/desc)
 * - Project filtering (by vehicle)
 * - Archive state management (collapsed/expanded)
 * - Dropdown visibility management
 * - localStorage persistence for filters
 *
 * @returns {Object} Filter state and handlers
 */
const useFilters = () => {
  // Parts filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveredFilter, setDeliveredFilter] = useState('all'); // 'all', 'only', 'hide'
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('status');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isSorting, setIsSorting] = useState(false);
  const [isStatusFiltering, setIsStatusFiltering] = useState(false);
  const [partsDateFilter, setPartsDateFilter] = useState('all'); // 'all', '1week', '2weeks', '1month'
  const [isFilteringParts, setIsFilteringParts] = useState(false);
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false);

  // Project filters
  const [projectVehicleFilter, setProjectVehicleFilter] = useState('all'); // 'all' or vehicle ID
  const [isFilteringProjects, setIsFilteringProjects] = useState(false);
  const [showVehicleFilterDropdown, setShowVehicleFilterDropdown] = useState(false);

  // Archive states
  const [isArchiveCollapsed, setIsArchiveCollapsed] = useState(true);
  const [isProjectArchiveCollapsed, setIsProjectArchiveCollapsed] = useState(true);
  const [archiveStatesInitialized, setArchiveStatesInitialized] = useState(false);

  // Dropdown management
  const [openDropdown, setOpenDropdown] = useState(null);

  // Initialize archive collapsed states from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedArchiveCollapsed = localStorage.getItem('archiveCollapsed');
      if (savedArchiveCollapsed !== null) {
        setIsArchiveCollapsed(JSON.parse(savedArchiveCollapsed));
      }

      const savedProjectArchiveCollapsed = localStorage.getItem('projectArchiveCollapsed');
      if (savedProjectArchiveCollapsed !== null) {
        setIsProjectArchiveCollapsed(JSON.parse(savedProjectArchiveCollapsed));
      }

      setArchiveStatesInitialized(true);
    }
  }, []);

  // Save archive collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('archiveCollapsed', JSON.stringify(isArchiveCollapsed));
    }
  }, [isArchiveCollapsed, archiveStatesInitialized]);

  // Save project archive collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('projectArchiveCollapsed', JSON.stringify(isProjectArchiveCollapsed));
    }
  }, [isProjectArchiveCollapsed, archiveStatesInitialized]);

  // Initialize parts date filter from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPartsDateFilter = localStorage.getItem('partsDateFilter');
      if (savedPartsDateFilter !== null) {
        setPartsDateFilter(savedPartsDateFilter);
      }
    }
  }, []);

  // Save parts date filter to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && archiveStatesInitialized) {
      localStorage.setItem('partsDateFilter', partsDateFilter);
    }
  }, [partsDateFilter, archiveStatesInitialized]);

  return {
    // Parts filters
    searchTerm,
    setSearchTerm,
    deliveredFilter,
    setDeliveredFilter,
    statusFilter,
    setStatusFilter,
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
    partsDateFilter,
    setPartsDateFilter,
    isFilteringParts,
    setIsFilteringParts,
    showDateFilterDropdown,
    setShowDateFilterDropdown,

    // Project filters
    projectVehicleFilter,
    setProjectVehicleFilter,
    isFilteringProjects,
    setIsFilteringProjects,
    showVehicleFilterDropdown,
    setShowVehicleFilterDropdown,

    // Archive states
    isArchiveCollapsed,
    setIsArchiveCollapsed,
    isProjectArchiveCollapsed,
    setIsProjectArchiveCollapsed,
    archiveStatesInitialized,

    // Dropdown management
    openDropdown,
    setOpenDropdown
  };
};

export default useFilters;
