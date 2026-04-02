/**
 * InsightGov Africa - Dashboard Page
 * ====================================
 * Page principale du dashboard (protégée).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  BarChart3,
  Database,
  Settings,
  LogOut,
  Crown,
  Building2,
  Plus,
} from 'lucide-react';
import { useSubscription } from '@/contexts/subscription-context';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { tier, organizationId, setOrganizationId } = useSubscription();
  const { 
    analysisResult, 
    organizationName,
    organizationType,
    sector,
    reset 
  } = useOnboardingStore();

  // Rediriger si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  // Mettre à jour l'ID d'organisation dans le context subscription
  useEffect(() => {
    if (user?.organizationId) {
      setOrganizationId(user.organizationId);
    }
  }, [user, setOrganizationId]);

  // Gérer la déconnexion
  const handleSignOut = async () => {
    await signOut();
    reset();
    router.push('/');
  };

  // Nouveau dashboard
  const handleNewDashboard = () => {
    reset();
    router.push('/');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non authentifié (sera redirigé)
  if (!user) {
    return null;
  }

  // Si on a un résultat d'analyse, afficher le dashboard
  if (analysisResult) {
    return (
      <DashboardContainer
        config={analysisResult}
        organizationName={organizationName || 'Organisation'}
        subscriptionTier={tier}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  // Sinon, afficher la page d'accueil du dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  InsightGov Africa
                </h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {organizationName || 'Organisation'}
                  </p>
                </div>
              </div>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>

              {/* Sign Out */}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bienvenue, {user.name?.split(' ')[0] || 'Utilisateur'} !
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos dashboards et données depuis cet espace.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* New Dashboard */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNewDashboard}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Nouveau Dashboard</h3>
                  <p className="text-sm text-gray-500">Créer à partir de vos données</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Datasets */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Mes Données</h3>
                  <p className="text-sm text-gray-500">0 dataset</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Abonnement</h3>
                  <p className="text-sm text-gray-500 capitalize">{tier}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Commencer
            </CardTitle>
            <CardDescription>
              Créez votre premier dashboard en quelques minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Importez vos données</h4>
                  <p className="text-sm text-gray-500">
                    Uploadez un fichier CSV ou Excel
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">L'IA analyse vos données</h4>
                  <p className="text-sm text-gray-500">
                    Détection automatique des KPIs pertinents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Exportez et partagez</h4>
                  <p className="text-sm text-gray-500">
                    PDF, Excel, et liens de partage
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" onClick={handleNewDashboard}>
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
