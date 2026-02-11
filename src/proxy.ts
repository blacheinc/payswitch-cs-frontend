import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/lib/constant";

// --- DISABLE ORG ROUTES: Comment out lines below to re-enable ---
const DISABLED_ROUTES = Object.values(ROUTES.ORG);
// --- END DISABLE ORG ROUTES ---

export function proxy(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // --- DISABLE ORG ROUTES: Comment out lines below to re-enable ---
  if (
    DISABLED_ROUTES.some(
      (route) => path === route || path.startsWith(route + "/"),
    )
  ) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }
  // --- END DISABLE ORG ROUTES ---
  // Define public paths that don't require authentication
  const isPublicPath =
    path === ROUTES.AUTH.LOGIN ||
    path === ROUTES.AUTH.FORGOT_PASSWORD ||
    path === ROUTES.AUTH.RESET_PASSWORD ||
    path === "/";

  // Get the token from the cookies
  // In a real app, you would verify this token using your auth provider's SDK
  // For this demo, we'll check for a mock token cookie
  const token = request.cookies.get("auth-token")?.value || "";

  // Redirect logic
  if (isPublicPath && token) {
    // If user is already logged in and tries to access public auth pages,
    // redirect them to the dashboard
    return NextResponse.redirect(
      new URL(ROUTES.ADMIN.DASHBOARD, request.nextUrl),
    );
  }

  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected pages,
    // redirect them to the login page
    return NextResponse.redirect(new URL(ROUTES.AUTH.LOGIN, request.nextUrl));
  }
}

// Ensure the proxy is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc) - matched by file extension
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)",
  ],
};
