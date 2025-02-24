import { NextResponse } from 'next/server';
import { getReviewFields } from '@/lib/review-schema';

export async function GET() {
  try {
    const fields = await getReviewFields();
    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching review fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review fields' },
      { status: 500 }
    );
  }
}
