// ============================================
// InsightGov Africa - Page Dashboard Partagé
// Accès public sans authentification
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardRenderer } from '@/components/dashboard/dashboard-renderer';
import { Kpi } from '@/types';

interface SharedDashboardData {
  dashboard: {
    id: string;
    title: string;
    description: string | null;
    layoutConfig: string;
  };
  dataset: {
    name: string;
    rowCount: number;
    columnCount: number;
    columnsMetadata: string;
  };
  kpis: Kpi[];
  rawData: any[];
}

export default function SharedDashboardPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedDashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/share/${token}`);

        if (!response.ok) {
          throw new Error('Dashboard non trouvé');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">IG</span>
          </div>
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Dashboard non disponible
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'Ce lien de partage est invalide ou a expiré.'}
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ExternalLink className="w-4 h-4 mr-2" />
              Découvrir InsightGov Africa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = typeof data.dataset.columnsMetadata === 'string'
    ? JSON.parse(data.dataset.columnsMetadata)
    : data.dataset.columnsMetadata;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IG</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{data.dashboard.title}</h1>
                <p className="text-xs text-gray-500">{data.dataset.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                <Share2 className="w-3 h-3 mr-1" />
                Dashboard partagé
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Créer le mien
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="bg-emerald-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">{data.kpis.length} KPIs</span>
            </div>
            <div className="text-emerald-100">
              <span className="font-semibold text-white">{data.dataset.rowCount.toLocaleString()}</span> lignes
            </div>
            <div className="text-emerald-100">
              <span className="font-semibold text-white">{data.dataset.columnCount}</span> colonnes
            </div>
            {data.dashboard.description && (
              <p className="text-emerald-100 text-sm hidden md:block">
                {data.dashboard.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DashboardRenderer
            kpis={data.kpis}
            rawData={data.rawData}
            columns={columns}
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IG</span>
              </div>
              <div>
                <span className="font-medium text-gray-900">InsightGov Africa</span>
                <p className="text-xs text-gray-500">La plateforme de dashboards IA pour l'Afrique</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Powered by <span className="font-medium text-emerald-600">InsightGov</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
