import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import CryptoJS from "crypto-js";
import { ROUTES } from "@/lib/constant";

// // --- DISABLE ORG ROUTES: Comment out lines below to re-enable ---
// const DISABLED_ROUTES = Object.values(ROUTES.ORG);
// // --- END DISABLE ORG ROUTES ---

// Same secret used by session-storage.ts
const SECRET =
  process.env.NEXT_PUBLIC_SESSION_SECRET || "__credit_scoring_session_key__";

// Decrypt the AES-encrypted session cookie
function decryptSessionCookie(request: NextRequest): {
  accessToken: string;
  refreshToken: string;
  userType: string;
  user: Record<string, unknown>;
} | null {
  const raw = request.cookies.get("session")?.value;
  if (!raw) return null;

  try {
    const ciphertext = decodeURIComponent(raw);
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // // --- DISABLE ORG ROUTES: Comment out lines below to re-enable ---
  // if (
  //   DISABLED_ROUTES.some(
  //     (route) => path === route || path.startsWith(route + "/"),
  //   )
  // ) {
  //   return NextResponse.rewrite(new URL("/_not-found", request.url));
  // }
  // // --- END DISABLE ORG ROUTES ---

  // Define public paths that don't require authentication
  const isPublicPath =
    path === ROUTES.AUTH.LOGIN ||
    path === ROUTES.AUTH.FORGOT_PASSWORD ||
    path === ROUTES.AUTH.RESET_PASSWORD ||
    path === "/";

  // Decode session from cookie
  const session = decryptSessionCookie(request);
  const isAuthenticated = session !== null;

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    // If user is already logged in and tries to access public auth pages,
    // redirect them to the appropriate dashboard based on user type
    const dashboardRoute =
      session.userType === "admin"
        ? ROUTES.ADMIN.DASHBOARD
        : ROUTES.ADMIN.DASHBOARD; // Update to ROUTES.ORG.DASHBOARD when org routes are enabled
    return NextResponse.redirect(new URL(dashboardRoute, request.nextUrl));
  }

  if (!isPublicPath && !isAuthenticated) {
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
