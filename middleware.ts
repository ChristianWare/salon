// middleware.ts
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import {
  apiAuthPrefix,
  authRoutes, 
  publicRoutes, 
  LOGIN_REDIRECT, 
} from "./routes";

/* ——————————————————————————————————————————————————————————————— *
 * Wrap your custom middleware logic with NextAuth’s own middleware
 * so `req.auth` is populated before we make any decisions.
 * ——————————————————————————————————————————————————————————————— */
export const { auth: baseMiddleware } = NextAuth(authConfig);

export default baseMiddleware((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  /* 1. Let NextAuth handle its own API routes (/api/auth/*) */
  if (pathname.startsWith(apiAuthPrefix)) {
    return; // continue without changes
  }

  /* 2. Auth pages ( /login , /register )
   *    ───────────────────────────────────
   *    If the user is already authenticated, send them to the dashboard.
   */
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL(LOGIN_REDIRECT, nextUrl));
  }

  /* 3. Protected pages
   *    ───────────────
   *    Any route that is NOT:
   *      • a public route   (e.g. "/")
   *      • an auth route    ("/login", "/register")
   *    requires the user to be logged in. Otherwise → /login
   */
  const isPublicRoute = publicRoutes.includes(pathname);
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  /* 4. All other cases: just continue */
  return;
});

/* ——————————————————————————————————————————————————————————————— *
 * Run this middleware on every route except Next.js internals
 * and static assets, plus all API routes (for rule #1 above).
 * ——————————————————————————————————————————————————————————————— */
export const config = {
  matcher: [
    // Skip _next/* and static files (images, fonts, etc.)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Always execute on API routes so /api/auth/* is caught by rule #1
    "/(api|trpc)(.*)",
  ],
};
