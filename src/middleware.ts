/**
 * InsightGov Africa - Middleware
 * ===============================
 * Protection des routes avec NextAuth + Security headers + Rate limiting
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { isRateLimited, getClientIP, addSecurityHeaders } from '@/lib/security';

// Routes qui nécessitent obligatoirement une authentification
const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/profile',
  '/api-keys',
  '/webhooks',
];

// Routes publiques (accessibles sans authentification)
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/pricing',
  '/about',
  '/contact',
  '/api/health',
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Apply rate limiting to API routes (except health checks)
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
      if (isRateLimited(clientIP)) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
          { status: 429 }
        );
      }
    }
    
    // If authenticated and trying to access auth pages, redirect to dashboard
    if (
      req.nextauth.token &&
      (pathname === '/login' || pathname === '/signup')
    ) {
      const response = NextResponse.redirect(new URL('/dashboard', req.url));
      return addSecurityHeaders(response);
    }

    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
          return true;
        }

        // Allow API routes (they handle their own auth)
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Allow static files
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/favicon') ||
          pathname.includes('.')
        ) {
          return true;
        }

        // Only require authentication for explicitly protected routes
        // In development, allow access to most routes without auth
        if (process.env.NODE_ENV === 'development') {
          const isProtected = protectedRoutes.some(
            (route) => pathname === route || pathname.startsWith(route + '/')
          );
          
          if (isProtected) {
            return !!token;
          }
          
          return true;
        }

        // In production, require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
