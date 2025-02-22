import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { JWT_SECRET } from '@/lib/constants';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const {
      builderId,
      buildQuality,
      materialQuality,
      bathrooms,
      bedrooms,
      kitchen,
      exterior,
      windowsDoors,
      electrical,
      plumbing,
      overallComment,
      photos,
    } = body;

    // Validate required fields
    if (!builderId || !overallComment) {
      return Response.json(
        { error: 'Builder ID and overall comment are required' },
        { status: 400 }
      );
    }

    // Validate builder exists
    const builderResult = await db.execute({
      sql: 'SELECT id FROM builders WHERE id = ?',
      args: [builderId],
    });

    if (builderResult.rows.length === 0) {
      return Response.json(
        { error: 'Builder not found' },
        { status: 404 }
      );
    }

    // Validate ratings are between 1 and 5
    const ratings = {
      buildQuality,
      materialQuality,
      bathrooms,
      bedrooms,
      kitchen,
      exterior,
      windowsDoors,
      electrical,
      plumbing,
    };

    for (const [field, rating] of Object.entries(ratings)) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return Response.json(
          { error: `${field} rating must be a number between 1 and 5` },
          { status: 400 }
        );
      }
    }

    // Start a transaction
    await db.execute('BEGIN TRANSACTION');

    try {
      // Insert review
      const reviewId = crypto.randomUUID();
      await db.execute({
        sql: `
          INSERT INTO reviews (
            id,
            user_id,
            builder_id,
            build_quality,
            material_quality,
            bathrooms,
            bedrooms,
            kitchen,
            exterior,
            windows_doors,
            electrical,
            plumbing,
            overall_comment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          reviewId,
          payload.id,
          builderId,
          buildQuality,
          materialQuality,
          bathrooms,
          bedrooms,
          kitchen,
          exterior,
          windowsDoors,
          electrical,
          plumbing,
          overallComment,
        ],
      });

      // Insert photos if any
      if (photos && Array.isArray(photos) && photos.length > 0) {
        for (const photoUrl of photos) {
          await db.execute({
            sql: 'INSERT INTO images (id, review_id, url) VALUES (?, ?, ?)',
            args: [crypto.randomUUID(), reviewId, photoUrl],
          });
        }
      }

      // Update builder's average rating and review count
      await db.execute({
        sql: `
          UPDATE builders 
          SET 
            average_rating = (
              SELECT COALESCE(AVG(
                (build_quality + material_quality + bathrooms + bedrooms + 
                 kitchen + exterior + windows_doors + electrical + plumbing) / 9.0
              ), 0)
              FROM reviews 
              WHERE builder_id = ?
            ),
            total_reviews = (
              SELECT COUNT(*) 
              FROM reviews 
              WHERE builder_id = ?
            )
          WHERE id = ?
        `,
        args: [builderId, builderId, builderId],
      });

      // Commit transaction
      await db.execute('COMMIT');

      return Response.json({
        message: 'Review created successfully',
        reviewId,
      });
    } catch (error) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating review:', error);
    return Response.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
