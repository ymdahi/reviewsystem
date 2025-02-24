import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_please_change_in_production'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    let isAdmin = false;
    const token = cookies().get('token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId;
        if (userId) {
          const userResult = await db.execute({
            sql: 'SELECT role FROM users WHERE id = ?',
            args: [userId],
          });
          isAdmin = userResult.rows[0]?.role === 'ADMIN';
        }
      } catch (error) {
        // Token verification failed, continue as non-admin
        console.error('Token verification failed:', error);
      }
    }

    // Get builder details
    const builderResult = await db.execute({
      sql: `
        SELECT 
          id,
          name,
          description,
          location,
          website,
          phone,
          email,
          logo,
          average_rating,
          total_reviews,
          is_verified,
          is_published,
          is_featured,
          created_at,
          updated_at
        FROM builders
        WHERE id = ? ${!isAdmin ? 'AND is_published = 1' : ''}
      `,
      args: [params.id],
    });

    if (builderResult.rows.length === 0) {
      return Response.json({ error: 'Builder not found' }, { status: 404 });
    }

    const builder = builderResult.rows[0];

    // Get builder's reviews with images
    const reviewsResult = await db.execute({
      sql: `
        SELECT 
          r.*,
          u.full_name as reviewer_name,
          GROUP_CONCAT(i.url) as image_urls
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN images i ON r.id = i.review_id
        WHERE r.builder_id = ?
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `,
      args: [params.id],
    });

    // Process reviews to parse image URLs
    const reviews = reviewsResult.rows.map(review => ({
      ...review,
      image_urls: review.image_urls ? review.image_urls.split(',') : []
    }));

    // Get images for this builder (both direct builder images and review images)
    const imagesResult = await db.execute({
      sql: `
        SELECT url
        FROM images
        WHERE builder_id = ?
        UNION
        SELECT i.url
        FROM images i
        JOIN reviews r ON i.review_id = r.id
        WHERE r.builder_id = ?
        ORDER BY url
      `,
      args: [params.id, params.id],
    });

    return Response.json({
      builder,
      reviews,
      images: imagesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching builder:', error);
    return Response.json(
      { error: 'Failed to fetch builder details' },
      { status: 500 }
    );
  }
}
