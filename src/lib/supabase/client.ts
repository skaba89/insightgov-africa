/**
 * InsightGov Africa - Supabase Client (Browser)
 * ===============================================
 * Client Supabase pour utilisation côté navigateur (client components).
 * Utilise les variables d'environnement publiques (NEXT_PUBLIC_*)
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Crée un client Supabase pour utilisation côté client
 * Ce client utilise la clé anonyme (anon key) qui a des permissions limitées
 * et respecte les politiques RLS (Row Level Security)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Instance singleton pour éviter de créer plusieurs clients
let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/**
 * Retourne l'instance singleton du client Supabase côté navigateur
 * Utile pour éviter de créer plusieurs connexions
 */
export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseBrowserClient();
  }
  return supabaseClient;
}
