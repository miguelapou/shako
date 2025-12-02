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

## New File Structure

```
/shako
├── app/
│   ├── globals.css
│   └── layout.js (imports custom.css)
├── components/
│   ├── Shako.js (originally 9,512 lines → now ~7,284 lines after Phase 2)
│   └── ui/
│       ├── ConfirmDialog.js ✓ (Phase 1)
│       ├── PrimaryButton.js ✓ (Phase 1)
│       ├── PriceDisplay.js ✓ (Phase 1)
│       ├── VendorSelect.js ✓ (Phase 1)
│       ├── ProjectDetailView.js ✓ (Phase 2)
│       ├── ProjectEditForm.js ✓ (Phase 2)
│       └── LinkedPartsSection.js ✓ (Phase 2)
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

## 🚧 Remaining Work

### Phase 3: Modal Component Extraction

#### Modal Components (still in Shako.js)
- **Vehicle Modals:**
  - `AddVehicleModal` - Vehicle creation form
  - `VehicleDetailModal` - Vehicle detail view with projects

- **Project Modals:**
  - `AddProjectModal` - Project creation form
  - `ProjectDetailModal` - Project detail view

- **Part Modals:**
  - `AddPartModal` - Part creation form
  - `PartDetailModal` - Part detail view
  - `TrackingModal` - Edit tracking information

#### Tab Components (still in Shako.js)
- `VehiclesTab` - Vehicle listing and management
- `ProjectsTab` - Project listing and management
- `PartsTab` - Parts table with filtering/sorting

### Phase 4: State Management

Extract state logic into custom hooks:

```
/hooks
├── useParts.js - Parts data + CRUD operations
├── useProjects.js - Projects data + CRUD operations
├── useVehicles.js - Vehicles data + CRUD operations
├── useDarkMode.js - Dark mode + localStorage sync
├── useFilters.js - Search/filter/sort state
├── useModals.js - Modal visibility state
└── useDragDrop.js - Drag & drop reordering
```

### Phase 5: Additional Improvements

- Extract Supabase API calls into dedicated service layer (`/services` or `/api`)
- Create typed interfaces/PropTypes for better type safety
- Add unit tests for utility functions
- Add component-level tests
- Consider Zustand/Redux for global state management
- Implement code splitting for performance optimization

## Benefits Achieved So Far

1. **Improved Maintainability** - Utilities, simple components, and complex components are now in focused files
2. **Better Reusability** - Components can be imported and used anywhere
3. **Easier Testing** - Utilities and components can be tested in isolation
4. **Cleaner Imports** - Clear dependency structure
5. **Better IDE Performance** - Smaller files load and parse faster (Shako.js reduced by ~2,228 lines)
6. **Reduced Complexity** - Main component is now 23% smaller (9,512 → ~7,284 lines)
7. **Foundation for Growth** - Pattern established for continued refactoring

## Next Steps

1. ✅ ~~Extract `ProjectDetailView`, `ProjectEditForm`, and `LinkedPartsSection`~~ (Phase 2 Complete)
2. Extract modal components one by one (Phase 3)
3. Extract tab components (Phase 3)
4. Create custom hooks for state management (Phase 4)
5. Extract Supabase API calls into service layer (Phase 5)
6. Add comprehensive testing (Phase 5)

## Migration Strategy

To avoid breaking changes, the refactoring follows this approach:

1. ✅ **Extract utilities** - No runtime changes, just reorganization (Phase 1 Complete)
2. ✅ **Extract simple UI components** - Self-contained, minimal dependencies (Phase 1 Complete)
3. ✅ **Extract complex components** - Careful prop drilling analysis (Phase 2 Complete)
4. 🚧 **Extract modal and tab components** - Self-contained UI sections (Phase 3)
5. 🚧 **Extract state management** - Requires understanding data flow (Phase 4)
6. 🚧 **Extract API layer** - Centralize Supabase operations (Phase 5)
7. 🚧 **Add testing** - Comprehensive test coverage (Phase 5)

## Notes

- All extracted code maintains 100% backward compatibility
- No functionality has been changed, only reorganized
- The `Shako.js` file has been reduced from 9,512 lines to ~7,284 lines (23% reduction)
- Phase 1: Extracted utilities and simple UI components (588 lines removed)
- Phase 2: Extracted complex components ProjectDetailView, ProjectEditForm, LinkedPartsSection (~1,228 lines removed)
- Custom CSS is now imported globally via `layout.js`
- All animations and custom styles are centralized in `custom.css`

---

**Last Updated:** 2025-12-02
**Status:** Phase 2 Complete (Complex Components Extracted)
