import { rewrite } from "@vercel/functions";

/**
 * Vercel Edge Middleware — SPA fallback routing.
 *
 * Rewrites all non-API, non-static-asset requests to /index.html so that
 * React Router can handle client-side routing (e.g. /sign-in, /app/dashboard).
 *
 * Runs at the edge BEFORE Vercel's filesystem/Lambda routing, making it
 * the most reliable way to serve a SPA on Vercel LAMBDAS deployments.
 */
export default function middleware(request: Request) {
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
