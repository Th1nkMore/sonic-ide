import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Checks if a pathname matches admin routes
 */
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

/**
 * Middleware that handles admin authentication and i18n routing
 */
export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle admin routes
  if (isAdminRoute(pathname)) {
    // Import auth functions
    const {
      verifyAuthToken,
      getAdminCookieFromRequest,
      setAdminCookieInResponse,
    } = await import("./src/lib/auth");

    try {
      // Check for existing valid cookie
      const cookieToken = getAdminCookieFromRequest(request);
      if (cookieToken) {
        const payload = await verifyAuthToken(cookieToken);
        if (payload) {
          // Valid session, allow access
          // Admin routes are not localized, so bypass intl middleware
          return NextResponse.next();
        }
      }

      // Check for token in query parameter
      const queryToken = searchParams.get("token");
      if (queryToken) {
        const payload = await verifyAuthToken(queryToken);
        if (payload) {
          // Valid token, set cookie and redirect (strip token from URL)
          const url = request.nextUrl.clone();
          url.searchParams.delete("token");
          const response = NextResponse.redirect(url);
          setAdminCookieInResponse(response, queryToken);
          return response;
        }
      }

      // No valid authentication, return 401 or redirect
      if (pathname.startsWith("/api/admin")) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      // For page routes, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    } catch (error) {
      // If auth module fails to load (e.g., ADMIN_SECRET missing), deny access
      console.error("Admin authentication not configured:", error);
      if (pathname.startsWith("/api/admin")) {
        return new NextResponse("Admin authentication not configured", {
          status: 503,
        });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Non-admin routes, use intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api` (but allow `/api/admin`), `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (but allow /api/admin)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .png, .jpg, etc.)
     */
    "/((?!api/(?!admin)|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};
