import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';

export async function GET() {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    if (!payload.id) {
      return Response.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get fresh user data from database
    const userResult = await db.execute({
      sql: `
        SELECT 
          id,
          email,
          full_name,
          role
        FROM users 
        WHERE id = ?
      `,
      args: [payload.id],
    });

    const user = userResult.rows[0];

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user info (excluding sensitive data)
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return Response.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
