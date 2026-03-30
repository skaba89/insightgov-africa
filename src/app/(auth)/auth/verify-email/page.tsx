/**
 * InsightGov Africa - Email Verification Page
 * ============================================
 * Page displayed after email verification or when there's an error.
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const error = searchParams.get('error');
  const token = searchParams.get('token');
  const verified = searchParams.get('verified');

  useEffect(() => {
    if (verified === 'true') {
      setStatus('success');
      setMessage('Votre email a été vérifié avec succès !');
      return;
    }

    if (error) {
      setStatus('error');
      switch (error) {
        case 'missing_token':
          setMessage('Token de vérification manquant.');
          break;
        case 'invalid_token':
          setMessage('Le lien de vérification est invalide ou a expiré.');
          setStatus('resend');
          break;
        case 'server_error':
          setMessage('Une erreur serveur est survenue. Veuillez réessayer.');
          break;
        default:
          setMessage('Une erreur est survenue lors de la vérification.');
      }
      return;
    }

    if (token) {
      // Verify the token
      verifyEmail(token);
    } else {
      // Show resend form
      setStatus('resend');
    }
  }, [error, token, verified]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de la vérification');
        setStatus('resend');
      }
    } catch {
      setStatus('error');
      setMessage('Erreur de connexion au serveur');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Veuillez entrer votre adresse email');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage('Un nouveau lien de vérification a été envoyé à votre email.');
      } else {
        setMessage(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setMessage('Erreur de connexion au serveur');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Vérification Email</CardTitle>
            <CardDescription className="mt-2">
              {status === 'loading' && 'Vérification en cours...'}
              {status === 'success' && 'Email vérifié !'}
              {status === 'error' && 'Erreur de vérification'}
              {status === 'resend' && 'Renvoyer le lien de vérification'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            )}
            {status === 'resend' && (
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Mail className="w-10 h-10 text-amber-500" />
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <Alert
              variant={status === 'success' ? 'default' : 'destructive'}
              className={
                status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20'
                  : undefined
              }
            >
              <AlertDescription className="text-center">{message}</AlertDescription>
            </Alert>
          )}

          {/* Resend Form */}
          {status === 'resend' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800"
                />
              </div>
              <Button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Renvoyer le lien de vérification'
                )}
              </Button>
            </div>
          )}

          {/* Actions */}
          {status === 'success' && (
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Se connecter
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <Button
                onClick={() => setStatus('resend')}
                variant="outline"
                className="w-full"
              >
                Renvoyer le lien
              </Button>
            </div>
          )}

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
