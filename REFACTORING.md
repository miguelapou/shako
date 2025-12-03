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
│   ├── ErrorBoundary.js ✓ (Phase 7)
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
│       ├── LinkedPartsSection.js ✓ (Phase 2)
│       ├── Toast.js ✓ (Phase 7)
│       └── ToastContainer.js ✓ (Phase 7)
├── hooks/
│   ├── useDarkMode.js ✓ (Phase 5)
│   ├── useFilters.js ✓ (Phase 5)
│   ├── useModals.js ✓ (Phase 5)
│   ├── useDragDrop.js ✓ (Phase 5)
│   ├── useParts.js ✓ (Phase 5, updated Phase 6)
│   ├── useProjects.js ✓ (Phase 5, updated Phase 6)
│   ├── useVehicles.js ✓ (Phase 5, updated Phase 6)
│   └── useToast.js ✓ (Phase 7)
├── services/
│   ├── partsService.js ✓ (Phase 6, enhanced Phase 7)
│   ├── vendorsService.js ✓ (Phase 6, enhanced Phase 7)
│   ├── projectsService.js ✓ (Phase 6, enhanced Phase 7)
│   └── vehiclesService.js ✓ (Phase 6, enhanced Phase 7)
├── styles/
│   └── custom.css ✓
├── utils/
│   ├── colorUtils.js ✓ (Phase 1)
│   ├── dataUtils.js ✓ (Phase 1)
│   ├── errorHandler.js ✓ (Phase 7)
│   ├── styleUtils.js ✓ (Phase 1)
│   └── trackingUtils.js ✓ (Phase 1)
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

### Using Service Layer

```javascript
// Phase 6 Services
import * as partsService from '../services/partsService';
import * as vendorsService from '../services/vendorsService';
import * as projectsService from '../services/projectsService';
import * as vehiclesService from '../services/vehiclesService';

// Example usage in a hook or component
const loadData = async () => {
  try {
    const parts = await partsService.getAllParts();
    const projects = await projectsService.getAllProjects();
    const vehicles = await vehiclesService.getAllVehicles();
    const vendors = await vendorsService.getAllVendors();
    // Process data...
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

// Create operations
const addPart = async (partData) => {
  try {
    const newPart = await partsService.createPart(partData);
    return newPart;
  } catch (error) {
    console.error('Error creating part:', error);
  }
};

// Update operations
const updatePart = async (partId, updates) => {
  try {
    await partsService.updatePart(partId, updates);
  } catch (error) {
    console.error('Error updating part:', error);
  }
};

// Delete operations
const deletePart = async (partId) => {
  try {
    await partsService.deletePart(partId);
  } catch (error) {
    console.error('Error deleting part:', error);
  }
};

// Image upload
const uploadImage = async (file) => {
  try {
    const publicUrl = await vehiclesService.uploadVehicleImage(file);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};
```

### Using Error Handling (Phase 7)

