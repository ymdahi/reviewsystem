import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',
});

export async function initializeDatabase() {
  // Create users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('HOMEOWNER', 'BUILDER', 'ADMIN')) DEFAULT 'HOMEOWNER',
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create builders table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS builders (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      website TEXT,
      phone TEXT,
      email TEXT,
      logo TEXT,
      average_rating REAL,
      total_reviews INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT 0,
      is_published BOOLEAN DEFAULT 1,
      is_featured BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create reviews table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) NOT NULL,
      builder_id TEXT REFERENCES builders(id) NOT NULL,
      build_quality INTEGER CHECK(build_quality BETWEEN 1 AND 5),
      material_quality INTEGER CHECK(material_quality BETWEEN 1 AND 5),
      bathrooms INTEGER CHECK(bathrooms BETWEEN 1 AND 5),
      bedrooms INTEGER CHECK(bedrooms BETWEEN 1 AND 5),
      kitchen INTEGER CHECK(kitchen BETWEEN 1 AND 5),
      exterior INTEGER CHECK(exterior BETWEEN 1 AND 5),
      windows_doors INTEGER CHECK(windows_doors BETWEEN 1 AND 5),
      electrical INTEGER CHECK(electrical BETWEEN 1 AND 5),
      plumbing INTEGER CHECK(plumbing BETWEEN 1 AND 5),
      overall_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create responses table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      review_id TEXT REFERENCES reviews(id) NOT NULL,
      builder_id TEXT REFERENCES builders(id) NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create images table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      review_id TEXT REFERENCES reviews(id),
      builder_id TEXT REFERENCES builders(id),
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create triggers for updating timestamps
  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_builder_timestamp
    AFTER UPDATE ON builders
    BEGIN
      UPDATE builders SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_review_timestamp
    AFTER UPDATE ON reviews
    BEGIN
      UPDATE reviews SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_response_timestamp
    AFTER UPDATE ON responses
    BEGIN
      UPDATE responses SET updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.id;
    END
  `);

  // Create triggers for updating builder ratings
  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_builder_rating_insert
    AFTER INSERT ON reviews
    BEGIN
      UPDATE builders
      SET 
        average_rating = (
          SELECT AVG((build_quality + material_quality + bathrooms + bedrooms + kitchen + 
                     exterior + windows_doors + electrical + plumbing) / 9.0)
          FROM reviews
          WHERE builder_id = NEW.builder_id
        ),
        total_reviews = (
          SELECT COUNT(*)
          FROM reviews
          WHERE builder_id = NEW.builder_id
        )
      WHERE id = NEW.builder_id;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_builder_rating_update
    AFTER UPDATE ON reviews
    BEGIN
      UPDATE builders
      SET 
        average_rating = (
          SELECT AVG((build_quality + material_quality + bathrooms + bedrooms + kitchen + 
                     exterior + windows_doors + electrical + plumbing) / 9.0)
          FROM reviews
          WHERE builder_id = NEW.builder_id
        ),
        total_reviews = (
          SELECT COUNT(*)
          FROM reviews
          WHERE builder_id = NEW.builder_id
        )
      WHERE id = NEW.builder_id;
    END
  `);

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS update_builder_rating_delete
    AFTER DELETE ON reviews
    BEGIN
      UPDATE builders
      SET 
        average_rating = (
          SELECT AVG((build_quality + material_quality + bathrooms + bedrooms + kitchen + 
                     exterior + windows_doors + electrical + plumbing) / 9.0)
          FROM reviews
          WHERE builder_id = OLD.builder_id
        ),
        total_reviews = (
          SELECT COUNT(*)
          FROM reviews
          WHERE builder_id = OLD.builder_id
        )
      WHERE id = OLD.builder_id;
    END
  `);
}

export type UserRole = 'HOMEOWNER' | 'BUILDER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Builder {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  average_rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  builder_id: string;
  build_quality: number;
  material_quality: number;
  bathrooms: number;
  bedrooms: number;
  kitchen: number;
  exterior: number;
  windows_doors: number;
  electrical: number;
  plumbing: number;
  overall_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  review_id: string;
  builder_id: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  review_id: string | null;
  builder_id: string | null;
  url: string;
  created_at: string;
}

export { client as db };