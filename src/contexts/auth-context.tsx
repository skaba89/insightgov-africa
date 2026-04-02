/**
 * InsightGov Africa - Authentication Context
 * ===========================================
 * Gestion de l'état d'authentification avec NextAuth.js.
 * Supporte un mode démo sans authentification pour le développement.
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Types
interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  organizationId: string | null;
  organizationName: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  organizationId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
  // Demo mode
  isDemoMode: boolean;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for development
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@insightgov.africa',
  name: 'Demo User',
  image: null,
  organizationId: null,
  organizationName: 'Demo Organization',
  role: 'owner',
};

// Inner provider that uses session
function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  
  // Check for demo mode on mount - using lazy initialization
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('insightgov-demo-mode') === 'true';
    }
    return false;
  });

  // Compute loading state based on status and demo mode
  const isLoading = !isDemoMode && status === 'loading';

  // Transform session user to our User type
  const user: User | null = isDemoMode
    ? DEMO_USER
    : session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        organizationId: session.user.organizationId,
        organizationName: session.user.organizationName,
        role: session.user.role,
      }
    : null;

  const organizationId = user?.organizationId || null;
  const isAuthenticated = isDemoMode || status === 'authenticated';

  // Enable demo mode
  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setHasError(false);
    localStorage.setItem('insightgov-demo-mode', 'true');
  }, []);

  // Sign in with credentials
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setHasError(false);
      
      // Demo credentials
      if (email === 'demo@insightgov.africa' && password === 'demo123') {
        enableDemoMode();
        return { error: null };
      }
      
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: getErrorMessage(result.error) };
      }

      // Disable demo mode when signing in
      setIsDemoMode(false);
      localStorage.removeItem('insightgov-demo-mode');

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'Une erreur inattendue s\'est produite' };
    }
  }, [enableDemoMode]);

  // Sign up - creates user via API
  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: metadata?.first_name,
          lastName: metadata?.last_name,
          organizationName: metadata?.organization_name,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { error: data.error || 'Erreur lors de l\'inscription' };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'Une erreur inattendue s\'est produite' };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setIsDemoMode(false);
    localStorage.removeItem('insightgov-demo-mode');
    try {
      await nextAuthSignOut({ redirect: false });
    } catch (error) {
      console.error('Sign out error:', error);
    }
    router.push('/login');
  }, [router]);

  // Reset password - sends reset email
  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { error: data.error || 'Erreur lors de l\'envoi' };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Une erreur inattendue s\'est produite' };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { error: data.error || 'Erreur lors de la mise à jour' };
      }

      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'Une erreur inattendue s\'est produite' };
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error('Refresh session error:', error);
    }
  }, [update]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        organizationId,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
        isDemoMode,
        enableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Main provider wrapper with error handling
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Don't refetch on window focus to avoid unnecessary requests
      refetchOnWindowFocus={false}
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  );
}

// Hook to use authentication
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

// Helper function to get user-friendly error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Email ou mot de passe incorrect';
    case 'Email not confirmed':
      return 'Veuillez confirmer votre email avant de vous connecter';
    case 'Too many requests':
      return 'Trop de tentatives. Veuillez réessayer dans quelques minutes';
    default:
      return error || 'Erreur de connexion';
  }
}

export default AuthProvider;
