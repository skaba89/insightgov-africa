/**
 * InsightGov Africa - Help Center Page
 * Centre d'aide
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Book,
  Video,
  MessageSquare,
  FileText,
  ChevronRight,
  ExternalLink,
  Upload,
  BarChart3,
  Settings,
  Users,
  CreditCard,
} from 'lucide-react';

const HELP_CATEGORIES = [
  {
    icon: Upload,
    title: 'Import de données',
    description: 'Formats acceptés, erreurs courantes',
    articles: 12,
  },
  {
    icon: BarChart3,
    title: 'Dashboards',
    description: 'Création, personnalisation, partage',
    articles: 18,
  },
  {
    icon: Settings,
    title: 'Paramètres',
    description: 'Compte, organisation, préférences',
    articles: 8,
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Équipes, permissions, commentaires',
    articles: 6,
  },
  {
    icon: CreditCard,
    title: 'Facturation',
    description: 'Abonnements, paiements, factures',
    articles: 10,
  },
  {
    icon: FileText,
    title: 'Exports',
    description: 'PDF, Excel, PowerPoint, API',
    articles: 7,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Comment importer un fichier Excel ?',
    a: 'Cliquez sur "Importer" dans le menu latéral, puis sélectionnez votre fichier .xlsx, .xls ou .csv. Notre IA analysera automatiquement la structure.',
  },
  {
    q: 'Quels sont les formats de fichiers acceptés ?',
    a: 'Nous acceptons les fichiers Excel (.xlsx, .xls), CSV (.csv), et nous travaillons sur l\'intégration de connecteurs API.',
  },
  {
    q: 'Comment partager un dashboard ?',
    a: 'Dans votre dashboard, cliquez sur "Partager" pour générer un lien public ou inviter des membres de votre équipe.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui, toutes les données sont chiffrées et hébergées en Afrique. Nous sommes conformes au RGPD.',
  },
  {
    q: 'Comment exporter en PDF ?',
    a: 'Dans votre dashboard, cliquez sur "Exporter" puis sélectionnez PDF. Vous pouvez personnaliser le format et les sections à inclure.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Centre d'aide</h1>
          <p className="text-xl text-blue-100 mb-8">
            Trouvez rapidement des réponses à vos questions
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Rechercher dans l'aide..."
              className="pl-12 h-14 text-lg bg-white dark:bg-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Parcourir par catégorie
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HELP_CATEGORIES.map((cat, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                      <cat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cat.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{cat.description}</p>
                      <Badge variant="secondary">{cat.articles} articles</Badge>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <Card key={idx} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{item.q}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                    {item.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Ressources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Book className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Documentation API</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Intégrez InsightGov à vos systèmes
                </p>
                <Link href="/api-docs">
                  <Button variant="outline" className="w-full">
                    Voir la doc
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tutoriels vidéo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Apprenez avec nos guides
                </p>
                <Button variant="outline" className="w-full">
                  Voir les vidéos
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Contactez notre équipe
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Nous contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
