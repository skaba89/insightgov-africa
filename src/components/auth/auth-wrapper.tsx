// ============================================
// InsightGov Africa - Auth Wrapper
// Gestion de l'état d'authentification
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  LogOut,
  User,
  Loader2,
  AlertCircle,
  Shield,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import LandingPage from '@/components/marketing/landing-page';

// ============================================
// ÉCRAN DE CHARGEMENT
// ============================================

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">IG</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">InsightGov</h1>
          <p className="text-sm text-emerald-600 font-medium">Africa</p>
        </div>
      </motion.div>

      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      <p className="text-gray-500 mt-4">Chargement...</p>
    </div>
  );
}

// ============================================
// MODAL DE LOGIN
// ============================================

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: email.split('@')[0] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur d\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <Card className="border-0 shadow-2xl">
              <CardHeader className="relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <CardTitle>
                  {isRegistering ? 'Créer un compte' : 'Connexion'}
                </CardTitle>
                <CardDescription>
                  {isRegistering
                    ? 'Créez votre compte pour commencer'
                    : 'Connectez-vous à votre espace'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@organisation.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isRegistering ? (
                      'Créer mon compte'
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    {isRegistering
                      ? 'Déjà un compte ? Se connecter'
                      : 'Pas de compte ? Créer un compte'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// FLOATING LOGIN BUTTON
// ============================================

function FloatingLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 right-8 z-40"
    >
      <Button
        onClick={onClick}
        size="lg"
        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg rounded-full px-8"
      >
        <LogIn className="w-5 h-5 mr-2" />
        Se connecter
      </Button>
    </motion.div>
  );
}

// ============================================
// DEMO BANNER
// ============================================

function DemoBanner({ onLogin, onExit }: { onLogin: () => void; onExit: () => void }) {
  return (
    <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-4 text-sm">
      <Shield className="w-4 h-4" />
      <span>Mode Démonstration - Données fictives</span>
      <Button
        variant="outline"
        size="sm"
        onClick={onLogin}
        className="bg-white/20 border-white/30 text-white hover:bg-white/30"
      >
        Se connecter
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="text-white hover:bg-white/20"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ============================================
// AUTH WRAPPER
// ============================================

interface AuthWrapperProps {
  children: React.ReactNode;
  demoMode?: boolean;
  onEnableDemoMode?: () => void;
}

export function AuthWrapper({ children, demoMode, onEnableDemoMode }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const { setCurrentOrganization, currentOrganization } = useAppStore();
  const [isDemoMode, setIsDemoMode] = useState(demoMode);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Activer le mode démo
  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setCurrentOrganization({
      id: 'demo-org',
      name: 'Organisation de Démonstration',
      type: 'OTHER',
      sector: 'health',
      subscriptionTier: 'FREE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [setCurrentOrganization]);

  // Désactiver le mode démo
  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setCurrentOrganization(null);
  }, [setCurrentOrganization]);

  // Succès de connexion
  const handleLoginSuccess = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  // Synchroniser l'organisation avec la session
  useEffect(() => {
    if (session?.user && !currentOrganization) {
      setCurrentOrganization({
        id: (session.user as any).organizationId || 'demo-org',
        name: 'Mon Organisation',
        type: 'OTHER',
        sector: 'general',
        subscriptionTier: 'FREE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [session, currentOrganization, setCurrentOrganization]);

  // État de chargement
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  // Mode démo activé
  if (isDemoMode) {
    return (
      <>
        <DemoBanner
          onLogin={() => setShowLoginModal(true)}
          onExit={exitDemoMode}
        />
        {children}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // Non authentifié - Afficher la landing page
  if (status === 'unauthenticated') {
    return (
      <>
        <LandingPage />
        <FloatingLoginButton onClick={() => setShowLoginModal(true)} />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  // Authentifié
  return <>{children}</>;
}

export default AuthWrapper;
