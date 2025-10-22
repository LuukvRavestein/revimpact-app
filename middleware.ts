import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if this is the app subdomain
  const isAppDomain = req.nextUrl.hostname === 'app.revimpact.nl';
  
  // Define protected routes that require authentication (only for app domain)
  const protectedRoutes = ['/dashboard', '/data', '/qbr', '/workspace'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  // Only apply auth protection for app.revimpact.nl domain
  if (isAppDomain) {
    // If accessing a protected route without authentication, redirect to signin
    if (isProtectedRoute && !session) {
      const signInUrl = new URL('/signin', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // If accessing signin/signup while already authenticated, redirect to dashboard
    if ((req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/') && session) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/data/:path*', 
    '/qbr/:path*',
    '/workspace/:path*',
    '/signin',
    '/marketing'
  ]
};
