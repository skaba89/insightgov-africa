/**
 * Database accessor with type-safe null handling
 * Use this instead of importing db directly for simpler type checking
 */

import { db } from './db';

/**
 * Get database client or throw error
 * Use this when database is required for the operation
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not available');
  }
  return db;
}

/**
 * Check if database is available
 */
export function isDbAvailable(): boolean {
  return db !== null;
}

// Re-export db for backward compatibility
export { db };
