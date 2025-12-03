# Shako Refactoring Guide

## Overview

This document describes the ongoing refactoring of the Shako application from a monolithic 9,512-line component into a modular, maintainable codebase.

## Current Status

### ✅ Completed

#### Phase 1: Utility Functions (`/utils`)

All utility functions have been extracted into focused modules:

- **`colorUtils.js`** - Color management functions
  - `getStatusColors()` - Status badge colors
  - `getPriorityColors()` - Priority text colors
  - `getPriorityBorderColor()` - Priority border colors
  - `getVendorColor()` - Vendor badge colors (with custom color support)
  - `getVendorDisplayColor()` - Theme-aware vendor colors
  - `hexToRgba()` - Color conversion
  - `isLightColor()` - Color luminance detection
  - `darkenColor()` - Color darkening for contrast
  - `getMutedColor()` - Opacity-reduced colors

- **`styleUtils.js`** - Styling helper functions
  - `cardBg()`, `secondaryBg()` - Background utilities
  - `primaryText()`, `secondaryText()` - Text color utilities
  - `borderColor()`, `hoverBg()` - Border and hover utilities
  - `inputClasses()` - Input field styling
  - `selectDropdownStyle` - Dropdown arrow styling

- **`dataUtils.js`** - Data calculation functions
  - `calculateVehicleTotalSpent()` - Vehicle cost totals
  - `calculateProjectTotal()` - Project cost totals

- **`trackingUtils.js`** - Shipping tracking functions
  - `getTrackingUrl()` - Generate tracking URLs for various carriers
  - `getCarrierName()` - Identify shipping carrier from tracking info
  - Supports: UPS, FedEx, USPS, DHL, Amazon, Orange Connex, ECMS

#### Phase 1: Styles (`/styles`)

- **`custom.css`** - All animations and custom CSS
  - FoundationOne custom font
  - Modal styles and animations
  - Form input constraints
  - Select dropdown styling
  - All keyframe animations (popUpCenter, fadeIn, slideIn, etc.)
  - Table sorting/filtering animations
  - Project filtering animations
  - Garage door loading spinner
  - Scrollbar customization
  - Line clamp utilities
  - **Imported in:** `app/layout.js`

#### Phase 1: Simple UI Components (`/components/ui`)

