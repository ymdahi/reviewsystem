import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = cookies().get('token')?.value;
    if (!token) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    // Get review with builder information and images
    const result = await db.execute({
      sql: `
        SELECT 
          r.*,
          b.name as builder_name,
          b.logo as builder_logo,
          GROUP_CONCAT(i.url) as image_urls
        FROM reviews r
        JOIN builders b ON r.builder_id = b.id
        LEFT JOIN images i ON r.id = i.review_id
        WHERE r.id = ?
        GROUP BY r.id
      `,
      args: [params.id],
    });

    const review = result.rows[0];

    if (!review) {
      return Response.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view/edit this review
    if (review.user_id !== payload.id && payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Not authorized to view this review' },
        { status: 403 }
      );
    }

    // Format the review data
    const formattedReview = {
      ...review,
      images: review.image_urls ? review.image_urls.split(',') : [],
    };

    return Response.json({ review: formattedReview });
  } catch (error) {
    console.error('Error fetching review:', error);
    return Response.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      build_quality,
      material_quality,
      bathrooms,
      bedrooms,
      kitchen,
      exterior,
      windows_doors,
      electrical,
      plumbing,
      overall_comment,
      images,
    } = body;

    // Start a transaction
    await db.execute({ sql: 'BEGIN' });

    try {
      // Update review
      await db.execute({
        sql: `
          UPDATE reviews
          SET
            build_quality = ?,
            material_quality = ?,
            bathrooms = ?,
            bedrooms = ?,
            kitchen = ?,
            exterior = ?,
            windows_doors = ?,
            electrical = ?,
            plumbing = ?,
            overall_comment = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          build_quality,
          material_quality,
          bathrooms,
          bedrooms,
          kitchen,
          exterior,
          windows_doors,
          electrical,
          plumbing,
          overall_comment,
          params.id,
        ],
      });

      // Delete existing images
      await db.execute({
        sql: 'DELETE FROM images WHERE review_id = ?',
        args: [params.id],
      });

      // Insert new images
      if (images && images.length > 0) {
        // Filter out any null or empty URLs
        const validImages = images.filter(url => url && url.trim());
        
        if (validImages.length > 0) {
          const placeholders = validImages.map(() => '(?, ?, ?)').join(',');
          const args = validImages.flatMap(url => [params.id, null, url]);

          await db.execute({
            sql: `
              INSERT INTO images (review_id, builder_id, url)
              VALUES ${placeholders}
            `,
            args,
          });
        }
      }

      await db.execute({ sql: 'COMMIT' });
      return Response.json({ success: true });
    } catch (error) {
      await db.execute({ sql: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Start a transaction
    await db.execute({ sql: 'BEGIN' });

    try {
      // First delete associated images
      await db.execute({
        sql: 'DELETE FROM images WHERE review_id = ?',
        args: [params.id],
      });

      // Then delete the review
      await db.execute({
        sql: 'DELETE FROM reviews WHERE id = ?',
        args: [params.id],
      });

      await db.execute({ sql: 'COMMIT' });
      return Response.json({ success: true });
    } catch (error) {
      await db.execute({ sql: 'ROLLBACK' });
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
