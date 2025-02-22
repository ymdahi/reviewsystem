import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_please_change_in_production'
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = cookies().get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Verify admin role
    const userResult = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [userId],
    });

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'ADMIN') {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const allowedFields = ['is_published', 'is_featured', 'is_verified'];
    const updates = Object.entries(body)
      .filter(([key]) => allowedFields.includes(key))
      .map(([key, value]) => `${key} = ?`);
    const updateValues = Object.entries(body)
      .filter(([key]) => allowedFields.includes(key))
      .map(([, value]) => value);

    if (updates.length === 0) {
      return Response.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update builder
    const result = await db.execute({
      sql: `
        UPDATE builders 
        SET ${updates.join(', ')},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [...updateValues, params.id],
    });

    if (result.rowsAffected === 0) {
      return Response.json({ error: 'Builder not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to update builder' },
      { status: 500 }
    );
  }
}
