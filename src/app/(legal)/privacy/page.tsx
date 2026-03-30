/**
 * InsightGov Africa - Privacy Policy Page
 * =========================================
 * Politique de Confidentialité pour la plateforme SaaS InsightGov Africa.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  ArrowLeft,
  Database,
  Eye,
  Server,
  Cookie,
  Users,
  UserCheck,
  Mail,
  Calendar,
  Lock,
  Globe,
  Shield,
  FileText,
} from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">InsightGov Africa</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Card className="mb-8">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Politique de Confidentialité</CardTitle>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Calendar className="w-4 h-4" />
              <span>Dernière mise à jour : 15 Janvier 2025</span>
            </div>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-8">
              Nous nous engageons à protéger la vie privée de nos utilisateurs. Cette politique décrit comment InsightGov Africa collecte, utilise et protège vos informations.
            </p>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Table des Matières</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'introduction', title: '1. Introduction' },
                { id: 'collecte', title: '2. Collecte des Données' },
                { id: 'utilisation', title: '3. Utilisation des Données' },
                { id: 'stockage', title: '4. Stockage et Sécurité' },
                { id: 'cookies', title: '5. Cookies et Technologies Similaires' },
                { id: 'tiers', title: '6. Services Tiers' },
                { id: 'droits', title: '7. Vos Droits' },
                { id: 'transfert', title: '8. Transferts Internationaux' },
                { id: 'enfants', title: '9. Protection des Mineurs' },
                { id: 'modifications', title: '10. Modifications' },
                { id: 'contact', title: '11. Contact DPO' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-primary hover:underline text-sm py-1"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Section 1: Introduction */}
        <Card className="mb-6" id="introduction">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              1. Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              InsightGov Africa SARL (&quot;nous&quot;, &quot;notre&quot;, ou &quot;la Société&quot;) exploite la plateforme InsightGov Africa, une solution SaaS d&apos;analyse de données et de génération de tableaux de bord destinée aux organisations africaines.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Cette Politique de Confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations personnelles lorsque vous utilisez nos services. Elle s&apos;applique à tous les utilisateurs de notre plateforme, site web et services associés.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Conformité Réglementaire</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Nous nous conformons aux réglementations de protection des données applicables en Afrique, incluant :
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                <li>Loi sénégalaise sur la protection des données à caractère personnel</li>
                <li>NDPR (Nigeria Data Protection Regulation)</li>
                <li>Kenya Data Protection Act 2019</li>
                <li>RGPD pour les utilisateurs de l&apos;Union Européenne</li>
                <li>Autres lois nationales applicables</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Data Collection */}
        <Card className="mb-6" id="collecte">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              2. Collecte des Données
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Données que vous fournissez directement</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Lors de l&apos;inscription et de l&apos;utilisation de nos services, nous collectons :
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Informations de compte</h5>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Nom et prénom</li>
                <li>Adresse email professionnelle</li>
                <li>Numéro de téléphone (optionnel)</li>
                <li>Nom de l&apos;organisation</li>
                <li>Type d&apos;organisation (Ministère, ONG, Entreprise, etc.)</li>
                <li>Pays et région</li>
                <li>Mot de passe (chiffré)</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Données importées</h5>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Fichiers de données (CSV, Excel, JSON)</li>
                <li>Métadonnées des fichiers (nom, taille, date)</li>
                <li>Tableaux de bord et configurations</li>
                <li>Rapports générés</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Informations de paiement</h5>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Historique des transactions</li>
                <li>Moyens de paiement utilisés</li>
                <li>Factures et informations de facturation</li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                * Les données bancaires complètes sont traitées par Paystack et ne sont pas stockées sur nos serveurs.
              </p>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Données collectées automatiquement</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous collectons automatiquement certaines informations lorsque vous utilisez la plateforme :
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Adresse IP et localisation approximative</li>
                <li>Type de navigateur et système d&apos;exploitation</li>
                <li>Pages visitées et actions effectuées</li>
                <li>Date et heure des accès</li>
                <li>Identifiants de session</li>
                <li>Données de performance de l&apos;application</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Data Usage */}
        <Card className="mb-6" id="utilisation">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              3. Utilisation des Données
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Nous utilisons vos données personnelles aux fins suivantes :
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold text-gray-900 dark:text-white">Fourniture des Services</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Création de compte, analyse de données, génération de tableaux de bord, support technique.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold text-gray-900 dark:text-white">Amélioration de la Plateforme</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Analyse de l&apos;utilisation, amélioration des fonctionnalités, développement de nouveaux services.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold text-gray-900 dark:text-white">Communication</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Envoi de notifications, mises à jour de service, newsletters (avec votre consentement).
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold text-gray-900 dark:text-white">Sécurité</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Détection de fraudes, prévention des abus, protection du compte.
                </p>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h5 className="font-semibold text-gray-900 dark:text-white">Conformité Légale</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Respect des obligations légales, réponse aux demandes des autorités compétentes.
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Base Légale du Traitement</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Notre traitement de vos données personnelles repose sur :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li><strong>L&apos;exécution du contrat</strong> : Pour fournir les services souscrits</li>
              <li><strong>Le consentement</strong> : Pour les communications marketing et certains cookies</li>
              <li><strong>L&apos;intérêt légitime</strong> : Pour améliorer nos services et assurer la sécurité</li>
              <li><strong>L&apos;obligation légale</strong> : Pour respecter les lois applicables</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 4: Storage and Security */}
        <Card className="mb-6" id="stockage">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Server className="w-5 h-5 text-primary" />
              </div>
              4. Stockage et Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Localisation des Données</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vos données sont principalement stockées sur des serveurs situés en Europe (Allemagne et France), avec des serveurs de sauvegarde en Afrique du Sud. Cette architecture garantit :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Haute disponibilité des services</li>
              <li>Faible latence pour les utilisateurs africains</li>
              <li>Conformité aux exigences réglementaires</li>
            </ul>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mesures de Sécurité</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous implémentons des mesures de sécurité techniques et organisationnelles robustes :
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sécurité Technique</h5>
                <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Chiffrement TLS 1.3 en transit</li>
                  <li>Chiffrement AES-256 au repos</li>
                  <li>Authentification multi-facteurs</li>
                  <li>Pare-feu et systèmes IDS/IPS</li>
                  <li>Tests de pénétration réguliers</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sécurité Organisationnelle</h5>
                <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Accès restreint aux données</li>
                  <li>Formation continue du personnel</li>
                  <li>Politiques de sécurité documentées</li>
                  <li>Audits de sécurité réguliers</li>
                  <li>Plan de réponse aux incidents</li>
                </ul>
              </div>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Durée de Conservation</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-900 dark:text-white">Type de Données</th>
                    <th className="text-left py-2 text-gray-900 dark:text-white">Durée de Conservation</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr className="border-b">
                    <td className="py-2">Données de compte</td>
                    <td className="py-2">Durée de l&apos;abonnement + 90 jours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Données importées</td>
                    <td className="py-2">Durée de l&apos;abonnement + 90 jours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Logs de connexion</td>
                    <td className="py-2">12 mois</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Données de facturation</td>
                    <td className="py-2">7 ans (obligation légale)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Données anonymisées</td>
                    <td className="py-2">Illimitée</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Cookies */}
        <Card className="mb-6" id="cookies">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              5. Cookies et Technologies Similaires
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Nous utilisons des cookies et technologies similaires pour améliorer votre expérience et analyser l&apos;utilisation de nos services.
            </p>

            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Cookies Essentiels</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Nécessaires au fonctionnement de la plateforme. Ne peuvent pas être désactivés.
                </p>
                <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>Authentification de session</li>
                  <li>Préférences de sécurité</li>
                  <li>Fonctionnalités de base</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Cookies de Performance</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Aident à améliorer les performances du site. Acceptés par défaut, peuvent être refusés.
                </p>
                <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>Analyse de navigation</li>
                  <li>Mesure de performance</li>
                  <li>Détection d&apos;erreurs</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Cookies de Fonctionnalité</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  Permettent de mémoriser vos préférences. Optionnels.
                </p>
                <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 list-disc list-inside">
                  <li>Préférences linguistiques</li>
                  <li>Paramètres d&apos;affichage</li>
                  <li>Personnalisation de l&apos;interface</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Gestion des cookies :</strong> Vous pouvez gérer vos préférences de cookies à tout moment via notre bannière de consentement ou les paramètres de votre navigateur.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Third-party Services */}
        <Card className="mb-6" id="tiers">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              6. Services Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Nous utilisons des services tiers qui peuvent collecter certaines données :
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-3 px-4 border text-gray-900 dark:text-white">Service</th>
                    <th className="text-left py-3 px-4 border text-gray-900 dark:text-white">Finalité</th>
                    <th className="text-left py-3 px-4 border text-gray-900 dark:text-white">Données</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr>
                    <td className="py-3 px-4 border">Paystack</td>
                    <td className="py-3 px-4 border">Paiements</td>
                    <td className="py-3 px-4 border">Transaction, carte bancaire</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border">Google Analytics</td>
                    <td className="py-3 px-4 border">Analyse d&apos;audience</td>
                    <td className="py-3 px-4 border">Navigation, appareil</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border">SendGrid</td>
                    <td className="py-3 px-4 border">Emails transactionnels</td>
                    <td className="py-3 px-4 border">Email, logs d&apos;envoi</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border">AWS</td>
                    <td className="py-3 px-4 border">Infrastructure cloud</td>
                    <td className="py-3 px-4 border">Données hébergées</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 border">Sentry</td>
                    <td className="py-3 px-4 border">Surveillance erreurs</td>
                    <td className="py-3 px-4 border">Logs techniques</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Ces tiers sont soumis à des accords de confidentialité et sont tenus de respecter les normes de protection des données applicables.
            </p>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Partage avec votre consentement</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous ne partageons vos données avec des tiers qu&apos;avec votre consentement explicite, notamment pour :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Intégrations avec d&apos;autres outils que vous connectez</li>
              <li>Partage de rapports avec des collaborateurs externes</li>
              <li>Services de conseil autorisés</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 7: User Rights */}
        <Card className="mb-6" id="droits">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              7. Vos Droits
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Conformément aux réglementations applicables, vous disposez des droits suivants concernant vos données personnelles :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit d&apos;Accès</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Obtenir une copie de toutes les données personnelles que nous détenons sur vous.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit de Rectification</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Corriger les données inexactes ou incomplètes vous concernant.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit à l&apos;Effacement</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Demander la suppression de vos données personnelles (&quot;droit à l&apos;oubli&quot;).
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit à la Portabilité</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Recevoir vos données dans un format structuré et lisible par machine.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit d&apos;Opposition</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Vous opposer au traitement de vos données dans certaines circonstances.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Droit à la Limitation</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Demander la suspension temporaire du traitement de vos données.
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Comment exercer vos droits</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Pour exercer ces droits, vous pouvez :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Accéder à vos paramètres de compte depuis la plateforme</li>
              <li>Nous contacter à : privacy@insightgov.africa</li>
              <li>Envoyer une demande écrite à notre DPO</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Nous répondrons à votre demande dans un délai de 30 jours. Une pièce d&apos;identité pourra être demandée pour vérifier votre identité.
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Réclamation :</strong> Si vous estimez que le traitement de vos données personnelles constitue une violation de vos droits, vous avez le droit d&apos;introduire une réclamation auprès de l&apos;autorité de protection des données de votre pays.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: International Transfers */}
        <Card className="mb-6" id="transfert">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              8. Transferts Internationaux de Données
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Vos données peuvent être transférées et stockées dans des pays situés en dehors de votre pays de résidence, notamment :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Europe (Allemagne, France) - pour le stockage principal</li>
              <li>Afrique du Sud - pour les sauvegardes</li>
              <li>États-Unis - pour certains services tiers (avec garanties appropriées)</li>
            </ul>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Garanties</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous assurons que ces transferts sont effectués conformément aux exigences légales :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Clauses contractuelles types de l&apos;UE</li>
              <li>Certifications appropriées (ex: Data Privacy Framework)</li>
              <li>Accords de transfert de données avec les sous-traitants</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 9: Children */}
        <Card className="mb-6" id="enfants">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              9. Protection des Mineurs
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Nos services sont destinés aux organisations professionnelles et ne s&apos;adressent pas aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles auprès de mineurs.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Si vous avez connaissance qu&apos;un mineur nous a fourni des données personnelles, veuillez nous contacter immédiatement. Nous prendrons les mesures nécessaires pour supprimer ces informations.
            </p>
          </CardContent>
        </Card>

        {/* Section 10: Modifications */}
        <Card className="mb-6" id="modifications">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              10. Modifications de la Politique
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. En cas de modification significative :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Vous serez informé par email et/ou notification dans la plateforme</li>
              <li>La date de &quot;Dernière mise à jour&quot; sera révisée</li>
              <li>Un consentement pourra être demandé si requis par la loi</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques de confidentialité.
            </p>
          </CardContent>
        </Card>

        {/* Section 11: Contact DPO */}
        <Card className="mb-8" id="contact">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              11. Contact du Délégué à la Protection des Données
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Pour toute question concernant cette politique ou vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données (DPO) :
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">DPO InsightGov Africa</h5>
                  <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                    <li><strong>Email :</strong> dpo@insightgov.africa</li>
                    <li><strong>Téléphone :</strong> +221 33 123 45 67</li>
                    <li><strong>Fax :</strong> +221 33 123 45 68</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Adresse Postale</h5>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    InsightGov Africa SARL<br />
                    Délégué à la Protection des Données<br />
                    Plateau, Dakar<br />
                    Sénégal
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Autorités de Protection des Données</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous pouvez également contacter l&apos;autorité de protection des données de votre pays :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">Sénégal</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">Commission de Protection des Données à Caractère Personnel (CDP)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">Nigeria</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">National Information Technology Development Agency (NITDA)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">Kenya</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">Office of the Data Protection Commissioner</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">Afrique du Sud</h5>
                <p className="text-gray-700 dark:text-gray-300 text-sm">Information Regulator of South Africa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l&apos;accueil
            </Link>
          </Button>
          <Button asChild>
            <Link href="/terms">
              Consulter les Conditions d&apos;Utilisation
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 InsightGov Africa. Tous droits réservés.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="text-sm text-primary hover:underline">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/privacy" className="text-sm text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
