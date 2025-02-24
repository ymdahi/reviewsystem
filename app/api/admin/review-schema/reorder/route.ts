import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';
import { reorderReviewFields } from '@/lib/review-schema';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    
    if (!payload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const userResult = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [payload.id]
    );

    const user = userResult[0];
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle reordering
    const { orderedIds } = await request.json();
    await reorderReviewFields(orderedIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering review fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
