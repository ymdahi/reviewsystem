import { db } from '../lib/db';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: ['admin@local.com'],
    });

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const hashedPassword = await hash('admin', 10);

    // Create admin user
    await db.execute({
      sql: `
        INSERT INTO users (id, email, password, role, full_name)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        randomUUID(),
        'admin@local.com',
        hashedPassword,
        'ADMIN',
        'Administrator',
      ],
    });

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the script
createAdminUser();
