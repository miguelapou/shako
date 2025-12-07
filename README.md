# Shako

A comprehensive web application for tracking vehicle restoration parts, managing projects, and organizing vehicle maintenance information. Built with Next.js and Supabase.

## Features

### Vehicle Management
- Create and manage vehicles with detailed information (name, year, VIN, license plate, color)
- Upload vehicle images with drag-and-drop support
- Track odometer readings with configurable units (km/miles)
- Document storage for vehicle-related files (receipts, manuals, etc.)
- Comprehensive maintenance tracking:
  - Oil type, capacity, brand, and filter
  - Air filter and fuel filter details
  - Drain plug specifications
  - Battery information
  - Insurance policy tracking
- Archive vehicles to declutter your active list
- Drag-and-drop reordering with archive drop zones
- View total parts count and costs per vehicle

### Project Management
- Create projects linked to specific vehicles
- Set project priority (low, medium, high) with color-coded badges
- Budget tracking with spent vs. budget comparison
- Auto-calculated project status: Planning → In Progress → Completed
- Built-in todo list with:
  - Add, edit, and delete tasks
  - Mark tasks complete with timestamps
  - Smooth animations for task changes
  - Show/hide completed tasks toggle
- Pause and resume projects
- Archive projects when complete
- Drag-and-drop reordering
- Filter projects by vehicle

### Parts Tracking
- Add parts individually or bulk import via CSV
- Track part details: name, part number, vendor, price, shipping, duties
- Automatic total cost calculation
- Status workflow: Pending → Purchased → Shipped → Delivered
- Tracking number support with auto-detected carrier links:
  - UPS, FedEx, USPS, DHL, Amazon
  - Orange Connex, ECMS
- Link parts to projects for organized tracking
- Statistics dashboard showing:
  - Part counts by status
  - Progress bar visualization
  - Cost breakdown (price, shipping, duties, total)

### Vendor Management
- Automatic vendor extraction from parts
- Custom color coding for each vendor
- Rename vendors across all parts
- View part counts per vendor
- Color-coded vendor badges throughout the app

### Search, Filter & Sort
- Full-text search across parts, projects, and vehicles
- Filter parts by:
  - Status (pending, purchased, shipped, delivered)
  - Vendor
  - Date range (1 week, 2 weeks, 1 month)
  - Delivered status (show/hide/only)
- Sortable columns with direction indicators
- Pagination with configurable rows per page

### User Interface
- Dark mode with persistent preference
- Responsive design for mobile, tablet, and desktop
- Tab navigation with swipe support on mobile
- Smooth animations and transitions
- Drag-and-drop reordering for vehicles and projects
- Modal system for all CRUD operations
- Unsaved changes detection with confirmation dialogs
- Custom loading spinner with garage door animation
- Toast notifications for user feedback

### Authentication
- Google OAuth sign-in
- Secure session management
- User data isolation
- Account deletion option

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript
- **UI**: React 18, Tailwind CSS 3, Lucide React icons
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (vehicle images, documents)
- **Authentication**: Supabase Auth (Google OAuth)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/shako.git
   cd shako
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

Create the following tables in your Supabase project:

- **vehicles** - Vehicle information and maintenance details
- **projects** - Project data with todos (JSONB)
- **parts** - Parts with status, pricing, and tracking
- **vendor_colors** - Custom vendor color assignments

Create a storage bucket named `vehicles` for image and document uploads.

## Project Structure

```
shako/
├── app/                 # Next.js App Router
├── components/
│   ├── modals/          # Modal components
│   ├── tabs/            # Tab view components
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── services/            # Supabase service layer
├── utils/               # Utility functions
├── lib/                 # Supabase client
└── styles/              # Custom CSS
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## License

MIT