- **`ConfirmDialog.js`** - Confirmation modal dialog
  - Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`, `cancelText`, `darkMode`, `isDangerous`
  - Features: Customizable buttons, danger/safe variants, backdrop blur

- **`PrimaryButton.js`** - Reusable action button
  - Props: `onClick`, `children`, `className`, `disabled`, `icon`
  - Features: Icon support, disabled state, consistent styling

- **`PriceDisplay.js`** - Formatted price display
  - Props: `amount`, `className`, `darkMode`
  - Features: Smaller decimal font size for better readability

- **`VendorSelect.js`** - Vendor selection dropdown
  - Props: `value`, `onChange`, `darkMode`, `uniqueVendors`
  - Features: Select existing vendor or input custom vendor name

#### Phase 2: Complex UI Components (`/components/ui`)

- **`ProjectDetailView.js`** (~900 lines) - Project details with todos and linked parts
  - Props: `project`, `parts`, `darkMode`, `updateProject`, `getStatusColors`, `getPriorityColors`, `getStatusText`, `getStatusTextColor`, `getVendorColor`, `vendorColors`, `calculateProjectTotal`, `editingTodoId`, `setEditingTodoId`, `editingTodoText`, `setEditingTodoText`, `newTodoText`, `setNewTodoText`, `vehicle`
  - Features: Todo list management with FLIP animations, collapsible sections, budget progress tracking, linked parts display
  - Imports: React hooks, Lucide icons, styleUtils, colorUtils, ConfirmDialog

- **`ProjectEditForm.js`** (~200 lines) - Project editing form
  - Props: `project`, `onProjectChange`, `vehicles`, `parts`, `unlinkPartFromProject`, `getVendorColor`, `vendorColors`, `darkMode`
  - Features: Vehicle dropdown selection, priority select, budget input, description textarea
  - Imports: React hooks, Lucide icons (Car, ChevronDown)

- **`LinkedPartsSection.js`** (~100 lines) - Display parts linked to a project
  - Props: `projectId`, `parts`, `unlinkPartFromProject`, `getVendorColor`, `vendorColors`, `darkMode`, `setConfirmDialog`
  - Features: Grid layout of linked parts, vendor color badges, unlink functionality
  - Imports: React, Lucide icons (Package), colorUtils

#### Phase 3: Modal Components (`/components/modals`)

- **`AddPartModal.js`** (~257 lines) - Part creation modal
  - Props: `isOpen`, `darkMode`, `newPart`, `setNewPart`, `projects`, `uniqueVendors`, `isModalClosing`, `handleCloseModal`, `addNewPart`, `onClose`
  - Features: Part form with price/shipping/duties, vendor selection, project linking, calculated total display
  - Imports: React, X icon, VendorSelect, selectDropdownStyle

- **`TrackingModal.js`** (~80 lines) - Tracking information modal
  - Props: `isOpen`, `darkMode`, `trackingInput`, `setTrackingInput`, `skipTrackingInfo`, `saveTrackingInfo`, `onClose`
  - Features: Simple tracking number input with skip/save options
  - Imports: React, X icon

- **`AddProjectModal.js`** (~279 lines) - Project creation modal
  - Props: `isOpen`, `darkMode`, `newProject`, `setNewProject`, `vehicles`, `showAddProjectVehicleDropdown`, `setShowAddProjectVehicleDropdown`, `isModalClosing`, `handleCloseModal`, `addProject`, `onClose`
  - Features: Project form with vehicle dropdown, priority selection, budget input, description textarea
  - Imports: React, X/Car/ChevronDown icons

- **`AddVehicleModal.js`** (~473 lines) - Vehicle creation modal
  - Props: `isOpen`, `darkMode`, `newVehicle`, `setNewVehicle`, `vehicleImagePreview`, `vehicleImageFile`, `uploadingImage`, `isDraggingImage`, `isModalClosing`, `inputClasses`, `handleCloseModal`, `addVehicle`, image handlers, `onClose`
  - Features: Two-column form (basic info + image upload), drag-and-drop image upload, maintenance fields, color picker
  - Imports: React, X/Upload icons, inputClasses

- **`PartDetailModal.js`** (~827 lines) - Part detail/edit/vendor management modal
  - Props: `isOpen`, `darkMode`, `viewingPart`, `editingPart`, `partDetailView`, setters, `projects`, `vehicles`, `parts`, `uniqueVendors`, `vendorColors`, `editingVendor`, `isModalClosing`, handlers, utility functions, `onClose`
  - Features: Three views (detail/edit/manage vendors), tracking links, vendor color customization, part editing/deletion
  - Imports: React, multiple Lucide icons, PrimaryButton, VendorSelect, colorUtils, styleUtils, trackingUtils, dataUtils

- **`ProjectDetailModal.js`** (~329 lines) - Project detail/edit modal
  - Props: `isOpen`, `darkMode`, `viewingProject`, `projectModalEditMode`, setters, `originalProjectData`, `isModalClosing`, `projects`, `parts`, `vehicles`, `vendorColors`, todo state, handlers, utility functions, `confirmDialog`, `onClose`
  - Features: Two modes (detail/edit), uses ProjectDetailView and ProjectEditForm components, archive/pause/delete actions
  - Imports: React, multiple Lucide icons, ProjectDetailView, ProjectEditForm, LinkedPartsSection, PrimaryButton

- **`VehicleDetailModal.js`** (~1213 lines) - Vehicle detail/edit with nested project views
  - Props: `isOpen`, `darkMode`, `viewingVehicle`, `vehicleModalProjectView`, `vehicleModalEditMode`, setters, `originalVehicleData`, `isModalClosing`, `projects`, `parts`, `vehicles`, `vendorColors`, image state, todo state, handlers, utility functions, `onClose`
  - Features: Four nested views (vehicle detail/edit, project detail/edit), project list, total spent calculations, maintenance info, image upload
  - Imports: React, many Lucide icons, ProjectDetailView, ProjectEditForm, LinkedPartsSection, PrimaryButton, inputClasses, multiple utility functions

#### Phase 4: Tab Components (`/components/tabs`)

- **`PartsTab.js`** (~1167 lines) - Parts table with filtering and sorting
  - Props: `tabContentRef`, `stats`, `filteredParts`, `darkMode`, filter/sort state, `projects`, `vehicles`, `vendorColors`, handlers, utility functions
  - Features: Statistics cards, cost breakdown, search, desktop table view, mobile card view, status/project dropdowns
  - Includes internal components: StatusDropdown, ProjectDropdown
  - Imports: React hooks, Lucide icons, PriceDisplay, colorUtils, trackingUtils

- **`ProjectsTab.js`** (~733 lines) - Project listing and management
  - Props: `tabContentRef`, `previousTab`, `projects`, `parts`, `vehicles`, `darkMode`, vehicle filter state, archive state, drag/drop state, modal state, handlers
  - Features: Vehicle filter dropdown, draggable project cards, budget progress, todo counters, archive section with drop zones
  - Imports: React, Lucide icons, colorUtils, dataUtils

- **`VehiclesTab.js`** (~553 lines) - Vehicle listing and management
  - Props: `tabContentRef`, `vehicles`, `projects`, `parts`, `darkMode`, drag/drop state, archive state, modal state, handlers
  - Features: Draggable vehicle cards with images, associated projects display, archive section with drop zones
  - Imports: React, Lucide icons, colorUtils

## New File Structure

```
/shako
├── app/
│   ├── globals.css
│   └── layout.js (imports custom.css)
├── components/
│   ├── Shako.js (originally 9,512 lines → now ~1,400 lines after Phase 5!)
│   ├── modals/
│   │   ├── AddPartModal.js ✓ (Phase 3)
│   │   ├── TrackingModal.js ✓ (Phase 3)
│   │   ├── PartDetailModal.js ✓ (Phase 3)
│   │   ├── AddProjectModal.js ✓ (Phase 3)
│   │   ├── ProjectDetailModal.js ✓ (Phase 3)
│   │   ├── AddVehicleModal.js ✓ (Phase 3)
│   │   └── VehicleDetailModal.js ✓ (Phase 3)
│   ├── tabs/
│   │   ├── PartsTab.js ✓ (Phase 4)
│   │   ├── ProjectsTab.js ✓ (Phase 4)
│   │   └── VehiclesTab.js ✓ (Phase 4)
│   └── ui/
│       ├── ConfirmDialog.js ✓ (Phase 1)
│       ├── PrimaryButton.js ✓ (Phase 1)
│       ├── PriceDisplay.js ✓ (Phase 1)
│       ├── VendorSelect.js ✓ (Phase 1)
│       ├── ProjectDetailView.js ✓ (Phase 2)
│       ├── ProjectEditForm.js ✓ (Phase 2)
│       └── LinkedPartsSection.js ✓ (Phase 2)
├── hooks/
│   ├── useDarkMode.js ✓ (Phase 5)
│   ├── useFilters.js ✓ (Phase 5)
│   ├── useModals.js ✓ (Phase 5)
│   ├── useDragDrop.js ✓ (Phase 5)
│   ├── useParts.js ✓ (Phase 5)
│   ├── useProjects.js ✓ (Phase 5)
│   └── useVehicles.js ✓ (Phase 5)
├── styles/
│   └── custom.css ✓
├── utils/
│   ├── colorUtils.js ✓
│   ├── dataUtils.js ✓
│   ├── styleUtils.js ✓
│   └── trackingUtils.js ✓
└── REFACTORING.md (this file)
```

## Usage Examples

### Importing Utilities

```javascript
// Color utilities
import {
  getStatusColors,
  getPriorityColors,
  getVendorColor,
  hexToRgba
} from '../utils/colorUtils';

