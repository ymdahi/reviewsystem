import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_please_change_in_production'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Check if user is admin
    let isAdmin = false;
    const token = cookies().get('token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;
        const userResult = await db.execute({
          sql: 'SELECT role FROM users WHERE id = ?',
          args: [userId],
        });
        isAdmin = userResult.rows[0]?.role === 'ADMIN';
      } catch (error) {
        // Token verification failed, continue as non-admin
        console.error('Token verification failed:', error);
      }
    }

    // Get total count for pagination
    const conditions = ['1 = 1'];
    const args: any[] = [];

    // Add search condition if search term exists
    if (search) {
      conditions.push('(name LIKE ?)');
      args.push(`%${search}%`);
    }

    // Add published condition for non-admin users
    if (!isAdmin) {
      conditions.push('is_published = 1');
    }

    const countResult = await db.execute({
      sql: `
        SELECT COUNT(*) as total
        FROM builders
        WHERE ${conditions.join(' AND ')}
      `,
      args,
    });

    const total = countResult.rows[0].total;
    const pages = Math.ceil(total / limit);

    // Get builders with average rating and review count
    const result = await db.execute({
      sql: `
        SELECT 
          b.id,
          b.name,
          b.location,
          b.website,
          b.phone,
          b.email,
          b.description,
          b.logo,
          b.is_verified,
          COUNT(r.id) as total_reviews,
          AVG(
            (r.build_quality + 
            r.material_quality + 
            r.bathrooms + 
            r.bedrooms + 
            r.kitchen + 
            r.exterior + 
            r.windows_doors + 
            r.electrical + 
            r.plumbing) / 9.0
          ) as average_rating
        FROM builders b
        LEFT JOIN reviews r ON b.id = r.builder_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY b.id
        ORDER BY 
          CASE WHEN ? = '' THEN b.name ELSE 
            CASE WHEN b.name LIKE ? THEN 0 ELSE 1 END
          END,
          b.name
        LIMIT ? OFFSET ?
      `,
      args: [...args, search, `${search}%`, limit, offset],
    });

    return Response.json({
      builders: result.rows,
      pagination: {
        total,
        pages,
        current: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to fetch builders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get builder by exact name
    const result = await db.execute({
      sql: `
        SELECT 
          id,
          name,
          location,
          website,
          phone,
          email,
          logo,
          is_verified
        FROM builders
        WHERE name = ?
      `,
      args: [name],
    });

    if (result.rows.length === 0) {
      return Response.json({ error: 'Builder not found' }, { status: 404 });
    }

    return Response.json({ builder: result.rows[0] });
  } catch (error) {
    console.error('Error fetching builder:', error);
    return Response.json(
      { error: 'Failed to fetch builder' },
      { status: 500 }
    );
  }
}
