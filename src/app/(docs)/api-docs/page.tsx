// ============================================
// InsightGov Africa - API Documentation Page
// Interface Swagger UI interactive
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Book, Code, Database, Lock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ApiDocsPage() {
  const [SwaggerUI, setSwaggerUI] = useState<any>(null);

  useEffect(() => {
    // Dynamically import SwaggerUI
    import('swagger-ui-react').then((mod) => {
      setSwaggerUI(() => mod.default);
    });
  }, []);

  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'InsightGov Africa API',
      version: '1.0.0',
      description: 'API de la plateforme InsightGov Africa - Dashboards IA pour l\'Afrique',
    },
    servers: [{ url: '/api' }],
    paths: {
      '/datasets': {
        get: {
          tags: ['Datasets'],
          summary: 'Lister les datasets',
          responses: { '200': { description: 'Liste des datasets' } },
        },
        post: {
          tags: ['Datasets'],
          summary: 'Créer un dataset',
          responses: { '201': { description: 'Dataset créé' } },
        },
      },
      '/datasets/{id}': {
        get: {
          tags: ['Datasets'],
          summary: 'Obtenir un dataset',
          parameters: [{ name: 'id', in: 'path', required: true }],
          responses: { '200': { description: 'Détails du dataset' } },
        },
      },
      '/kpis': {
        get: { tags: ['KPIs'], summary: 'Lister les KPIs' },
      },
      '/organizations': {
        get: { tags: ['Organizations'], summary: 'Lister les organisations' },
        post: { tags: ['Organizations'], summary: 'Créer une organisation' },
      },
      '/payments/initialize': {
        post: { tags: ['Payments'], summary: 'Initialiser un paiement' },
      },
      '/payments/verify': {
        get: { tags: ['Payments'], summary: 'Vérifier un paiement' },
      },
      '/share/{token}': {
        get: { tags: ['Share'], summary: 'Dashboard partagé' },
      },
      '/demo/generate': {
        post: { tags: ['Demo'], summary: 'Générer données démo' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-xl">IG</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">InsightGov Africa API</h1>
              <p className="text-emerald-100">Documentation interactive</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Badge className="bg-white/20 text-white border-0">
              Version 1.0.0
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              OpenAPI 3.0
            </Badge>
            <Badge className="bg-white/20 text-white border-0">
              REST API
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="w-5 h-5 text-emerald-600" />
                  Guide rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Authentification</p>
                    <p className="text-gray-500">JWT via NextAuth.js</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-gray-500">100 req/min standard</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Database className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Format</p>
                    <p className="text-gray-500">JSON / Multipart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-600" />
                  Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Auth</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Datasets</span>
                  <Badge variant="outline">4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>KPIs</span>
                  <Badge variant="outline">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payments</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Share</span>
                  <Badge variant="outline">2</Badge>
                </div>
              </CardContent>
            </Card>

            <Link href="/">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Retour à l'app
              </Button>
            </Link>
          </div>

          {/* Main content - Swagger UI */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {SwaggerUI ? (
                  <SwaggerUI
                    spec={spec}
                    docExpansion="list"
                    defaultModelsExpandDepth={1}
                    defaultModelExpandDepth={1}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Chargement de la documentation...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional info */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authentification</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p className="mb-2">Incluez le token JWT dans le header:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">
                    Authorization: Bearer &lt;your_token&gt;
                  </code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rate Limits</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <ul className="space-y-1">
                    <li>• API: 100 requêtes/minute</li>
                    <li>• Auth: 5 tentatives/15 min</li>
                    <li>• Upload: 20/heure</li>
                    <li>• Export: 50/heure</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
