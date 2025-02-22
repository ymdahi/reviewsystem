// JWT Secret for signing and verifying tokens
export const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_please_change_in_production';

// Cookie options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

// API Routes
export const API_ROUTES = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
};

// Page Routes
export const PAGE_ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  ADMIN: '/dashboard/admin',
};
