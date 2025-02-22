import { db, initializeDatabase } from '@/lib/db';
import builderData from '../seed-data/chba_directory.json';
import crypto from 'crypto';

async function seedBuilders() {
  try {
    console.log('Initializing database...');
    await initializeDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
      throw error;
    });
    
    // Verify the builders table exists
    try {
      await db.execute('SELECT 1 FROM builders LIMIT 1');
      console.log('Builders table exists, proceeding with seeding...');
    } catch (error) {
      console.error('Builders table does not exist. Running initialization again...');
      await initializeDatabase();
      
      // Verify one more time
      try {
        await db.execute('SELECT 1 FROM builders LIMIT 1');
      } catch (error) {
        throw new Error('Failed to create builders table after multiple attempts');
      }
    }
    
    console.log(`Starting to seed ${builderData.length} builders...`);
    
    // Process builders in batches to avoid overwhelming the database
    const BATCH_SIZE = 100;
    for (let i = 0; i < builderData.length; i += BATCH_SIZE) {
      const batch = builderData.slice(i, i + BATCH_SIZE);
      
      for (const builder of batch) {
        const builderId = crypto.randomUUID();
        const location = [builder.city, builder.province].filter(Boolean).join(', ');
        const logoPath = builder.logo ? `/builder-logos/${builder.logo}` : null;
        
        await db.execute({
          sql: `
            INSERT INTO builders (
              id,
              name,
              location,
              website,
              phone,
              description,
              logo,
              is_verified,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
          args: [
            builderId,
            builder.name,
            location || null,
            builder.website || null,
            builder.phone || null,
            `${builder.tags ? `${builder.tags}. ` : ''}Located at: ${builder.full_address}`,
            logoPath,
            true, // Setting is_verified to true since these are from CHBA directory
          ],
        });
      }
      
      console.log(`Processed ${Math.min(i + BATCH_SIZE, builderData.length)} out of ${builderData.length} builders`);
    }
    
    console.log('Successfully seeded all builders!');
  } catch (error) {
    console.error('Error seeding builders:', error);
    throw error;
  }
}

// Run the seeding
seedBuilders()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });