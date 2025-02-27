import { db } from '@/lib/db';
import crypto from 'crypto';

async function fixEntities() {
  try {
    console.log('Backing up existing entities...');
    const result = await db.execute({
      sql: `SELECT * FROM entities`
    });
    const existingEntities = result.rows || [];

    console.log('Dropping existing tables...');
    await db.execute(`DROP TABLE IF EXISTS entity_records`);
    await db.execute(`DROP TABLE IF EXISTS entities`);
    await db.execute(`DROP TRIGGER IF EXISTS update_entity_timestamp`);
    await db.execute(`DROP TRIGGER IF EXISTS update_entity_record_timestamp`);

    console.log('Creating entities table with new schema...');
    await db.execute(`
      CREATE TABLE entities (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        name TEXT NOT NULL,
        description TEXT,
        fields JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating entity_records table...');
    await db.execute(`
      CREATE TABLE entity_records (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        entity_id TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entity_id) REFERENCES entities(id)
      )
    `);

    console.log('Creating triggers...');
    await db.execute(`
      CREATE TRIGGER update_entity_timestamp 
      AFTER UPDATE ON entities
      BEGIN
        UPDATE entities SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);

    await db.execute(`
      CREATE TRIGGER update_entity_record_timestamp 
      AFTER UPDATE ON entity_records
      BEGIN
        UPDATE entity_records SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);

    console.log('Restoring entities with new IDs...');
    for (const entity of existingEntities) {
      await db.execute({
        sql: `INSERT INTO entities (name, description, fields)
              VALUES (?, ?, ?)`,
        args: [entity.name, entity.description, entity.fields]
      });
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
fixEntities()
  .then(() => {
    console.log('All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
