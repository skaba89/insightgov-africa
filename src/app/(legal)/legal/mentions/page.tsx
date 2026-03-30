// ============================================
// InsightGov Africa - Mentions Légales
// ============================================

import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Mentions Légales | InsightGov Africa',
  description: 'Mentions légales d\'InsightGov Africa',
};

export default function MentionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Mentions Légales
          </h1>
          <p className="text-gray-600">
            Informations légales concernant le site InsightGov Africa
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Éditeur du Site</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                <strong>InsightGov Africa</strong>
              </p>
              <p>
                Société de droit camerounais<br />
                Siège social : Douala, Cameroun<br />
                Capital social : [À compléter]<br />
                RCCM : [À compléter]<br />
                NIF : [À compléter]
              </p>
              <p className="mt-4">
                <strong>Directeur de la publication</strong> : [Nom du directeur]<br />
                <strong>Contact</strong> : contact@insightgov.africa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Hébergement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Ce site est hébergé par :<br /><br />
                <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133<br />
                Walnut, CA 91789, USA<br />
                www.vercel.com
              </p>
              <p className="mt-4">
                <strong>Alternative (self-hosted)</strong> :<br />
                Serveurs dédiés en Europe<br />
                Hébergeur certifié RGPD
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Propriété Intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, etc.)
                est la propriété exclusive d'InsightGov Africa, à l'exception des marques, logos
                ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
              </p>
              <p>
                Toute reproduction, distribution, modification, adaptation, retransmission ou
                publication de ces différents éléments est strictement interdite sans l'accord
                exprès par écrit d'InsightGov Africa.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">4. Limitation de Responsabilité</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                InsightGov Africa s'efforce d'assurer au mieux l'exactitude et la mise à jour
                des informations diffusées sur ce site. Toutefois, InsightGov Africa ne peut
                garantir l'exactitude, la précision ou l'exhaustivité des informations mises
                à disposition sur ce site.
              </p>
              <p>
                En conséquence, InsightGov Africa décline toute responsabilité :
              </p>
              <ul>
                <li>Pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
                <li>Pour tous dommages résultant d'une intrusion frauduleuse d'un tiers</li>
                <li>Pour l'utilisation des données importées par les utilisateurs</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">5. Liens Hypertextes</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Le site InsightGov Africa peut contenir des liens hypertextes vers d'autres sites.
                Cependant, InsightGov Africa n'a pas la possibilité de vérifier le contenu des
                sites ainsi visités, et n'assumera en conséquence aucune responsabilité de ce fait.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">6. Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Ce site utilise des cookies pour améliorer l'expérience utilisateur et collecter
                des statistiques de navigation. Les cookies utilisés sont :
              </p>
              <ul>
                <li><strong>Cookies essentiels</strong> : Nécessaires au fonctionnement du site</li>
                <li><strong>Cookies de session</strong> : Gestion de l'authentification</li>
                <li><strong>Cookies analytiques</strong> : Statistiques anonymisées (avec consentement)</li>
              </ul>
              <p>
                L'utilisateur peut configurer son navigateur pour refuser les cookies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">7. Droit Applicable</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Les présentes mentions légales sont régies par le droit camerounais et le droit
                OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires).
              </p>
              <p>
                En cas de litige, les tribunaux de Douala (Cameroun) seront seuls compétents.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">8. Contact</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-600">
              <p>
                Pour toute question concernant ces mentions légales :
              </p>
              <ul>
                <li>Email : legal@insightgov.africa</li>
                <li>Téléphone : +237 XXX XXX XXX</li>
                <li>Adresse : Douala, Cameroun</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
