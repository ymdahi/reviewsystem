import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = cookies().get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    if (!payload.id) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify admin role
    const userResult = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [payload.id],
    });

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'ADMIN') {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const search = url.searchParams.get('search') || '';
    const perPage = 20;
    const offset = (page - 1) * perPage;

    // Get total count for pagination
    const countResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count 
        FROM builders 
        WHERE name LIKE ? OR location LIKE ?
      `,
      args: [`%${search}%`, `%${search}%`],
    });

    // Get paginated builders
    const buildersResult = await db.execute({
      sql: `
        SELECT 
          b.*,
          u.email as user_email,
          u.full_name as user_full_name
        FROM builders b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.name LIKE ? OR b.location LIKE ?
        ORDER BY b.name
        LIMIT ? OFFSET ?
      `,
      args: [`%${search}%`, `%${search}%`, perPage, offset],
    });

    return Response.json({
      builders: buildersResult.rows,
      total: countResult.rows[0].count,
      page,
      perPage,
      totalPages: Math.ceil(countResult.rows[0].count / perPage),
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch builders' },
      { status: 500 }
    );
  }
}
