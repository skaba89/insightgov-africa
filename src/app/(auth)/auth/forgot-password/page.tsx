/**
 * InsightGov Africa - Forgot Password Page
 * ==========================================
 * Page de demande de réinitialisation de mot de passe.
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  Mail,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill email from query param
  const prefillEmail = searchParams.get('email') || '';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur s\'est produite');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques instants.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  N&apos;oubliez pas de vérifier vos spams si vous ne trouvez pas l&apos;email.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/login')}
                >
                  Retour à la connexion
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email || prefillEmail}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </Button>

                {/* Back to Login Link */}
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Retour à la connexion
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-500">
        © 2024 InsightGov Africa. Tous droits réservés.
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
