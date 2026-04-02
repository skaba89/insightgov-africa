// ============================================
// InsightGov Africa - Page d'Erreur Auth
// ============================================

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Erreur de configuration du serveur. Contactez le support.',
  AccessDenied: 'Accès refusé. Vérifiez vos identifiants.',
  Verification: 'La vérification a échoué. Réessayez.',
  Default: 'Une erreur d\'authentification est survenue.',
  OAuthAccountNotLinked: 'Cet email est déjà associé à un autre compte.',
  OAuthSignin: 'Erreur lors de la connexion OAuth.',
  OAuthCallback: 'Erreur lors du callback OAuth.',
  EmailSignin: 'Erreur lors de l\'envoi de l\'email.',
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  SessionRequired: 'Vous devez être connecté pour accéder à cette page.',
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">IG</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">InsightGov</h1>
          <p className="text-sm text-emerald-600 font-medium">Africa</p>
        </div>
      </motion.div>

      {/* Error Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Erreur d'authentification</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Link href="/auth/login">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-500">
          Problème persistant ?{' '}
          <a href="mailto:support@insightgov.africa" className="text-emerald-600 hover:underline">
            Contactez le support
          </a>
        </p>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
