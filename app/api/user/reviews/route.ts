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

    // Get user's reviews with builder information and images
    const result = await db.execute({
      sql: `
        SELECT 
          r.id,
          r.user_id,
          r.build_quality,
          r.material_quality,
          r.bathrooms,
          r.bedrooms,
          r.kitchen,
          r.exterior,
          r.windows_doors,
          r.electrical,
          r.plumbing,
          r.overall_comment,
          r.created_at,
          b.id as builder_id,
          b.name as builder_name,
          b.logo as builder_logo,
          b.location as builder_location,
          b.website as builder_website,
          b.phone as builder_phone,
          b.email as builder_email,
          b.is_verified as builder_is_verified,
          GROUP_CONCAT(i.url) as image_urls
        FROM reviews r
        JOIN builders b ON r.builder_id = b.id
        LEFT JOIN images i ON r.id = i.review_id
        WHERE r.user_id = ?
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `,
      args: [payload.id],
    });

    // Parse the image URLs for each review
    const reviews = result.rows.map(review => ({
      ...review,
      images: review.image_urls ? review.image_urls.split(',') : [],
    }));

    return Response.json({ reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return Response.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
