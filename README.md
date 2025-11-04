# Land Cruiser Parts Tracker

A web app to track your Land Cruiser restoration parts with status tracking, vendor management, and cost breakdown.

## Features

- Track parts with delivery status
- Vendor-specific color coding
- Tracking link integration
- Cost breakdown and statistics
- localStorage for data persistence
- Responsive design

## Deploy to Vercel

### Step 1: Install Vercel CLI (if you haven't already)

```bash
npm install -g vercel
```

### Step 2: Deploy

Navigate to the `land-cruiser-app` folder and run:

```bash
cd land-cruiser-app
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Choose your account
- **Link to existing project**: No
- **Project name**: land-cruiser-tracker (or your choice)
- **Directory**: `./` (current directory)
- **Build settings**: Accept defaults

### Step 3: Access Your App

After deployment, Vercel will provide a URL like:
`https://land-cruiser-tracker.vercel.app`

## Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub, GitLab, or Bitbucket
3. Click "Add New Project"
4. Import the `land-cruiser-app` folder
5. Vercel will auto-detect Next.js and deploy

## Local Development

```bash
cd land-cruiser-app
npm install
npm run dev
```

Visit `http://localhost:3000`

## Data Storage

Currently uses browser localStorage. Data is stored per device/browser.

To sync across devices, you would need to add a backend database (Firebase, Supabase, etc.)
