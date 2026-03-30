/**
 * InsightGov Africa - Security Configuration
 * ============================================
 * Rate limiting, security headers, and request validation
 * 
 * NOTE: This file is used in both edge middleware and node.js contexts.
 * Functions that require database access use dynamic imports to avoid
 * bundling Prisma in the edge runtime.
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window per IP

// In-memory rate limiting (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes (only in node.js context)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  organizationId?: string;
  role?: string;
  error?: string;
}

/**
 * Check if user is authenticated
 * Returns user info if authenticated, null otherwise
 * 
 * NOTE: This function uses dynamic imports to avoid bundling Prisma in edge runtime.
 * Only use this in API routes (Node.js context), not in middleware.
 */
export async function checkAuth(): Promise<AuthResult> {
  try {
    // Dynamic imports to avoid edge runtime issues
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return {
        authenticated: false,
        error: 'Non authentifié',
      };
    }
    
    return {
      authenticated: true,
      userId: session.user.id,
      email: session.user.email || undefined,
      organizationId: (session.user as { organizationId?: string }).organizationId,
      role: (session.user as { role?: string }).role,
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return {
      authenticated: false,
      error: 'Erreur d\'authentification',
    };
  }
}

/**
 * Require authentication - throws error response if not authenticated
 * Use this at the start of protected API routes
 */
export async function requireAuth(): Promise<{ userId: string; email: string; organizationId?: string; role?: string } | NextResponse> {
  const auth = await checkAuth();
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Authentification requise' },
      { status: 401 }
    );
  }
  
  return {
    userId: auth.userId!,
    email: auth.email!,
    organizationId: auth.organizationId,
    role: auth.role,
  };
}

/**
 * Check if user owns a resource
 */
export async function checkOwnership(resourceOrgId: string): Promise<boolean> {
  const auth = await checkAuth();
  
  if (!auth.authenticated) {
    return false;
  }
  
  // Admin can access all resources
  if (auth.role === 'admin' || auth.role === 'owner') {
    return true;
  }
  
  // Check if resource belongs to user's organization
  return auth.organizationId === resourceOrgId;
}

/**
 * Require ownership - returns error response if user doesn't own the resource
 */
export async function requireOwnership(resourceOrgId: string): Promise<boolean | NextResponse> {
  const auth = await checkAuth();
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise' },
      { status: 401 }
    );
  }
  
  // Admin can access all resources
  if (auth.role === 'admin' || auth.role === 'owner') {
    return true;
  }
  
  // Check if resource belongs to user's organization
  if (auth.organizationId !== resourceOrgId) {
    return NextResponse.json(
      { success: false, error: 'Accès non autorisé à cette ressource' },
      { status: 403 }
    );
  }
  
  return true;
}

/**
 * Check if request is rate limited
 * Safe to use in edge middleware
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

/**
 * Get client IP from request
 * Safe to use in edge middleware
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default (in production, this should not happen)
  return 'unknown';
}

/**
 * Security headers middleware
 * Safe to use in edge middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://api.paystack.co;"
  );
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  return response;
}

/**
 * Input sanitization helpers
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * CORS configuration for API routes
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://insightgov-africa.onrender.com',
  ].filter(Boolean);
  
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptions(origin: string | null): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: getCORSHeaders(origin),
  });
}
