/**
 * Script to migrate storage files from old user to new user
 *
 * This script copies files from the old user's storage paths to the new user's paths.
 * It requires a Supabase service role key to access all files.
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx OLD_USER_ID=xxx NEW_USER_ID=xxx node scripts/migrate-storage-files.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OLD_USER_ID = process.env.OLD_USER_ID;
const NEW_USER_ID = process.env.NEW_USER_ID;
const BUCKET_NAME = 'vehicles';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OLD_USER_ID || !NEW_USER_ID) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  OLD_USER_ID');
  console.error('  NEW_USER_ID');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function listFilesInPath(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path, { limit: 1000 });

  if (error) {
    console.error(`Error listing files in ${path}:`, error);
    return [];
  }

  return data || [];
}

async function copyFile(oldPath, newPath) {
  try {
    // Download the file from old path
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(oldPath);

    if (downloadError) {
      console.error(`  Error downloading ${oldPath}:`, downloadError);
      return false;
    }

    // Upload to new path
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newPath, fileData, {
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error(`  Error uploading to ${newPath}:`, uploadError);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`  Exception copying ${oldPath} to ${newPath}:`, err);
    return false;
  }
}

async function migrateFolder(folderType) {
  const oldPath = `${folderType}/${OLD_USER_ID}`;
  const newPath = `${folderType}/${NEW_USER_ID}`;

  console.log(`\nMigrating ${folderType}...`);
  console.log(`  From: ${oldPath}`);
  console.log(`  To:   ${newPath}`);

  // List files in old path
  const files = await listFilesInPath(oldPath);

  if (files.length === 0) {
    console.log(`  No files found in ${oldPath}`);
    return { copied: 0, failed: 0 };
  }

  console.log(`  Found ${files.length} files`);

  let copied = 0;
  let failed = 0;

  for (const file of files) {
    if (file.name === '.emptyFolderPlaceholder') continue;

    const oldFilePath = `${oldPath}/${file.name}`;
    const newFilePath = `${newPath}/${file.name}`;

    process.stdout.write(`  Copying ${file.name}... `);

    const success = await copyFile(oldFilePath, newFilePath);
    if (success) {
      console.log('OK');
      copied++;
    } else {
      console.log('FAILED');
      failed++;
    }
  }

  return { copied, failed };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Storage File Migration');
  console.log('='.repeat(60));
  console.log(`Old User ID: ${OLD_USER_ID}`);
  console.log(`New User ID: ${NEW_USER_ID}`);
  console.log(`Bucket: ${BUCKET_NAME}`);

  // Migrate vehicle-images
  const imagesResult = await migrateFolder('vehicle-images');

  // Migrate vehicle-documents
  const docsResult = await migrateFolder('vehicle-documents');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete');
  console.log('='.repeat(60));
  console.log(`Images: ${imagesResult.copied} copied, ${imagesResult.failed} failed`);
  console.log(`Documents: ${docsResult.copied} copied, ${docsResult.failed} failed`);

  if (imagesResult.failed > 0 || docsResult.failed > 0) {
    console.log('\nSome files failed to migrate. Please check the errors above.');
    process.exit(1);
  }

  console.log('\nAll files migrated successfully!');
  console.log('\nNote: The old files still exist. You can delete them manually');
  console.log('from the Supabase dashboard once you verify everything works.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
