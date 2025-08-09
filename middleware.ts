/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware.ts
import { auth as baseAuth } from "./auth";
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  // LOGIN_REDIRECT, // optional; kept for reference
} from "./routes";

/**
 * Middleware runs on every request (per matcher below).
 * We wrap our logic with NextAuth's `auth` so `req.auth` is populated.
 */
export default baseAuth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // 1) Let NextAuth handle its own API routes (/api/auth/*)
  if (pathname.startsWith(apiAuthPrefix)) return;

  // 2) Auth pages (/login, /register):
  //    If already logged in, send to appropriate dashboard.
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute && isLoggedIn) {
    const role = req.auth?.user?.role as "ADMIN" | "USER" | undefined;
    const isGroomer = (req.auth as any)?.user?.isGroomer as boolean | undefined;

    const destination =
      role === "ADMIN" ? "/admin" : isGroomer ? "/groomer" : "/dashboard";

    return Response.redirect(new URL(destination, nextUrl));
  }

  // 3) Protected pages:
  //    Anything not explicitly public or an auth page requires login.
  const isPublicRoute = publicRoutes.includes(pathname);
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // 4) Continue
  return;
});

/**
 * Match all routes except Next.js internals/static assets,
 * plus include API routes so /api/auth/* hits rule #1 above.
 */
export const config = {
  matcher: [
    // Skip _next/* and common static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always execute on API routes
    "/(api|trpc)(.*)",
  ],
};
