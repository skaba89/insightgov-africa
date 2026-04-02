/**
 * InsightGov Africa - Terms of Service Page
 * ===========================================
 * Conditions Générales d'Utilisation pour la plateforme SaaS InsightGov Africa.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  ArrowLeft,
  FileText,
  CreditCard,
  RefreshCw,
  Database,
  Shield,
  Ban,
  Scale,
  Mail,
  Calendar,
} from 'lucide-react';

export default function TermsPage() {
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
                <FileText className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Conditions Générales d&apos;Utilisation</CardTitle>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <Calendar className="w-4 h-4" />
              <span>Dernière mise à jour : 15 Janvier 2025</span>
            </div>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center mb-8">
              Veuillez lire attentivement ces conditions avant d&apos;utiliser la plateforme InsightGov Africa.
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
                { id: 'acceptation', title: '1. Acceptation des Conditions' },
                { id: 'services', title: '2. Description des Services' },
                { id: 'paiements', title: '3. Paiements et Tarification' },
                { id: 'abonnements', title: '4. Abonnements' },
                { id: 'donnees', title: '5. Utilisation des Données' },
                { id: 'responsabilites', title: '6. Responsabilités' },
                { id: 'proprietes', title: '7. Propriété Intellectuelle' },
                { id: 'terminaison', title: '8. Résiliation' },
                { id: 'limitation', title: '9. Limitation de Responsabilité' },
                { id: 'loi', title: '10. Droit Applicable' },
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

        {/* Section 1: Acceptation */}
        <Card className="mb-6" id="acceptation">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              1. Acceptation des Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              En accédant à et en utilisant la plateforme InsightGov Africa (&quot;la Plateforme&quot;), fournie par InsightGov Africa SARL (&quot;nous&quot;, &quot;notre&quot;, ou &quot;la Société&quot;), vous acceptez d&apos;être lié par ces Conditions Générales d&apos;Utilisation (&quot;CGU&quot;). Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Ces CGU constituent un accord légal entre vous et InsightGov Africa. Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication sur la Plateforme. Votre utilisation continue de la Plateforme après la publication des modifications constitue votre acceptation des nouvelles conditions.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important :</strong> En utilisant InsightGov Africa, vous confirmez que vous avez lu, compris et accepté d&apos;être lié par ces CGU ainsi que notre Politique de Confidentialité.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Services */}
        <Card className="mb-6" id="services">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              2. Description des Services
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              InsightGov Africa est une plateforme Software as a Service (SaaS) conçue pour aider les organisations africaines à analyser leurs données et générer des tableaux de bord automatisés. Nos services incluent :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-4 space-y-2">
              <li><strong>Analyse de données automatisée</strong> : Importation et analyse de fichiers de données (CSV, Excel, JSON) avec génération de KPIs pertinents</li>
              <li><strong>Tableaux de bord personnalisés</strong> : Création de visualisations interactives adaptées à votre secteur d&apos;activité</li>
              <li><strong>Intelligence artificielle</strong> : Suggestions automatiques de métriques et insights basés sur vos données</li>
              <li><strong>Collaboration d&apos;équipe</strong> : Partage de rapports et collaboration en temps réel</li>
              <li><strong>Export de rapports</strong> : Génération de rapports en PDF, Excel et autres formats</li>
              <li><strong>Intégrations</strong> : Connexion avec des sources de données externes et API</li>
            </ul>
            <h4 className="font-semibold text-gray-900 dark:text-white mt-6 mb-2">Restrictions d&apos;utilisation</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous vous engagez à ne pas utiliser la Plateforme pour :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Toute activité illégale ou non autorisée</li>
              <li>Le stockage de données sensibles sans mesures de sécurité appropriées</li>
              <li>La transmission de virus ou tout code malveillant</li>
              <li>La violation des droits de propriété intellectuelle de tiers</li>
              <li>La tentative d&apos;accès non autorisé à d&apos;autres comptes utilisateurs</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3: Payments */}
        <Card className="mb-6" id="paiements">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              3. Paiements et Tarification
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Moyens de Paiement</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Les paiements sont traités via <strong>Paystack</strong>, notre partenaire de paiement sécurisé. Nous acceptons :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Cartes bancaires (Visa, Mastercard, Verve)</li>
              <li>Virements bancaires directs</li>
              <li>Mobile Money (Orange Money, MTN Mobile Money, Wave, etc.)</li>
              <li>Autres moyens de paiement disponibles selon votre pays</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tarification</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Les tarifs de nos services sont affichés sur notre page de tarification. Les prix sont indiqués :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>En Francs CFA (XOF/XAF) pour les pays de la zone UEMOA/CEMAC</li>
              <li>En Naira (NGN) pour le Nigeria</li>
              <li>En Dollars US (USD) pour les autres pays</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Tous les prix incluent les taxes applicables. Nous nous réservons le droit de modifier nos tarifs avec un préavis de 30 jours.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facturation</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Les factures sont automatiquement générées et envoyées par email après chaque paiement. Vous pouvez également accéder à votre historique de facturation depuis votre compte utilisateur.
            </p>
          </CardContent>
        </Card>

        {/* Section 4: Subscriptions */}
        <Card className="mb-6" id="abonnements">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              4. Abonnements
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Renouvellement Automatique</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Les abonnements sont renouvelés automatiquement à la fin de chaque période de facturation (mensuelle ou annuelle), sauf si vous les annulez avant la date de renouvellement.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Annulation</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous pouvez annuler votre abonnement à tout moment depuis votre compte ou en contactant notre support. L&apos;annulation prend effet à la fin de la période de facturation en cours. Aucun remboursement partiel n&apos;est accordé pour les périodes non utilisées.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Période d&apos;Essai</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous pouvons offrir des périodes d&apos;essai gratuites. À la fin de la période d&apos;essai, votre abonnement sera automatiquement converti en abonnement payant sauf si vous l&apos;annulez avant la fin de l&apos;essai.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Remboursements</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Les demandes de remboursement sont examinées au cas par cas. En général :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Les remboursements peuvent être accordés dans les 7 jours suivant l&apos;achat initial</li>
              <li>Aucun remboursement pour les périodes d&apos;utilisation partielle</li>
              <li>Les remboursements sont traités dans un délai de 5 à 10 jours ouvrables</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 5: Data Usage */}
        <Card className="mb-6" id="donnees">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              5. Utilisation des Données
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Propriété des Données</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous conservez tous les droits sur les données que vous importez sur la Plateforme. InsightGov Africa ne revendique aucun droit de propriété sur vos données.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Traitement des Données</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous traitons vos données uniquement pour fournir nos services, notamment :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Analyse et génération de tableaux de bord</li>
              <li>Amélioration de nos algorithmes d&apos;IA de manière agrégée et anonymisée</li>
              <li>Stockage sécurisé et sauvegarde</li>
              <li>Support technique</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Conservation des Données</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vos données sont conservées pendant la durée de votre abonnement et pendant 90 jours après la résiliation. Passé ce délai, les données sont définitivement supprimées de nos serveurs.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sécurité</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données, incluant :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Chiffrement des données en transit et au repos</li>
              <li>Contrôle d&apos;accès basé sur les rôles</li>
              <li>Audit de sécurité régulier</li>
              <li>Sauvegardes automatiques</li>
            </ul>
            
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              Pour plus d&apos;informations, consultez notre <Link href="/privacy" className="text-primary hover:underline">Politique de Confidentialité</Link>.
            </p>
          </CardContent>
        </Card>

        {/* Section 6: Responsibilities */}
        <Card className="mb-6" id="responsabilites">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              6. Responsabilités
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vos Responsabilités</h4>
            <p className="text-gray-700 dark:text-gray-300">Vous êtes responsable de :</p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>La confidentialité de vos identifiants de connexion</li>
              <li>Toutes les activités effectuées depuis votre compte</li>
              <li>L&apos;exactitude et la légalité des données que vous importez</li>
              <li>L&apos;obtention des autorisations nécessaires pour les données de tiers</li>
              <li>La sauvegarde de vos données en dehors de la Plateforme</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Nos Responsabilités</h4>
            <p className="text-gray-700 dark:text-gray-300">Nous nous engageons à :</p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Fournir les services décrits avec un niveau de disponibilité de 99.5%</li>
              <li>Protéger vos données conformément à notre Politique de Confidentialité</li>
              <li>Résoudre les problèmes techniques dans un délai raisonnable</li>
              <li>Vous informer des modifications importantes des services</li>
              <li>Offrir un support technique pendant les heures ouvrables</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 7: Intellectual Property */}
        <Card className="mb-6" id="proprietes">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              7. Propriété Intellectuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Droits de la Société</h4>
            <p className="text-gray-700 dark:text-gray-300">
              InsightGov Africa et ses concédants de licence détiennent tous les droits, titres et intérêts sur :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>La Plateforme et son code source</li>
              <li>Les algorithmes et modèles d&apos;IA utilisés</li>
              <li>Le design et les éléments visuels</li>
              <li>La marque &quot;InsightGov Africa&quot; et tous les logos associés</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Licence Utilisateur</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous vous accordons une licence non exclusive, révocable, pour utiliser la Plateforme conformément à ces CGU. Cette licence ne vous donne pas le droit de :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Copier, modifier ou distribuer la Plateforme</li>
              <li>Rétro-ingénierie ou désassembler le logiciel</li>
              <li>Utiliser la Plateforme pour créer un produit concurrent</li>
              <li>Supprimer les avis de droits d&apos;auteur</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 8: Termination */}
        <Card className="mb-6" id="terminaison">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ban className="w-5 h-5 text-primary" />
              </div>
              8. Résiliation
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Résiliation par Vous</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous pouvez résilier votre compte à tout moment depuis votre espace utilisateur ou en contactant notre support. La résiliation entraîne :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>L&apos;arrêt immédiat de l&apos;accès aux services</li>
              <li>La suppression de vos données dans un délai de 90 jours</li>
              <li>L&apos;annulation des abonnements en cours</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Résiliation par Nous</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Nous nous réservons le droit de suspendre ou résilier votre accès à la Plateforme en cas de :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Violation de ces CGU</li>
              <li>Utilisation frauduleuse ou abusive</li>
              <li>Non-paiement des frais d&apos;abonnement</li>
              <li>Activité illégale suspectée</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              En cas de résiliation pour violation, aucun remboursement ne sera accordé.
            </p>
          </CardContent>
        </Card>

        {/* Section 9: Limitation of Liability */}
        <Card className="mb-6" id="limitation">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              9. Limitation de Responsabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Garantie &quot;Telle Quelle&quot;</h4>
            <p className="text-gray-700 dark:text-gray-300">
              La Plateforme est fournie &quot;telle quelle&quot; sans garantie d&apos;aucune sorte, expresse ou implicite. Nous ne garantissons pas que les services seront ininterrompus, sécurisés ou exempts d&apos;erreurs.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Limitation des Dommages</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Dans la mesure permise par la loi applicable, InsightGov Africa ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs, y compris mais sans s&apos;y limiter :
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
              <li>Perte de profits ou de revenus</li>
              <li>Perte de données</li>
              <li>Interruption d&apos;activité</li>
              <li>Coûts de substitution de services</li>
            </ul>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Plafond de Responsabilité</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Notre responsabilité totale envers vous pour toute réclamation découlant de ces CGU ou de l&apos;utilisation de la Plateforme est limitée au montant que vous avez payé pour les services au cours des 12 derniers mois.
            </p>
          </CardContent>
        </Card>

        {/* Section 10: Governing Law */}
        <Card className="mb-6" id="loi">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              10. Droit Applicable et Juridiction
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Droit Applicable</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Ces CGU sont régies par et interprétées conformément aux lois de la République du Sénégal. Pour les utilisateurs situés dans d&apos;autres pays africains, les conventions internationales applicables et les lois locales spécifiques peuvent s&apos;appliquer.
            </p>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Juridictions Compétentes</h4>
            <p className="text-gray-700 dark:text-gray-300">
              En cas de litige, les juridictions compétentes varient selon votre localisation :
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Zone UEMOA :</strong> Tribunaux de Dakar, Sénégal</li>
                <li><strong>Zone CEMAC :</strong> Tribunaux de Douala, Cameroun</li>
                <li><strong>Nigeria :</strong> Federal High Court, Lagos</li>
                <li><strong>Afrique de l&apos;Est :</strong> High Court of Kenya, Nairobi</li>
                <li><strong>Autres pays :</strong> Tribunaux de Dakar, Sénégal</li>
              </ul>
            </div>
            
            <Separator className="my-6" />
            
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Résolution des Litiges</h4>
            <p className="text-gray-700 dark:text-gray-300">
              Avant toute action judiciaire, les parties s&apos;engagent à tenter une résolution amiable du litige. Si aucune solution n&apos;est trouvée dans un délai de 30 jours, les juridictions compétentes seront saisies.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300">
              Pour toute question concernant ces Conditions Générales d&apos;Utilisation, vous pouvez nous contacter :
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
              <ul className="text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Email :</strong> legal@insightgov.africa</li>
                <li><strong>Téléphone :</strong> +221 33 123 45 67</li>
                <li><strong>Adresse :</strong> Dakar, Sénégal</li>
                <li><strong>Support :</strong> support@insightgov.africa</li>
              </ul>
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
            <Link href="/privacy">
              Consulter la Politique de Confidentialité
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
