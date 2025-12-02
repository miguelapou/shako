# Shako Refactoring Guide

## Overview

This document describes the ongoing refactoring of the Shako application from a monolithic 9,512-line component into a modular, maintainable codebase.

## Current Status

### ✅ Completed

#### 1. Utility Functions (`/utils`)

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

#### 2. Styles (`/styles`)

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

#### 3. UI Components (`/components/ui`)

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

## New File Structure

```
/shako
├── app/
│   ├── globals.css
│   └── layout.js (imports custom.css)
├── components/
│   ├── Shako.js (9,512 lines - to be refactored)
│   └── ui/
│       ├── ConfirmDialog.js ✓
│       ├── PrimaryButton.js ✓
│       ├── PriceDisplay.js ✓
│       └── VendorSelect.js ✓
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
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PrimaryButton from '../components/ui/PrimaryButton';
import PriceDisplay from '../components/ui/PriceDisplay';
import VendorSelect from '../components/ui/VendorSelect';

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
```

## 🚧 Remaining Work

### Phase 2: Large Component Extraction

The following components are still embedded in `Shako.js` and should be extracted:

#### Complex Components (still in Shako.js)
- **`ProjectDetailView`** (~900 lines) - Project details with todos and parts
- **`ProjectEditForm`** (~200 lines) - Project editing form
- **`LinkedPartsSection`** (~100 lines) - Display parts linked to project

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

### Phase 3: State Management

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

### Phase 4: Additional Improvements

- Extract Supabase API calls into dedicated service layer (`/services` or `/api`)
- Create typed interfaces/PropTypes for better type safety
- Add unit tests for utility functions
- Add component-level tests
- Consider Zustand/Redux for global state management
- Implement code splitting for performance optimization

## Benefits Achieved So Far

1. **Improved Maintainability** - Utilities and simple components are now in focused files
2. **Better Reusability** - Components can be imported and used anywhere
3. **Easier Testing** - Utilities can be tested in isolation
4. **Cleaner Imports** - Clear dependency structure
5. **Better IDE Performance** - Smaller files load and parse faster
6. **Foundation for Growth** - Pattern established for continued refactoring

## Next Steps

1. Extract `ProjectDetailView` as it's the largest self-contained component
2. Extract modal components one by one
3. Create custom hooks for state management
4. Refactor main `Shako.js` to use all extracted modules
5. Add comprehensive testing

## Migration Strategy

To avoid breaking changes, the refactoring follows this approach:

1. ✅ **Extract utilities** - No runtime changes, just reorganization
2. ✅ **Extract simple UI components** - Self-contained, minimal dependencies
3. 🚧 **Extract complex components** - Requires careful prop drilling analysis
4. 🚧 **Extract state management** - Requires understanding data flow
5. 🚧 **Refactor main component** - Final step to tie everything together

## Notes

- All extracted code maintains 100% backward compatibility
- No functionality has been changed, only reorganized
- The `Shako.js` file still contains the original code (still needs refactoring)
- Custom CSS is now imported globally via `layout.js`
- All animations and custom styles are centralized in `custom.css`

---

**Last Updated:** 2025-12-02
**Status:** Phase 1 Complete (Utilities & Simple Components Extracted)
