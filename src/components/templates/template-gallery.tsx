'use client';

/**
 * InsightGov Africa - Template Gallery Component
 * ===============================================
 * Galerie de templates de rapports pré-construits
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  GraduationCap,
  Wheat,
  Banknote,
  Building2,
  Users,
  Activity,
  BookOpen,
  Leaf,
  Truck,
  Signal,
  Mountain,
  ShoppingCart,
  Zap,
  Folder,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Sector, OrganizationType } from '@/types';
import type { ReportTemplate } from '@/lib/templates/report-templates';

interface TemplateGalleryProps {
  sector?: Sector;
  organizationType?: OrganizationType;
  onSelectTemplate: (template: ReportTemplate) => void;
  selectedTemplateId?: string;
  className?: string;
}

// Icônes par secteur
const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  health: Heart,
  education: GraduationCap,
  agriculture: Wheat,
  finance: Banknote,
  infrastructure: Building2,
  social: Users,
  environment: Leaf,
  trade: ShoppingCart,
  mining: Mountain,
  transport: Truck,
  telecom: Signal,
  energy: Zap,
  other: Folder,
};

// Couleurs par secteur
const SECTOR_COLORS: Record<string, string> = {
  health: 'from-rose-500 to-pink-500',
  education: 'from-blue-500 to-indigo-500',
  agriculture: 'from-green-500 to-emerald-500',
  finance: 'from-cyan-500 to-teal-500',
  infrastructure: 'from-slate-500 to-gray-500',
  social: 'from-purple-500 to-violet-500',
  environment: 'from-green-600 to-lime-500',
  trade: 'from-amber-500 to-orange-500',
  mining: 'from-stone-500 to-neutral-500',
  transport: 'from-sky-500 to-blue-500',
  telecom: 'from-violet-500 to-purple-500',
  energy: 'from-yellow-500 to-amber-500',
  other: 'from-gray-400 to-slate-400',
};

export function TemplateGallery({
  sector,
  organizationType,
  onSelectTemplate,
  selectedTemplateId,
  className,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [sector, organizationType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sector) params.append('sector', sector);
      if (organizationType) params.append('organizationType', organizationType);

      const response = await fetch(`/api/templates?${params}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    return SECTOR_ICONS[iconName] || Folder;
  };

  const getGradient = (sectorName: string) => {
    return SECTOR_COLORS[sectorName] || SECTOR_COLORS.other;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted" />
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun template disponible</h3>
          <p className="text-sm text-muted-foreground">
            Aucun template n'existe pour ce secteur. 
            L'IA générera un tableau de bord personnalisé.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Templates Disponibles</h2>
          <p className="text-sm text-muted-foreground">
            Choisissez un template pré-construit ou laissez l'IA créer un dashboard personnalisé
          </p>
        </div>
        <Badge variant="secondary">{templates.length} templates</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => {
          const Icon = getIcon(template.icon);
          const isSelected = selectedTemplateId === template.id;
          const gradient = getGradient(template.sector);

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 overflow-hidden',
                  'hover:shadow-lg hover:scale-[1.02]',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => onSelectTemplate(template)}
              >
                {/* Header avec gradient */}
                <CardHeader className={cn('bg-gradient-to-r text-white p-4', gradient)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {template.nameFr}
                        </CardTitle>
                        <CardDescription className="text-white/80 text-xs">
                          {template.sector}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-white rounded-full">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.descriptionFr}
                  </p>

                  {/* KPIs count */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {template.kpis.length} KPIs
                    </Badge>
                    {template.organizationTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type === 'ministry' ? 'Ministère' : 
                         type === 'ngo' ? 'ONG' : 'Entreprise'}
                      </Badge>
                    ))}
                  </div>

                  {/* Colonnes recommandées */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Colonnes recommandées:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.recommendedDataColumns
                        .filter((col) => col.required)
                        .slice(0, 4)
                        .map((col) => (
                          <Badge key={col.name} variant="outline" className="text-xs">
                            {col.name}
                          </Badge>
                        ))}
                      {template.recommendedDataColumns.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.recommendedDataColumns.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    variant={isSelected ? 'default' : 'secondary'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Sélectionné
                      </>
                    ) : (
                      <>
                        Utiliser ce template
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}

        {/* Option: Création IA personnalisée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: templates.length * 0.1 }}
        >
          <Card
            className={cn(
              'cursor-pointer transition-all duration-200 overflow-hidden border-dashed',
              'hover:shadow-lg hover:scale-[1.02]',
              selectedTemplateId === 'ai-custom' && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() =>
              onSelectTemplate({
                id: 'ai-custom',
                name: 'AI Custom Dashboard',
                nameFr: 'Dashboard Personnalisé IA',
                description: 'Let AI create a custom dashboard',
                descriptionFr: 'Laissez l\'IA créer un dashboard personnalisé',
                sector: sector || 'other',
                organizationTypes: [],
                icon: 'Sparkles',
                kpis: [],
                colorScheme: [],
                executiveSummaryTemplate: '',
                recommendedDataColumns: [],
              })
            }
          >
            <CardHeader className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Dashboard Personnalisé
                  </CardTitle>
                  <CardDescription className="text-white/80 text-xs">
                    Généré par IA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Laissez notre IA analyser vos données et créer un tableau de bord 
                optimisé pour votre contexte spécifique.
              </p>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Analyse IA
                </Badge>
                <Badge variant="outline" className="text-xs">
                  KPIs Optimisés
                </Badge>
              </div>

              <Button
                variant={selectedTemplateId === 'ai-custom' ? 'default' : 'secondary'}
                size="sm"
                className="w-full"
              >
                {selectedTemplateId === 'ai-custom' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Sélectionné
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Créer avec IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default TemplateGallery;
