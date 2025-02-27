import { db } from '@/lib/db';

async function updateSchema() {
  try {
    console.log('Creating new tables...');
    
    // Create entities table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        fields JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created entities table');

    // Create entity_records table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS entity_records (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )
    `);
    console.log('Created entity_records table');

    // Create update trigger for entities
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS update_entity_timestamp 
      AFTER UPDATE ON entities
      BEGIN
        UPDATE entities SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);
    console.log('Created entities update trigger');

    // Create update trigger for entity_records
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS update_entity_record_timestamp 
      AFTER UPDATE ON entity_records
      BEGIN
        UPDATE entity_records SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);
    console.log('Created entity_records update trigger');

    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

// Run the update
updateSchema()
  .then(() => {
    console.log('Update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