// Style utilities
import {
  cardBg,
  primaryText,
  inputClasses
} from '../utils/styleUtils';

// Data utilities
import {
  calculateVehicleTotalSpent,
  calculateProjectTotal
} from '../utils/dataUtils';

// Tracking utilities
import {
  getTrackingUrl,
  getCarrierName
} from '../utils/trackingUtils';
```

### Using UI Components

```javascript
// Phase 1 Components
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PrimaryButton from '../components/ui/PrimaryButton';
import PriceDisplay from '../components/ui/PriceDisplay';
import VendorSelect from '../components/ui/VendorSelect';

// Phase 2 Components
import ProjectDetailView from '../components/ui/ProjectDetailView';
import ProjectEditForm from '../components/ui/ProjectEditForm';
import LinkedPartsSection from '../components/ui/LinkedPartsSection';

// Phase 3 Modal Components
import AddPartModal from '../components/modals/AddPartModal';
import TrackingModal from '../components/modals/TrackingModal';
import PartDetailModal from '../components/modals/PartDetailModal';
import AddProjectModal from '../components/modals/AddProjectModal';
import ProjectDetailModal from '../components/modals/ProjectDetailModal';
import AddVehicleModal from '../components/modals/AddVehicleModal';
import VehicleDetailModal from '../components/modals/VehicleDetailModal';

