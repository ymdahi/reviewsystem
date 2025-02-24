import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_please_change_in_production'
);

// Helper function to create redirect response
function createRedirectResponse(request: NextRequest, path: string) {
  const url = new URL(path, request.url);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  try {
    // Public paths that don't require authentication
    const publicPaths = [
      '/',
      '/auth/login',
      '/auth/register',
      '/api/auth/login',
      '/api/auth/register',
    ];

    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith('/api/builders') && request.method === 'GET'
    );

    if (isPublicPath) {
      return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return createRedirectResponse(request, '/auth/login');
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check for admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (payload.role !== 'ADMIN') {
        return createRedirectResponse(request, '/');
      }
    }

    // Clone the request headers to avoid stream issues
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', payload.role as string);
    
    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware error:', error);
    return createRedirectResponse(request, '/auth/login');
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};