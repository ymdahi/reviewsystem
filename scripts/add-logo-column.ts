import { db } from '@/lib/db';

async function addLogoColumn() {
  try {
    // Check if the column already exists
    const tableInfo = await db.execute("PRAGMA table_info(builders)");
    const hasLogoColumn = tableInfo.rows.some((row: any) => row.name === 'logo');

    if (!hasLogoColumn) {
      console.log('Adding logo column to builders table...');
      await db.execute(`
        ALTER TABLE builders
        ADD COLUMN logo TEXT;
      `);
      console.log('Successfully added logo column');
    } else {
      console.log('Logo column already exists');
    }
  } catch (error) {
    console.error('Error adding logo column:', error);
    throw error;
  }
}

// Run the migration
addLogoColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
