import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';

const JWT_SECRET_ENCODED = new TextEncoder().encode(JWT_SECRET);

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = cookies().get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED);

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

    // Get total counts
    const [buildersResult, reviewsResult, usersResult] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM builders'),
      db.execute('SELECT COUNT(*) as count FROM reviews'),
      db.execute('SELECT COUNT(*) as count FROM users'),
    ]);

    return Response.json({
      totalBuilders: buildersResult.rows[0].count,
      totalReviews: reviewsResult.rows[0].count,
      totalUsers: usersResult.rows[0].count,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
