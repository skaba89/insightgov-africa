/**
 * InsightGov Africa - Blog Page
 * Page Blog
 */

'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

const BLOG_POSTS = [
  {
    title: 'Comment l\'IA transforme le reporting dans les ministères africains',
    excerpt: 'Découvrez comment les technologies d\'intelligence artificielle révolutionnent la prise de décision dans les administrations publiques africaines.',
    category: 'IA & Data',
    author: 'Amadou Diallo',
    date: '15 Jan 2025',
    readTime: '5 min',
    featured: true,
  },
  {
    title: '5 erreurs à éviter dans la visualisation de données',
    excerpt: 'Les pièges courants qui rendent vos dashboards inefficaces et comment les éviter.',
    category: 'Best Practices',
    author: 'Fatou Ndiaye',
    date: '10 Jan 2025',
    readTime: '4 min',
    featured: false,
  },
  {
    title: 'Case Study: Ministère de la Santé du Sénégal',
    excerpt: 'Comment le Ministère de la Santé a réduit de 80% le temps de création de ses rapports mensuels.',
    category: 'Case Study',
    author: 'Ibrahima Sow',
    date: '5 Jan 2025',
    readTime: '8 min',
    featured: false,
  },
  {
    title: 'L\'importance des KPIs pour les ONG en Afrique',
    excerpt: 'Guide complet pour définir et suivre les indicateurs clés de performance.',
    category: 'Guide',
    author: 'Fatou Ndiaye',
    date: '28 Dec 2024',
    readTime: '6 min',
    featured: false,
  },
  {
    title: 'Nouveau: Export PowerPoint et templates personnalisés',
    excerpt: 'Découvrez les dernières fonctionnalités de la plateforme InsightGov Africa.',
    category: 'Product',
    author: 'Ibrahima Sow',
    date: '20 Dec 2024',
    readTime: '3 min',
    featured: false,
  },
  {
    title: 'RGPD en Afrique: Comprendre les enjeux',
    excerpt: 'Tout ce que vous devez savoir sur la protection des données personnelles.',
    category: 'Sécurité',
    author: 'Amadou Diallo',
    date: '15 Dec 2024',
    readTime: '7 min',
    featured: false,
  },
];

const CATEGORIES = ['Tous', 'IA & Data', 'Best Practices', 'Case Study', 'Guide', 'Product', 'Sécurité'];

export default function BlogPage() {
  const featuredPost = BLOG_POSTS.find((post) => post.featured);
  const otherPosts = BLOG_POSTS.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-white/20 text-white border-0 mb-4">Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Insights & Actualités
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Tendances data, guides pratiques et success stories africaines
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-12">
          {CATEGORIES.map((cat, idx) => (
            <Button
              key={idx}
              variant={idx === 0 ? 'default' : 'outline'}
              size="sm"
              className={idx === 0 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Card className="mb-12 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white">
                <Badge className="bg-white/20 text-white border-0 mb-4">{featuredPost.category}</Badge>
                <h2 className="text-2xl font-bold mb-4">{featuredPost.title}</h2>
                <p className="text-blue-100 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-blue-200 mb-6">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featuredPost.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  Lire l'article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-6xl">📊</div>
              </div>
            </div>
          </Card>
        )}

        {/* Other Posts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherPosts.map((post, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Charger plus d'articles
          </Button>
        </div>
      </div>
    </div>
  );
}
