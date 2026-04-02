import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * InsightGov Africa - Security Middleware
 * ========================================
 * 
 * NOTE: Next.js 16 shows a deprecation warning for middleware.
 * This is a planned migration to the new "proxy" system.
 * The middleware remains fully functional and will be migrated
 * when the proxy API is fully documented and stable.
 * 
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 * 
 * Features:
 * - Security headers (CSP, HSTS, XSS protection)
 * - Rate limiting for API routes
 * - CSRF protection
 * - IP blocking for known malicious IPs
 * - Request logging
 */

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filter
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.openai.com https://api.groq.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
  
  // HTTP Strict Transport Security (HSTS) - 1 year
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
}

// Rate limiting configuration (in-memory for simple cases, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/auth': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  '/api/api-keys': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  '/api/ai': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  '/api/upload': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  'default': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
}

function getRateLimitKey(request: NextRequest): string {
  const ip = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') ||
    'unknown'
  const path = request.nextUrl.pathname
  return `${ip}:${path}`
}

function checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request)
  const now = Date.now()
  
  // Find matching config
  let config = rateLimitConfigs.default
  for (const [path, cfg] of Object.entries(rateLimitConfigs)) {
    if (request.nextUrl.pathname.startsWith(path)) {
      config = cfg
      break
    }
  }
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs }
  }
  
  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime }
}

// CSRF protection
const csrfExemptPaths = [
  '/api/auth',
  '/api/webhooks',
]

function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF for exempt paths
  if (csrfExemptPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return true
  }
  
  // Only validate for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return true
  }
  
  // Check for CSRF token in headers
  const csrfToken = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')
  
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie.value) {
    // Alternative: Check Origin header
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    if (origin && host) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return false
      }
      return true
    }
    
    return false
  }
  
  return true
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 1. Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // 2. Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(request)
    
    response.headers.set('X-RateLimit-Limit', String(rateLimitConfigs.default.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime))
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            ...Object.fromEntries(Object.entries(securityHeaders))
          }
        }
      )
    }
  }
  
  // 3. CSRF protection for state-changing requests
  if (request.nextUrl.pathname.startsWith('/api/') && !validateCSRF(request)) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'CSRF validation failed', 
        message: 'Invalid or missing CSRF token'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(Object.entries(securityHeaders))
        }
      }
    )
  }
  
  // 4. IP blocking for known malicious IPs (can be extended with external lists)
  const blockedIPs = new Set([
    // Add known malicious IPs here
  ])
  
  const clientIP = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip')
  
  if (clientIP && blockedIPs.has(clientIP.trim())) {
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403 }
    )
  }
  
  // 5. Log security events for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    }))
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
