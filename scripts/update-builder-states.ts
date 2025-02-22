import { db } from '@/lib/db';

async function updateBuilderStates() {
  try {
    console.log('Starting builder states update...');

    // Check if columns exist
    const tableInfo = await db.execute(
      "PRAGMA table_info('builders')"
    );
    
    const columns = tableInfo.rows.map(row => row.name);
    
    // Add is_published column if it doesn't exist
    if (!columns.includes('is_published')) {
      console.log('Adding is_published column...');
      await db.execute(
        'ALTER TABLE builders ADD COLUMN is_published BOOLEAN DEFAULT 1'
      );
      console.log('Successfully added is_published column');
    }

    // Add is_featured column if it doesn't exist
    if (!columns.includes('is_featured')) {
      console.log('Adding is_featured column...');
      await db.execute(
        'ALTER TABLE builders ADD COLUMN is_featured BOOLEAN DEFAULT 0'
      );
      console.log('Successfully added is_featured column');
    }

    // Set default values for existing rows
    console.log('Setting default values for existing rows...');
    await db.execute(`
      UPDATE builders 
      SET 
        is_published = COALESCE(is_published, 1),
        is_featured = COALESCE(is_featured, 0)
    `);

    console.log('Successfully updated existing rows');
    console.log('Builder states update completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating builder states:', error);
    process.exit(1);
  }
}

updateBuilderStates();
