/**
 * InsightGov Africa - NextAuth API Route
 * ========================================
 * API route handler for NextAuth.js authentication.
 * Includes robust error handling to return JSON instead of HTML error pages.
 */

import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Wrapper to catch errors and return proper JSON responses
async function wrappedHandler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  try {
    // Call the original handler
    const response = await handler(req, context);
    return response;
  } catch (error) {
    console.error('[NextAuth] Handler error:', error);
    
    // Return a JSON error response instead of HTML
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: 'An error occurred during authentication. Please try again.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
