// ============================================
// InsightGov Africa - Politique de Confidentialité
// RGPD et Protection des Données
// ============================================

import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Database, UserCheck, Bell, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | InsightGov Africa',
  description: 'Politique de protection des données personnelles et confidentialité',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">
            RGPD Compliant
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-600">
            Comment InsightGov Africa collecte, utilise et protège vos données
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Données chiffrées</h3>
          </Card>
          <Card className="text-center p-4">
            <Lock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Accès sécurisé</h3>
          </Card>
          <Card className="text-center p-4">
            <UserCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm">Vos droits respectés</h3>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Responsable du Traitement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                <strong>InsightGov Africa</strong> est le responsable du traitement des données
                personnelles collectées via la plateforme.
              </p>
              <p>
                <strong>Contact DPO</strong> : dpo@insightgov.africa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Données Collectées</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p><strong>Données d'inscription :</strong></p>
              <ul>
                <li>Nom et prénom</li>
                <li>Adresse email professionnelle</li>
                <li>Nom de l'organisation</li>
                <li>Type d'organisation (Ministère, ONG, Entreprise)</li>
                <li>Pays et secteur d'activité</li>
              </ul>

              <p><strong>Données d'utilisation :</strong></p>
              <ul>
                <li>Fichiers de données importés (CSV, Excel)</li>
                <li>Dashboards et KPIs générés</li>
                <li>Logs de connexion et d'activité</li>
                <li>Préférences utilisateur</li>
              </ul>

              <p><strong>Données de paiement :</strong></p>
              <ul>
                <li>Historique des transactions (via Paystack)</li>
                <li>Informations de facturation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Finalités du Traitement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Finalité</th>
                    <th className="text-left py-2">Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Fourniture du service</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Gestion du compte</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Facturation</td>
                    <td className="py-2">Obligation légale</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Amélioration du service</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="py-2">Marketing (avec consentement)</td>
                    <td className="py-2">Consentement</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">4. Conservation des Données</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type de données</th>
                    <th className="text-left py-2">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Données de compte</td>
                    <td className="py-2">Durée de l'abonnement + 3 ans</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Fichiers importés</td>
                    <td className="py-2">Durée de l'abonnement + 30 jours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Logs de connexion</td>
                    <td className="py-2">12 mois</td>
                  </tr>
                  <tr>
                    <td className="py-2">Données de facturation</td>
                    <td className="py-2">10 ans (obligation légale)</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">5. Vos Droits (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul>
                <li><strong>Droit d'accès</strong> : Obtenir une copie de vos données</li>
                <li><strong>Droit de rectification</strong> : Corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement</strong> : Demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité</strong> : Recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition</strong> : Vous opposer à certains traitements</li>
                <li><strong>Droit de limitation</strong> : Limiter le traitement de vos données</li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à : <strong>privacy@insightgov.africa</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">6. Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>Nous mettons en œuvre les mesures de sécurité suivantes :</p>
              <ul>
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Chiffrement des données au repos (AES-256)</li>
                <li>Authentification sécurisée avec hachage bcrypt</li>
                <li>Accès restreint aux données (principe du moindre privilège)</li>
                <li>Audit régulier de sécurité</li>
                <li>Sauvegardes quotidiennes chiffrées</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">7. Transferts Internationaux</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Les données peuvent être hébergées sur des serveurs situés en Europe (UE).
                En cas de transfert vers un pays tiers, nous nous assurons que des garanties
                appropriées sont mises en place (clauses contractuelles types, décision d'adéquation).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">8. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p><strong>Délégué à la Protection des Données (DPO)</strong></p>
              <p>Email : dpo@insightgov.africa</p>
              <p>Adresse : Douala, Cameroun</p>
              <p className="mt-4">
                Vous avez également le droit d'introduire une réclamation auprès de la CNIL
                (Commission Nationale de l'Informatique et des Libertés) ou de l'autorité
                de protection des données de votre pays.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
