/**
 * Script to export demo data from Supabase for a specific user
 *
 * Usage: node scripts/exportDemoData.cjs
 *
 * Requires .env.local to be present with Supabase credentials
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// User ID to export data from
const USER_ID = '0bd9ca4e-7650-4e4e-8c57-6d6e0b5da658';

async function exportData() {
  console.log('Exporting demo data for user:', USER_ID);

  // Export vehicles
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', USER_ID)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });

  if (vehiclesError) {
    console.error('Error fetching vehicles:', vehiclesError);
    return;
  }
  console.log(`Found ${vehicles.length} vehicles`);

  // Export projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', USER_ID)
    .order('display_order', { ascending: true })
    .order('id', { ascending: true });

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return;
  }
  console.log(`Found ${projects.length} projects`);

  // Export parts
  const { data: parts, error: partsError } = await supabase
    .from('parts')
    .select('*')
    .eq('user_id', USER_ID)
    .order('id', { ascending: true });

  if (partsError) {
    console.error('Error fetching parts:', partsError);
    return;
  }
  console.log(`Found ${parts.length} parts`);

  // Export vendors
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', USER_ID)
    .order('name', { ascending: true });

  if (vendorsError) {
    console.error('Error fetching vendors:', vendorsError);
    return;
  }
  console.log(`Found ${vendors.length} vendors`);

  // Clean up the data - remove user_id and reassign IDs for demo
  const cleanVehicles = vehicles.map((v, index) => {
    const { user_id, ...rest } = v;
    return { ...rest, id: index + 1 };
  });

  // Create vehicle ID mapping for projects
  const vehicleIdMap = {};
  vehicles.forEach((v, index) => {
    vehicleIdMap[v.id] = index + 1;
  });

  const cleanProjects = projects.map((p, index) => {
    const { user_id, ...rest } = p;
    return {
      ...rest,
      id: index + 1,
      vehicle_id: p.vehicle_id ? vehicleIdMap[p.vehicle_id] : null
    };
  });

  // Create project ID mapping for parts
  const projectIdMap = {};
  projects.forEach((p, index) => {
    projectIdMap[p.id] = index + 1;
  });

  const cleanParts = parts.map((p, index) => {
    const { user_id, ...rest } = p;
    return {
      ...rest,
      id: index + 1,
      projectId: p.projectId ? projectIdMap[p.projectId] : null
    };
  });

  const cleanVendors = vendors.map((v, index) => {
    const { user_id, ...rest } = v;
    return { ...rest, id: index + 1 };
  });

  // Create the demo data file content
  const demoDataContent = `/**
 * Demo data for Shako demo mode
 * This data was exported from a real account and sanitized for demo purposes
 * Generated on: ${new Date().toISOString()}
 */

export const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@shako.app',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: null,
  },
};

export const DEMO_VEHICLES = ${JSON.stringify(cleanVehicles, null, 2)};

export const DEMO_PROJECTS = ${JSON.stringify(cleanProjects, null, 2)};

export const DEMO_PARTS = ${JSON.stringify(cleanParts, null, 2)};

export const DEMO_VENDORS = ${JSON.stringify(cleanVendors, null, 2)};
`;

  // Write to data/demoData.js
  const outputPath = path.resolve(__dirname, '../data/demoData.js');
  fs.writeFileSync(outputPath, demoDataContent);
  console.log(`\nDemo data exported to: ${outputPath}`);
}

exportData().catch(console.error);