```javascript
// Wrap your app with ErrorBoundary (in layout.js or app root)
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// Use toast notifications in components
import useToast from '../hooks/useToast';
import { ToastContainer } from '../components/ui/ToastContainer';

function MyComponent() {
  const { toasts, success, error, warning, info } = useToast();

  const handleSave = async () => {
    try {
      await partsService.createPart(partData);
      success('Part added successfully!');
    } catch (err) {
      error('Failed to add part. Please try again.');
    }
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <ToastContainer toasts={toasts} darkMode={darkMode} />
    </>
  );
}

// Use error handler utility for advanced error handling
import { handleError, getUserFriendlyMessage, retryWithBackoff } from '../utils/errorHandler';

// Get user-friendly error messages
try {
  await partsService.getAllParts();
} catch (error) {
  const friendlyMessage = getUserFriendlyMessage(error, 'loading parts');
  error(friendlyMessage);
}

// Use retry logic for transient errors
const data = await retryWithBackoff(
  async () => await partsService.getAllParts(),
  { maxRetries: 3, initialDelay: 1000 }
);

// Comprehensive error handling with options
try {
  await partsService.updatePart(id, updates);
} catch (err) {
  handleError(err, {
    operation: 'updating part',
    showToast: true,
    logToConsole: true,
    context: { partId: id, updates }
  });
}
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

#### Phase 6: Service Layer (`/services`)

All Supabase API calls have been extracted into dedicated service modules:

- **`partsService.js`** (~130 lines) - Parts table operations
  - `getAllParts()` - Fetch all parts with ordering
  - `createPart(partData)` - Insert new part
  - `updatePart(partId, updates)` - Update part by ID
  - `deletePart(partId)` - Delete part by ID
  - `updatePartsVendor(oldName, newName)` - Bulk rename vendor
  - `removeVendorFromParts(vendorName)` - Remove vendor from all parts
  - All functions include comprehensive error handling (Phase 7)

- **`vendorsService.js`** (~50 lines) - Vendors table operations
  - `getAllVendors()` - Fetch all vendors ordered by name
  - `upsertVendor(vendorName, color)` - Insert or update vendor
  - Supports vendor color customization
  - Enhanced with error handling (Phase 7)

- **`projectsService.js`** (~110 lines) - Projects table operations
  - `getAllProjects()` - Fetch all projects with ordering
  - `createProject(projectData)` - Insert new project
  - `updateProject(projectId, updates)` - Update project by ID
  - `deleteProject(projectId)` - Delete project by ID
  - `updateProjectDisplayOrder(projectId, displayOrder)` - Update drag & drop order
  - All operations wrapped in try-catch with contextual errors (Phase 7)

- **`vehiclesService.js`** (~145 lines) - Vehicles table and storage operations
  - `getAllVehicles()` - Fetch all vehicles with ordering
  - `createVehicle(vehicleData)` - Insert new vehicle
  - `updateVehicle(vehicleId, updates)` - Update vehicle by ID
  - `deleteVehicle(vehicleId)` - Delete vehicle by ID
  - `updateVehicleDisplayOrder(vehicleId, displayOrder)` - Update drag & drop order
  - `uploadVehicleImage(file)` - Upload image to Supabase Storage and return public URL
  - Comprehensive error handling for all operations (Phase 7)

#### Phase 7: Error Handling Infrastructure (`/utils`, `/components`, `/hooks`)

Comprehensive error handling and user feedback system:

- **`ErrorBoundary.js`** (~120 lines) - React error boundary component
  - Catches React rendering errors in child components
  - Displays user-friendly fallback UI
  - Provides reload functionality
  - Includes development-only error details
  - Logs errors with component stack traces

- **`utils/errorHandler.js`** (~200 lines) - Centralized error utilities
  - `ErrorType` enum - Categorizes errors (NETWORK, DATABASE, VALIDATION, AUTHENTICATION, etc.)
  - `getErrorType(error)` - Detects error type from error object
  - `getUserFriendlyMessage(error, operation)` - Converts technical errors to user-friendly messages
  - `logError(error, context)` - Logs errors with contextual information
  - `handleError(error, options)` - Main error handling function
  - `isRetryableError(error)` - Determines if error can be retried
  - `retryWithBackoff(fn, options)` - Retry logic with exponential backoff
  - All error messages are contextual and user-friendly

- **`components/ui/Toast.js`** (~100 lines) - Toast notification component
  - Individual toast with auto-dismiss
  - Types: success, error, warning, info
  - Customizable duration
  - Dark mode support
  - Animated entrance/exit
  - Manual dismiss button

- **`components/ui/ToastContainer.js`** (~40 lines) - Toast container
  - Fixed position container for multiple toasts
  - Stacked layout with proper spacing
  - Handles toast lifecycle

- **`hooks/useToast.js`** (~100 lines) - Toast management hook
  - `success(message, duration)` - Show success toast
  - `error(message, duration)` - Show error toast
  - `warning(message, duration)` - Show warning toast
  - `info(message, duration)` - Show info toast
  - `dismissToast(id)` - Dismiss specific toast
  - `dismissAll()` - Clear all toasts
  - Returns array of active toasts for rendering

**Enhanced Service Layer Error Handling:**
- All service functions wrapped in try-catch blocks
- Contextual error messages (e.g., "Failed to load parts: ...")
- `@throws {Error}` JSDoc annotations
- Errors enriched with operation context before throwing

## 🚧 Future Enhancements

### Phase 8: Testing & Type Safety (Future)

- 🚧 Create typed interfaces/PropTypes for better type safety
- 🚧 Add unit tests for utility functions
- 🚧 Add unit tests for service layer
- 🚧 Add integration tests for hooks
- 🚧 Add component-level tests
- 🚧 Consider Zustand/Redux for global state management
- 🚧 Implement code splitting for performance optimization
- 🚧 Add request caching and optimistic updates

## Benefits Achieved So Far

1. **Dramatically Improved Maintainability** - All code is now in focused, single-purpose files
2. **Better Reusability** - All components and hooks can be imported and used anywhere
3. **Easier Testing** - Every module (utils, hooks, components, modals, tabs, services) can be tested in isolation
4. **Cleaner Imports** - Clear dependency structure with organized folders (utils, hooks, ui, modals, tabs, services)
5. **Better IDE Performance** - Much smaller files load and parse faster
6. **Massively Reduced Complexity** - Main component is now 85% smaller (9,512 → ~1,400 lines!)
7. **Modular Architecture** - Perfect separation of concerns:
   - **Utilities**: Pure functions for colors, styles, data calculations, tracking, error handling
   - **Services**: Database operations and external API calls (Supabase)
   - **Hooks**: State management and business logic
   - **UI Components**: Reusable presentational components
   - **Modals**: Complex form and detail views
   - **Tabs**: Feature-specific views
   - **Main Component**: Orchestration and rendering only
8. **Foundation for Growth** - Established patterns for hooks, components, and services
9. **State Management** - All state is organized by domain (parts, projects, vehicles, filters, modals)
10. **Clean Hook Dependencies** - Hooks are composable and can depend on each other (e.g., useDragDrop uses data hooks)
11. **Centralized API Layer** - All Supabase operations are in one place, making it easier to:
    - Switch databases or add caching
    - Mock API calls for testing
    - Add error handling and retry logic
    - Monitor and log database operations
    - Implement optimistic updates
12. **Comprehensive Error Handling** - Robust error infrastructure with:
    - React error boundaries for catching rendering errors
    - User-friendly error messages with contextual information
    - Toast notification system for non-intrusive feedback
    - Centralized error utilities with categorization
    - Retry logic with exponential backoff for transient errors
    - Service layer enriched with contextual error messages

## Next Steps

1. ✅ ~~Extract `ProjectDetailView`, `ProjectEditForm`, and `LinkedPartsSection`~~ (Phase 2 Complete)
2. ✅ ~~Extract all 7 modal components~~ (Phase 3 Complete)
3. ✅ ~~Extract tab components - VehiclesTab, ProjectsTab, PartsTab~~ (Phase 4 Complete)
4. ✅ ~~Create custom hooks for state management~~ (Phase 5 Complete)
5. ✅ ~~Extract Supabase API calls into service layer~~ (Phase 6 Complete)
6. ✅ ~~Implement comprehensive error handling infrastructure~~ (Phase 7 Complete)
7. Add comprehensive testing (Future - Phase 8)
8. Add TypeScript or PropTypes for type safety (Future - Phase 8)
9. Consider state management library like Zustand (Future - Phase 8)

## Migration Strategy

To avoid breaking changes, the refactoring follows this approach:

1. ✅ **Extract utilities** - No runtime changes, just reorganization (Phase 1 Complete)
2. ✅ **Extract simple UI components** - Self-contained, minimal dependencies (Phase 1 Complete)
3. ✅ **Extract complex UI components** - Careful prop drilling analysis (Phase 2 Complete)
4. ✅ **Extract modal components** - 7 modals extracted with all props preserved (Phase 3 Complete)
5. ✅ **Extract tab components** - Self-contained view sections with internal components (Phase 4 Complete)
6. ✅ **Extract state management** - 7 custom hooks for all state and logic (Phase 5 Complete)
7. ✅ **Extract API layer** - Centralized all Supabase operations into service modules (Phase 6 Complete)
8. ✅ **Add error handling** - Error boundaries, toast system, and error utilities (Phase 7 Complete)
9. 🚧 **Add testing** - Comprehensive test coverage (Future - Phase 8)
10. 🚧 **Add type safety** - TypeScript or PropTypes (Future - Phase 8)

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
- **Phase 6:** Extracted all Supabase API calls into service layer (~315 lines of service code)
  - partsService.js (95 lines - parts table CRUD + vendor operations)
  - vendorsService.js (35 lines - vendors table operations)
  - projectsService.js (75 lines - projects table CRUD + ordering)
  - vehiclesService.js (110 lines - vehicles table CRUD + ordering + image storage)
  - Updated all 3 data hooks (useParts, useProjects, useVehicles) to use services
  - Hooks no longer import supabase directly - only service functions
  - Centralized database access for easier testing, mocking, and future migrations
- **Phase 7:** Implemented comprehensive error handling infrastructure (~560 lines of error handling code)
  - ErrorBoundary.js (120 lines - React error boundary for catching rendering errors)
  - errorHandler.js (200 lines - centralized error utilities with type detection, user-friendly messages, retry logic)
  - Toast.js + ToastContainer.js (140 lines - non-intrusive toast notification system)
  - useToast.js (100 lines - hook for managing toast state with success/error/warning/info methods)
  - Enhanced all 4 service layer files with comprehensive error handling:
    - All operations wrapped in try-catch blocks
    - Contextual error messages added (e.g., "Failed to load parts: ...")
    - `@throws {Error}` JSDoc annotations added
    - Errors enriched with operation context before throwing
  - partsService.js updated to 130 lines with error handling
  - vendorsService.js updated to 50 lines with error handling
  - projectsService.js updated to 110 lines with error handling
  - vehiclesService.js updated to 145 lines with error handling
- Custom CSS is now imported globally via `layout.js`
- All animations and custom styles are centralized in `custom.css`
- Modal components are cleanly organized in `/components/modals` directory
- Tab components are cleanly organized in `/components/tabs` directory
- Custom hooks are cleanly organized in `/hooks` directory
- Service modules are cleanly organized in `/services` directory
- Hooks follow single responsibility principle and are composable
- Services are pure functions that return Promises and throw enriched errors
- Error handling is comprehensive and user-friendly across all layers
- Main component now focuses on orchestration and rendering only

---

**Last Updated:** 2025-12-03
**Status:** Phase 7 Complete (Error Handling Infrastructure - Production-ready error management!)
