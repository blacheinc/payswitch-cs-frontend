import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/login' || 
    path === '/forgot-password' || 
    path === '/reset-password' ||
    path === '/';

  // Get the token from the cookies
  // In a real app, you would verify this token using your auth provider's SDK
  // For this demo, we'll check for a mock token cookie
  const token = request.cookies.get('auth-token')?.value || '';

  // Redirect logic
  if (isPublicPath && token) {
    // If user is already logged in and tries to access public auth pages, 
    // redirect them to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected pages, 
    // redirect them to the login page
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