// In your component
<ConfirmDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={handleConfirm}
  title="Delete Item?"
  message="This action cannot be undone."
  darkMode={darkMode}
/>

<PrimaryButton
  onClick={handleClick}
  icon={Plus}
  disabled={loading}
>
  Add New Item
</PrimaryButton>

<PriceDisplay
  amount={totalCost}
  className="text-2xl font-bold"
  darkMode={darkMode}
/>

<VendorSelect
  value={selectedVendor}
  onChange={setSelectedVendor}
  darkMode={darkMode}
  uniqueVendors={vendors}
/>

<ProjectDetailView
  project={currentProject}
  parts={parts}
  darkMode={darkMode}
  updateProject={updateProject}
  // ... other props
/>

<ProjectEditForm
  project={editableProject}
  onProjectChange={handleProjectChange}
  vehicles={vehicles}
  darkMode={darkMode}
  // ... other props
/>

<LinkedPartsSection
  projectId={project.id}
  parts={parts}
  unlinkPartFromProject={handleUnlink}
  darkMode={darkMode}
  // ... other props
/>
```

#### Phase 5: Custom Hooks (`/hooks`)

All state management has been extracted into custom hooks:

- **`useDarkMode.js`** (~80 lines) - Dark mode state with localStorage persistence
  - Features: SSR-safe initialization, system preference fallback, scrollbar styling
  - Returns: `darkMode`, `setDarkMode`, `darkModeInitialized`, `mounted`

- **`useFilters.js`** (~150 lines) - All filter and sort state
  - Parts filters: search, delivered, status, vendor, date, sort
  - Project filters: vehicle filter
  - Archive states with localStorage persistence
  - Returns: All filter state + setters + dropdown management

- **`useModals.js`** (~200 lines) - Modal visibility and state
  - All modal open/closed states
  - Modal data (viewing/editing items, form state)
  - Modal animations and body scroll locking
  - Returns: All modal state + `handleCloseModal` + refs

- **`useDragDrop.js`** (~300 lines) - Drag and drop logic
  - Project and vehicle reordering
  - Archive zone drop handling
  - Drag state management
  - Requires: data hooks for updates
  - Returns: All drag state + handlers

- **`useParts.js`** (~500 lines) - Parts data and CRUD
  - Load, add, update, delete parts
  - Vendor management (load, update color, rename, delete)
  - Tracking info management
  - Part-project linking
  - Returns: Parts state + all CRUD operations

- **`useProjects.js`** (~180 lines) - Projects data and CRUD
  - Load, add, update, delete projects
  - Auto-calculate status from todos
  - Display order management
  - Vehicle-project relationships
  - Returns: Projects state + all CRUD operations

- **`useVehicles.js`** (~250 lines) - Vehicles data and CRUD
  - Load, add, update, delete vehicles
  - Image upload to Supabase storage
  - Drag & drop image handling
  - Display order management
  - Returns: Vehicles state + all CRUD operations + image handlers

## 🚧 Remaining Work

### Phase 6: Additional Improvements

- Extract Supabase API calls into dedicated service layer (`/services` or `/api`)
- Create typed interfaces/PropTypes for better type safety
- Add unit tests for utility functions
- Add component-level tests
- Consider Zustand/Redux for global state management
- Implement code splitting for performance optimization

## Benefits Achieved So Far

1. **Dramatically Improved Maintainability** - All code is now in focused, single-purpose files
2. **Better Reusability** - All components and hooks can be imported and used anywhere
3. **Easier Testing** - Every module (utils, hooks, components, modals, tabs) can be tested in isolation
4. **Cleaner Imports** - Clear dependency structure with organized folders (utils, hooks, ui, modals, tabs)
5. **Better IDE Performance** - Much smaller files load and parse faster
6. **Massively Reduced Complexity** - Main component is now 85% smaller (9,512 → ~1,400 lines!)
7. **Modular Architecture** - Perfect separation of concerns:
   - **Utilities**: Pure functions for colors, styles, data calculations, tracking
   - **Hooks**: State management and business logic
   - **UI Components**: Reusable presentational components
   - **Modals**: Complex form and detail views
   - **Tabs**: Feature-specific views
   - **Main Component**: Orchestration and rendering only
8. **Foundation for Growth** - Established patterns for hooks and components
9. **State Management** - All state is organized by domain (parts, projects, vehicles, filters, modals)
10. **Clean Hook Dependencies** - Hooks are composable and can depend on each other (e.g., useDragDrop uses data hooks)

## Next Steps

1. ✅ ~~Extract `ProjectDetailView`, `ProjectEditForm`, and `LinkedPartsSection`~~ (Phase 2 Complete)
2. ✅ ~~Extract all 7 modal components~~ (Phase 3 Complete)
3. ✅ ~~Extract tab components - VehiclesTab, ProjectsTab, PartsTab~~ (Phase 4 Complete)
4. ✅ ~~Create custom hooks for state management~~ (Phase 5 Complete)
5. Extract Supabase API calls into service layer (Phase 6)
6. Add comprehensive testing (Phase 6)

## Migration Strategy

To avoid breaking changes, the refactoring follows this approach:

1. ✅ **Extract utilities** - No runtime changes, just reorganization (Phase 1 Complete)
2. ✅ **Extract simple UI components** - Self-contained, minimal dependencies (Phase 1 Complete)
3. ✅ **Extract complex UI components** - Careful prop drilling analysis (Phase 2 Complete)
4. ✅ **Extract modal components** - 7 modals extracted with all props preserved (Phase 3 Complete)
5. ✅ **Extract tab components** - Self-contained view sections with internal components (Phase 4 Complete)
6. ✅ **Extract state management** - 7 custom hooks for all state and logic (Phase 5 Complete)
7. 🚧 **Extract API layer** - Centralize Supabase operations (Phase 6)
8. 🚧 **Add testing** - Comprehensive test coverage (Phase 6)

## Notes

- All extracted code maintains 100% backward compatibility
- No functionality has been changed, only reorganized
- The `Shako.js` file has been reduced from **9,512 lines to ~1,400 lines** (85% reduction!)
- **Phase 1:** Extracted utilities and simple UI components (588 lines removed)
- **Phase 2:** Extracted complex components: ProjectDetailView, ProjectEditForm, LinkedPartsSection (~1,228 lines removed)
- **Phase 3:** Extracted all 7 modal components (~3,458 lines removed, including inline JSX)
  - AddPartModal (257 lines)
  - TrackingModal (80 lines)
  - AddProjectModal (279 lines)
  - AddVehicleModal (473 lines)
  - PartDetailModal (827 lines - 3 views)
  - ProjectDetailModal (329 lines - 2 modes)
  - VehicleDetailModal (1213 lines - 4 nested views)
- **Phase 4:** Extracted all 3 tab components (~1,961 lines removed, including StatusDropdown and ProjectDropdown)
  - PartsTab (1167 lines - statistics, table view, mobile cards, 2 internal dropdowns)
  - ProjectsTab (733 lines - project grid, drag/drop, archive, vehicle filtering)
  - VehiclesTab (553 lines - vehicle grid, drag/drop, archive, associated projects)
- **Phase 5:** Extracted all state management into 7 custom hooks (~1,121 lines removed)
  - useDarkMode.js (80 lines - dark mode + localStorage + SSR handling)
  - useFilters.js (150 lines - all filter/sort state + localStorage)
  - useModals.js (200 lines - all modal state + body scroll lock)
  - useDragDrop.js (300 lines - project/vehicle drag & drop + archive zones)
  - useParts.js (500 lines - parts CRUD + vendor management + tracking)
  - useProjects.js (180 lines - projects CRUD + status calculation + ordering)
  - useVehicles.js (250 lines - vehicles CRUD + image upload + drag handlers)
- Custom CSS is now imported globally via `layout.js`
- All animations and custom styles are centralized in `custom.css`
- Modal components are cleanly organized in `/components/modals` directory
- Tab components are cleanly organized in `/components/tabs` directory
- Custom hooks are cleanly organized in `/hooks` directory
- Hooks follow single responsibility principle and are composable
- Main component now focuses on orchestration and rendering only

---

**Last Updated:** 2025-12-03
**Status:** Phase 5 Complete (State Management Extracted - 85% file size reduction achieved!)
