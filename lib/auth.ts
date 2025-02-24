import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from './constants';

export interface User {
  id: string;
  email: string;
  role: 'HOMEOWNER' | 'BUILDER' | 'ADMIN';
  full_name: string | null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    if (!payload.id) {
      return null;
    }

    // Get fresh user data from database
    const result = await db.execute(`
      SELECT 
        id,
        email,
        full_name,
        role
      FROM users 
      WHERE id = ?
    `, [payload.id]);

    const user = result[0];

    if (!user) {
      return null;
    }

    return user as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
