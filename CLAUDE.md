# CLAUDE.md

This file provides guidance for Claude Code when working with this codebase.

## Project Overview

**Shako** is a vehicle restoration parts tracking web application. It allows users to:
- Track parts with delivery status (pending, purchased, shipped, delivered)
- Manage vendors with custom color coding
- Track costs including price, shipping, and duties
- Organize parts into projects linked to vehicles
- Manage vehicles with maintenance details and images

## Tech Stack

- **Framework**: Next.js 14 (App Router with 'use client' components)
- **Language**: JavaScript (no TypeScript)
- **UI**: React 18, Tailwind CSS 3, Lucide React icons
- **Database**: Supabase (PostgreSQL + Storage)
- **State**: React hooks (useState, useMemo, useEffect, useRef)

## Project Structure

```
shako/
├── app/
│   ├── layout.js          # Root layout with fonts and metadata
│   └── page.js            # Entry point, renders <Shako />
├── components/
│   ├── Shako.js           # Main application component (1500+ lines)
│   ├── ErrorBoundary.js   # Error boundary wrapper
│   ├── modals/            # Modal components (AddPartModal, VehicleDetailModal, etc.)
│   ├── tabs/              # Tab components (PartsTab, ProjectsTab, VehiclesTab)
│   └── ui/                # Reusable UI components (PrimaryButton, ConfirmDialog, etc.)
├── hooks/                 # Custom React hooks
│   ├── useDarkMode.js     # Dark mode toggle with localStorage
│   ├── useDragDrop.js     # Drag and drop for reordering
│   ├── useFilters.js      # Search, sort, and filter state
│   ├── useModals.js       # Modal visibility and state
│   ├── useParts.js        # Parts CRUD and vendor operations
│   ├── useProjects.js     # Projects CRUD operations
│   └── useVehicles.js     # Vehicles CRUD and image upload
├── services/              # Supabase service layer
│   ├── partsService.js    # Parts database operations
│   ├── projectsService.js # Projects database operations
│   ├── vehiclesService.js # Vehicles database operations
│   └── vendorsService.js  # Vendor colors database operations
├── utils/                 # Utility functions
│   ├── colorUtils.js      # Color manipulation and status colors
│   ├── dataUtils.js       # Cost calculations
│   ├── errorHandler.js    # Error handling utilities
│   ├── styleUtils.js      # Tailwind class helpers for dark mode
│   └── trackingUtils.js   # Carrier detection and tracking URLs
├── lib/
│   └── supabase.js        # Supabase client initialization
└── styles/
    └── custom.css         # Custom CSS animations and styles
```

## Database Schema (Supabase)

### Tables

**parts**
- `id`, `part`, `partNumber`, `vendor`, `price`, `shipping`, `duties`, `total`
- `purchased`, `shipped`, `delivered` (boolean status flags)
- `tracking`, `projectId`, `createdAt`

**projects**
- `id`, `name`, `description`, `budget`, `priority`
- `vehicle_id` (FK to vehicles)
- `todos` (JSONB array), `archived`, `paused`, `display_order`

**vehicles**
- `id`, `name`, `nickname`, `year`, `license_plate`, `vin`
- `color`, `image_url`, `archived`, `display_order`
- Maintenance fields: `fuel_filter`, `air_filter`, `oil_filter`, `oil_type`, `oil_capacity`, `oil_brand`, `drain_plug`, `battery`, `insurance_policy`

**vendor_colors**
- `id`, `vendor_name`, `color`

### Storage
- `vehicles` bucket for vehicle images at `vehicle-images/` path

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## Architecture Patterns

### Component Organization
- Main app logic lives in `components/Shako.js` which orchestrates all hooks
- UI is split into three tabs: Vehicles, Projects, Parts
- Modals handle create/edit/view operations for each entity
- Custom hooks encapsulate data fetching and state management

### Service Layer
- All Supabase calls go through `services/*.js` files
- Services provide consistent error handling with contextual messages
- Hooks consume services and manage local state

### State Management
- Dark mode preference persisted to localStorage
- Archive collapse state persisted to localStorage
- Filter/sort state managed in `useFilters` hook
- Modal state managed in `useModals` hook

### Styling Conventions
- Dark mode support via conditional Tailwind classes
- `styleUtils.js` provides dark-mode-aware class helpers
- Custom 800px breakpoint for responsive design (uses 948px)
- Animations defined in `custom.css`

## Key Patterns to Follow

1. **Dark Mode**: Always handle both modes using `darkMode` prop:
   ```jsx
   className={darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
   ```

2. **Error Handling**: Wrap service calls and add context:
   ```javascript
   try {
     await serviceFunction();
   } catch (error) {
     error.message = `Context: ${error.message}`;
     throw error;
   }
   ```

3. **Supabase Operations**: Use service layer, not direct calls

4. **Status Flow**: Parts follow: pending -> purchased -> shipped -> delivered

5. **Price Display**: Use `<PriceDisplay>` component for currency formatting
