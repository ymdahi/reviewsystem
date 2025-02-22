import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First get the review data
    const reviewResult = await db.execute({
      sql: `
        SELECT 
          r.id,
          r.builder_id,
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
          b.name as builder_name,
          b.logo as builder_logo
        FROM reviews r
        JOIN builders b ON r.builder_id = b.id
        WHERE r.id = ?
      `,
      args: [params.id],
    });

    if (reviewResult.rows.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    // Then get the review images
    const imagesResult = await db.execute({
      sql: `
        SELECT url
        FROM images
        WHERE review_id = ?
        ORDER BY created_at ASC
      `,
      args: [params.id],
    });

    // Combine the data
    const review = reviewResult.rows[0];
    review.images = imagesResult.rows.map(row => row.url);

    return Response.json({ review });
  } catch (error) {
    console.error('Error:', error);
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
