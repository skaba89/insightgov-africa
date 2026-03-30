/**
 * InsightGov Africa - NextAuth Configuration
 * ===========================================
 * Authentication using NextAuth.js with Prisma adapter and PostgreSQL.
 * Gracefully handles database connection errors with demo mode fallback.
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma, isDatabaseAvailable } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Demo user for when database is not available
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@insightgov.africa',
  name: 'Demo User',
  organizationId: 'demo-org',
  organizationName: 'Demo Organization',
  role: 'owner',
};

// Track database availability
let dbAvailable: boolean | null = null;
let dbCheckPromise: Promise<boolean> | null = null;

async function checkDatabase(): Promise<boolean> {
  // Cache the result for 30 seconds
  if (dbAvailable !== null) {
    return dbAvailable;
  }
  
  // Prevent multiple concurrent checks
  if (dbCheckPromise) {
    return dbCheckPromise;
  }
  
  dbCheckPromise = isDatabaseAvailable();
  dbAvailable = await dbCheckPromise;
  dbCheckPromise = null;
  
  // Reset cache after 30 seconds
  setTimeout(() => {
    dbAvailable = null;
  }, 30000);
  
  return dbAvailable;
}

export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter if database is available
  ...(prisma ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo mode - always allow demo credentials
        if (credentials.email === 'demo@insightgov.africa' && credentials.password === 'demo123') {
          console.log('[Auth] Demo user authenticated');
          return DEMO_USER;
        }

        // Check if database is available
        const hasDb = await checkDatabase();
        
        if (!hasDb || !prisma) {
          console.warn('[Auth] Database not available, only demo credentials allowed');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true },
          });

          if (!user || !user.password) {
            console.log('[Auth] User not found or no password:', credentials.email);
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log('[Auth] Invalid password for:', credentials.email);
            return null;
          }

          // Update last login (non-blocking)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch((err) => console.error('[Auth] Failed to update lastLoginAt:', err));

          console.log('[Auth] User authenticated:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            image: user.avatarUrl,
            organizationId: user.organizationId,
            organizationName: user.organization?.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[Auth] Database error:', error);
          // Reset cache on error
          dbAvailable = null;
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token?.email}`);
    },
  },
  debug: false,
};

// Type extensions for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      organizationId: string | null;
      organizationName: string | null;
      role: string;
    };
  }

  interface User {
    organizationId?: string | null;
    organizationName?: string | null;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId?: string | null;
    organizationName?: string | null;
    role?: string;
  }
}
