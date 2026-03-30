/**
 * InsightGov Africa - Signup Page
 * ================================
 * Page d'inscription avec NextAuth.
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart3,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, isAuthenticated, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        organization_name: formData.organizationName,
      });

      if (error) {
        setError(error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <header className="p-4">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Compte créé avec succès !</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre compte a été créé. Vous pouvez maintenant vous connecter.
              </p>
              <Button onClick={() => router.push('/login')}>
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="p-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
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
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez InsightGov Africa et commencez à créer vos dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Amadou"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Diallo"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Organization Field */}
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nom de l'organisation</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="Ministère de la Santé"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 caractères"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Répétez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  J'accepte les{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </Label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
