import { db } from '@/lib/db';

async function clearBuilders() {
  try {
    console.log('Deleting all records from builders table...');
    await db.execute('DELETE FROM builders');
    console.log('Successfully deleted all builder records');
  } catch (error) {
    console.error('Error clearing builders table:', error);
    throw error;
  }
}

// Run the script
clearBuilders()
  .then(() => {
    console.log('Table cleared successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to clear table:', error);
    process.exit(1);
  });
