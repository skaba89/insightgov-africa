/**
 * InsightGov Africa - Supabase Module Exports
 * ============================================
 * Export centralisé pour tous les modules Supabase
 */

// Clients
export { createSupabaseBrowserClient, getSupabaseBrowserClient } from './client';
export { createSupabaseServerClient, createSupabaseAdminClient, getCurrentUser, isAuthenticated } from './server';

// Types
export type { 
  Database, 
  Json, 
  Tables, 
  InsertTables, 
  UpdateTables, 
  Views,
  Organization,
  User,
  Dataset,
  KPI,
  Subscription,
  Session,
  Account,
  ReportExport
} from './database.types';
