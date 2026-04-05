import { rewrite } from "@vercel/functions";

/**
 * Vercel Edge Middleware — SPA fallback routing.
 * Rewrites non-API, non-asset paths to /index.html so React Router handles them.
 */
export default function middleware(request) {
  const { pathname } = new URL(request.url);

  // Pass through API routes
  if (pathname.startsWith("/api")) return;

  // Pass through static assets (anything with a file extension)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return;

  // Rewrite everything else to the SPA shell
  return rewrite(new URL("/index.html", request.url));
}

export const config = {
  matcher: "/(.*)",
};
