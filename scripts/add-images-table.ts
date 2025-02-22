import { db } from '@/lib/db';

async function main() {
  try {
    // Create images table
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS images (
          id TEXT PRIMARY KEY,
          builder_id TEXT NOT NULL,
          review_id TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
          FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
        )
      `,
      args: [], 
    });

    console.log('✅ Images table created successfully');
  } catch (error) {
    console.error('Error creating images table:', error);
    process.exit(1);
  }
}

main();
