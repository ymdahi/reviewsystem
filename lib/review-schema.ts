import { db } from './db';

export interface ReviewField {
  id: string;
  name: string;
  label: string;
  type: 'number' | 'text' | 'textarea';
  required: boolean;
  min?: number;
  max?: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export async function initializeReviewSchema() {
  await db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS review_fields (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        type TEXT CHECK(type IN ('number', 'text', 'textarea')) NOT NULL,
        required BOOLEAN DEFAULT true,
        min INTEGER,
        max INTEGER,
        order_position INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    args: []
  });

  // Insert default fields if table is empty
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM review_fields',
    args: []
  });
  
  if (result.rows[0].count === 0) {
    const defaultFields = [
      { name: 'build_quality', label: 'Build Quality', type: 'number', required: true, min: 1, max: 5, order: 1 },
      { name: 'material_quality', label: 'Material Quality', type: 'number', required: true, min: 1, max: 5, order: 2 },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true, min: 1, max: 5, order: 3 },
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 1, max: 5, order: 4 },
      { name: 'kitchen', label: 'Kitchen', type: 'number', required: true, min: 1, max: 5, order: 5 },
      { name: 'exterior', label: 'Exterior', type: 'number', required: true, min: 1, max: 5, order: 6 },
      { name: 'windows_doors', label: 'Windows & Doors', type: 'number', required: true, min: 1, max: 5, order: 7 },
      { name: 'electrical', label: 'Electrical', type: 'number', required: true, min: 1, max: 5, order: 8 },
      { name: 'plumbing', label: 'Plumbing', type: 'number', required: true, min: 1, max: 5, order: 9 },
      { name: 'overall_comment', label: 'Overall Comment', type: 'textarea', required: true, min: null, max: null, order: 10 }
    ];

    for (const field of defaultFields) {
      await db.execute({
        sql: `
          INSERT INTO review_fields (
            id, name, label, type, required, min, max, order_position
          ) VALUES (
            lower(hex(randomblob(16))),
            ?, ?, ?, ?, ?, ?, ?
          )
        `,
        args: [field.name, field.label, field.type, field.required, field.min || null, field.max || null, field.order]
      });
    }
  }
}

export async function getReviewFields(): Promise<ReviewField[]> {
  const result = await db.execute({
    sql: `
      SELECT 
        id, name, label, type, required, min, max, order_position as "order",
        created_at, updated_at
      FROM review_fields 
      ORDER BY order_position
    `,
    args: []
  });
  return result.rows;
}

export async function createReviewField(field: Omit<ReviewField, 'id' | 'created_at' | 'updated_at'>) {
  const result = await db.execute({
    sql: `
      INSERT INTO review_fields (
        id, name, label, type, required, min, max, order_position
      ) VALUES (
        lower(hex(randomblob(16))),
        ?, ?, ?, ?, ?, ?, ?
      ) RETURNING *
    `,
    args: [field.name, field.label, field.type, field.required, field.min || null, field.max || null, field.order]
  });
  return result.rows[0];
}

export async function updateReviewField(id: string, field: Partial<ReviewField>) {
  const updates: string[] = [];
  const values: any[] = [];

  if (field.name !== undefined) {
    updates.push('name = ?');
    values.push(field.name);
  }
  if (field.label !== undefined) {
    updates.push('label = ?');
    values.push(field.label);
  }
  if (field.type !== undefined) {
    updates.push('type = ?');
    values.push(field.type);
  }
  if (field.required !== undefined) {
    updates.push('required = ?');
    values.push(field.required);
  }
  if (field.min !== undefined) {
    updates.push('min = ?');
    values.push(field.min || null);
  }
  if (field.max !== undefined) {
    updates.push('max = ?');
    values.push(field.max || null);
  }
  if (field.order !== undefined) {
    updates.push('order_position = ?');
    values.push(field.order);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await db.execute({
    sql: `
      UPDATE review_fields 
      SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `,
    args: [...values, id]
  });
  return result.rows[0];
}

export async function deleteReviewField(id: string) {
  await db.execute({
    sql: 'DELETE FROM review_fields WHERE id = ?',
    args: [id]
  });
}

export async function reorderReviewFields(orderedIds: string[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute({
      sql: 'UPDATE review_fields SET order_position = ? WHERE id = ?',
      args: [i + 1, orderedIds[i]]
    });
  }
}
