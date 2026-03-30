/**
 * InsightGov Africa - Supabase Client (Server)
 * =============================================
 * Client Supabase pour utilisation côté serveur (Server Components, API Routes).
 * Gère correctement les cookies pour l'authentification.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Crée un client Supabase pour utilisation côté serveur
 * Ce client gère automatiquement les cookies pour maintenir la session
 * 
 * @returns Client Supabase configuré pour le serveur
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Erreur lors de la définition des cookies
            // Peut arriver si la requête est en cours de traitement
            // Le middleware gérera la session
          }
        },
      },
    }
  );
}

/**
 * Crée un client Supabase avec les privilèges admin (service role)
 * ATTENTION: Ce client contourne les politiques RLS
 * À utiliser UNIQUEMENT pour les opérations administratives
 * 
 * @returns Client Supabase admin
 */
export function createSupabaseAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

/**
 * Récupère l'utilisateur actuellement connecté
 * Utilise le client serveur pour vérifier la session
 * 
 * @returns L'utilisateur connecté ou null
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Vérifie si l'utilisateur est authentifié
 * Utile pour protéger les routes
 * 
 * @returns true si l'utilisateur est connecté
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
