/**
 * InsightGov Africa - Database Connection
 * =========================================
 * Prisma client with graceful error handling for development.
 * Safe initialization that won't crash the app if database is unavailable.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is set and valid
const databaseUrl = process.env.DATABASE_URL;
const hasValidDatabaseUrl = databaseUrl && (
  databaseUrl.startsWith('postgresql://') || 
  databaseUrl.startsWith('postgres://') ||
  databaseUrl.startsWith('file:')
);

// Log database URL status (for debugging)
console.log('[DB] Configuration:');
console.log(`  - DATABASE_URL defined: ${!!databaseUrl}`);
console.log(`  - Valid format: ${hasValidDatabaseUrl}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Create Prisma client only if we have a valid database URL
let prismaInstance: PrismaClient | null = null;

if (hasValidDatabaseUrl) {
  try {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
    });
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
    
    console.log('[DB] ✅ Prisma client initialized successfully');
  } catch (error) {
    console.error('[DB] ❌ Failed to initialize Prisma client:', error);
    prismaInstance = null;
  }
} else {
  console.warn('[DB] ⚠️  No valid DATABASE_URL found, running without database');
  console.warn('[DB]    Demo mode will be available');
}

// Export prisma (may be null if no database)
export const prisma = prismaInstance;

// Export db as alias
export const db = prismaInstance;

// Cache for database availability check
let isAvailableCache: boolean | null = null;
let lastCheckTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Check if database is available
 * Uses caching to avoid repeated connection attempts
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  // Return cached result if still valid
  const now = Date.now();
  if (isAvailableCache !== null && (now - lastCheckTime) < CACHE_DURATION) {
    return isAvailableCache;
  }
  
  if (!prismaInstance) {
    isAvailableCache = false;
    lastCheckTime = now;
    return false;
  }
  
  try {
    // Set a timeout for the query
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000);
    });
    
    await Promise.race([
      prismaInstance.$queryRaw`SELECT 1`,
      timeoutPromise
    ]);
    
    isAvailableCache = true;
    lastCheckTime = now;
    console.log('[DB] ✅ Database connection verified');
    return true;
  } catch (error) {
    console.warn('[DB] ❌ Database connection failed:', error instanceof Error ? error.message : error);
    isAvailableCache = false;
    lastCheckTime = now;
    return false;
  }
}

/**
 * Reset the database availability cache
 * Useful after connection issues are resolved
 */
export function resetDatabaseCache(): void {
  isAvailableCache = null;
  lastCheckTime = 0;
  console.log('[DB] Cache reset');
}

/**
 * Get a dataset by ID
 */
export async function getDataset(id: string) {
  if (!db) return null;
  
  try {
    return await db.dataset.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('[DB] Error fetching dataset:', error);
    return null;
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  if (!db) return null;
  
  try {
    return await db.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  } catch (error) {
    console.error('[DB] Error fetching user:', error);
    return null;
  }
}

/**
 * Safe database operation wrapper
 * Automatically handles database unavailability
 */
export async function safeDbOperation<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> {
  if (!prismaInstance) {
    console.log('[DB] Database not available, using fallback');
    return fallback;
  }
  
  try {
    return await operation(prismaInstance);
  } catch (error) {
    console.error('[DB] Operation failed:', error);
    // Reset cache on error
    isAvailableCache = null;
    return fallback;
  }
}
