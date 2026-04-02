// ============================================
// InsightGov Africa - Page CGU/CGV
// Conditions Générales d'Utilisation et de Vente
// ============================================

import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Conditions Générales | InsightGov Africa',
  description: 'Conditions Générales d\'Utilisation et de Vente d\'InsightGov Africa',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">
            Version 1.0 - Mars 2026
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation et de Vente
          </h1>
          <p className="text-gray-600">
            Les présentes conditions régissent l'utilisation de la plateforme InsightGov Africa.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Objet</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                InsightGov Africa est une plateforme SaaS de génération automatique de tableaux de bord
                et d'analyses de données par intelligence artificielle, destinée aux organisations
                opérant sur le continent africain (Ministères, ONG, Entreprises, Institutions académiques).
              </p>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) et de Vente (CGV) ont pour objet
                de définir les modalités et conditions d'utilisation de la plateforme, ainsi que de
                définir les droits et obligations des parties dans le cadre de l'abonnement aux services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Définitions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <ul>
                <li><strong>Plateforme</strong> : Désigne le service InsightGov Africa accessible via son site web.</li>
                <li><strong>Utilisateur</strong> : Toute personne physique ou morale utilisant la plateforme.</li>
                <li><strong>Organisation</strong> : Entité juridique (Ministère, ONG, Entreprise) cliente de la plateforme.</li>
                <li><strong>Dashboard</strong> : Tableau de bord généré automatiquement à partir des données importées.</li>
                <li><strong>KPI</strong> : Indicateur clé de performance généré par l'intelligence artificielle.</li>
                <li><strong>Abonnement</strong> : Contrat d'accès à la plateforme pour une durée déterminée.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Inscription et Compte</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p><strong>3.1 Conditions d'inscription</strong></p>
              <p>
                L'inscription à la plateforme est réservée aux organisations légalement constituées.
                L'utilisateur représentant l'organisation doit avoir l'autorisation de celle-ci pour
                créer un compte et souscrire un abonnement.
              </p>

              <p><strong>3.2 Informations requises</strong></p>
              <p>
                Lors de l'inscription, l'utilisateur s'engage à fournir des informations exactes,
                complètes et à jour concernant son identité et son organisation.
              </p>

              <p><strong>3.3 Sécurité du compte</strong></p>
              <p>
                L'utilisateur est responsable de la confidentialité de ses identifiants de connexion
                et de toute activité sur son compte. Toute utilisation non autorisée doit être
                signalée immédiatement à InsightGov Africa.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">4. Services Proposés</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p><strong>4.1 Fonctionnalités principales</strong></p>
              <ul>
                <li>Import de données (CSV, Excel)</li>
                <li>Analyse automatique par intelligence artificielle</li>
                <li>Génération de KPIs pertinents</li>
                <li>Création de tableaux de bord visuels</li>
                <li>Export des rapports (PDF, Excel)</li>
                <li>Partage de dashboards</li>
              </ul>

              <p><strong>4.2 Limites des services</strong></p>
              <p>
                Les limites varient selon le plan d'abonnement souscrit (nombre de datasets,
                d'utilisateurs, d'exports mensuels). Ces limites sont détaillées sur la page
                de tarification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">5. Tarification et Paiement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p><strong>5.1 Plans tarifaires</strong></p>
              <p>
                InsightGov Africa propose plusieurs plans d'abonnement : Gratuit, Starter,
                Professionnel et Entreprise. Les tarifs sont indiqués en euros et peuvent
                être facturés en Francs CFA (XOF) sur demande.
              </p>

              <p><strong>5.2 Paiement</strong></p>
              <p>
                Le paiement des abonnements est effectué via Paystack, plateforme de paiement
                sécurisée. Les modes de paiement acceptés incluent les cartes bancaires,
                les virements et les paiements mobile money disponibles en Afrique.
              </p>

              <p><strong>5.3 Renouvellement et résiliation</strong></p>
              <p>
                Les abonnements sont renouvelés automatiquement à la fin de chaque période.
                Le client peut résilier à tout moment depuis son espace client.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">6. Propriété Intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Les données importées par l'utilisateur restent sa propriété exclusive.
                Les dashboards et rapports générés appartiennent à l'organisation cliente.
                InsightGov Africa conserve un droit d'utilisation anonymisé à des fins d'amélioration du service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">7. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>Pour toute question concernant ces conditions :</p>
              <ul>
                <li>Email : legal@insightgov.africa</li>
                <li>Adresse : Douala, Cameroun</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
