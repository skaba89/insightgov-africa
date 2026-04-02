// ============================================
// InsightGov Africa - Page d'Inscription
// Création de compte avec organisation
// ============================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Building2,
  User,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrganizationType, SECTORS } from '@/types';
import { cn } from '@/lib/utils';

const ORG_TYPES = [
  { value: OrganizationType.MINISTRY, label: 'Ministère / Gouvernement', icon: '🏛️' },
  { value: OrganizationType.NGO, label: 'ONG / International', icon: '❤️' },
  { value: OrganizationType.ENTERPRISE, label: 'Entreprise Privée', icon: '🏢' },
  { value: OrganizationType.ACADEMIC, label: 'Institution Académique', icon: '🎓' },
];

const AFRICAN_COUNTRIES = [
  'Cameroun', 'Sénégal', 'Côte d\'Ivoire', 'Ghana', 'Nigeria', 'Kenya',
  'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'RDC', 'Tunisie', 'Maroc', 'Algérie',
  'Guinée', 'Niger', 'Tchad', 'Congo', 'Gabon', 'Cameroun', 'Madagascar',
];

export function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organizationName: '',
    organizationType: OrganizationType.MINISTRY,
    sector: 'health',
    country: 'Cameroun',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/auth/login?registered=true');
      } else {
        setError(data.error || 'Erreur lors de l\'inscription');
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">IG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">InsightGov</h1>
            <p className="text-xs text-emerald-600 font-medium">Africa</p>
          </div>
        </div>

        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-center">Créer un compte</h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Étape {step} sur 2
            </p>
          </div>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Personal info */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Votre nom</Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="Jean Dupont"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setStep(2)}
                  >
                    Suivant
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Organization info */}
                  <div className="space-y-2">
                    <Label>Type d'organisation</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ORG_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, organizationType: type.value })}
                          className={cn(
                            'p-3 rounded-lg border-2 text-sm text-left transition-all',
                            formData.organizationType === type.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-emerald-300'
                          )}
                        >
                          <span className="text-lg">{type.icon}</span>
                          <span className="ml-2">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Nom de l'organisation</Label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="organizationName"
                        placeholder="Ministère de la Santé"
                        value={formData.organizationName}
                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sector">Secteur d'activité</Label>
                    <select
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-gray-300"
                    >
                      {SECTORS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.icon} {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full h-10 px-3 pl-10 rounded-lg border border-gray-300"
                      >
                        {AFRICAN_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Créer mon compte'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>

            <div className="text-center pt-4 border-t mt-4">
              <p className="text-sm text-gray-600">
                Déjà un compte?{' '}
                <a href="/auth/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Se connecter
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
