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

    // Drop and recreate forms table to fix schema
    await db.execute(`DROP TABLE IF EXISTS forms`);
    await db.execute(`DROP TABLE IF EXISTS form_submissions`);

    // Create forms table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forms (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        fields JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created forms table');

    // Create form_submissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms(id)
      )
    `);
    console.log('Created form_submissions table');

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

    // Create update trigger for forms
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS update_forms_timestamp 
      AFTER UPDATE ON forms
      BEGIN
        UPDATE forms SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);
    console.log('Created forms update trigger');

    // Create update trigger for form_submissions
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS update_form_submissions_timestamp 
      AFTER UPDATE ON form_submissions
      BEGIN
        UPDATE form_submissions SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);
    console.log('Created form_submissions update trigger');

    console.log('All updates completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
    throw error;
  }
}

// Run the update
updateSchema()
  .then(() => {
    console.log('Schema update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update schema:', error);
    process.exit(1);
  });
