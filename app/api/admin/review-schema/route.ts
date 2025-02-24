import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';
import { getReviewFields, createReviewField, updateReviewField, deleteReviewField, reorderReviewFields } from '@/lib/review-schema';

async function verifyAdmin() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    
    if (!payload.id) {
      return null;
    }

    const userResult = await db.execute({
      sql: 'SELECT role FROM users WHERE id = ?',
      args: [payload.id]
    });

    const user = userResult.rows[0];
    if (!user || user.role !== 'ADMIN') {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fields = await getReviewFields();
    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching review fields:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const field = await createReviewField(data);
    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error('Error creating review field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, ...updates } = data;
    const field = await updateReviewField(id, updates);
    return NextResponse.json({ field });
  } catch (error) {
    console.error('Error updating review field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    await deleteReviewField(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
