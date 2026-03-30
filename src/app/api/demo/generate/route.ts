/**
 * InsightGov Africa - Demo Generate API
 * =======================================
 * Génère un dashboard de démonstration sans nécessiter de fichier uploadé
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFallbackConfig } from '@/lib/ai/analysis';

// Types
interface DemoColumnMetadata {
  name: string;
  cleanName: string;
  originalName: string;
  dataType: string;
  category: string;
  sampleValues: string[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    sum?: number;
    count?: number;
  };
  uniqueValues?: string[];
  description?: string;
  format?: string;
}

interface DemoTemplate {
  columns: DemoColumnMetadata[];
  sampleData: Record<string, unknown>[];
  title: string;
  executiveSummary: string;
}

// Templates de démonstration par secteur
const DEMO_TEMPLATES: Record<string, DemoTemplate> = {
  health: {
    title: 'Tableau de Bord Santé - Rapport Mensuel',
    executiveSummary: 'Rapport mensuel des indicateurs de santé. Les consultations ont augmenté de 12% ce mois, avec une couverture vaccinale atteignant 87%.',
    columns: [
      { name: 'date', cleanName: 'date', originalName: 'Date', dataType: 'date', category: 'temporal', sampleValues: ['2024-01-15', '2024-01-16'], description: 'Date de consultation' },
      { name: 'region', cleanName: 'region', originalName: 'Région', dataType: 'category', category: 'geographic', sampleValues: ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack'], uniqueValues: ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor'], description: 'Région sanitaire' },
      { name: 'consultations', cleanName: 'consultations', originalName: 'Consultations', dataType: 'numeric', category: 'metric', sampleValues: ['150', '230', '180'], statistics: { min: 50, max: 500, mean: 200 }, description: 'Nombre de consultations' },
      { name: 'vaccinations', cleanName: 'vaccinations', originalName: 'Vaccinations', dataType: 'numeric', category: 'metric', sampleValues: ['45', '67', '52'], statistics: { min: 10, max: 150, mean: 60 }, description: 'Vaccinations effectuées' },
      { name: 'hospitalisations', cleanName: 'hospitalisations', originalName: 'Hospitalisations', dataType: 'numeric', category: 'metric', sampleValues: ['12', '18', '8'], statistics: { min: 0, max: 50, mean: 15 }, description: 'Hospitalisations' },
      { name: 'deces', cleanName: 'deces', originalName: 'Décès', dataType: 'numeric', category: 'metric', sampleValues: ['0', '1', '2'], statistics: { min: 0, max: 10, mean: 1 }, description: 'Décès enregistrés' },
      { name: 'accouchements', cleanName: 'accouchements', originalName: 'Accouchements', dataType: 'numeric', category: 'metric', sampleValues: ['25', '30', '22'], statistics: { min: 5, max: 60, mean: 28 }, description: 'Accouchements assistés' },
      { name: 'taux_couverture', cleanName: 'taux_couverture', originalName: 'Taux de couverture', dataType: 'percentage', category: 'metric', sampleValues: ['85', '90', '78'], statistics: { min: 60, max: 98, mean: 85 }, description: 'Taux de couverture vaccinale' },
    ],
    sampleData: [],
  },
  education: {
    title: 'Tableau de Bord Éducation - Rapport Annuel',
    executiveSummary: 'Bilan annuel du système éducatif. 1.2M d\'élèves scolarisés avec un taux de réussite de 72% aux examens.',
    columns: [
      { name: 'annee_scolaire', cleanName: 'annee_scolaire', originalName: 'Année scolaire', dataType: 'category', category: 'temporal', sampleValues: ['2023-2024'], uniqueValues: ['2023-2024'], description: 'Année scolaire' },
      { name: 'region', cleanName: 'region', originalName: 'Région', dataType: 'category', category: 'geographic', sampleValues: ['Dakar', 'Thiès'], uniqueValues: ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Diourbel'], description: 'Région éducative' },
      { name: 'niveau', cleanName: 'niveau', originalName: 'Niveau', dataType: 'category', category: 'categorical', sampleValues: ['Primaire', 'Secondaire'], uniqueValues: ['Primaire', 'Secondaire', 'Supérieur'], description: 'Niveau d\'enseignement' },
      { name: 'effectifs', cleanName: 'effectifs', originalName: 'Effectifs', dataType: 'numeric', category: 'metric', sampleValues: ['45000', '32000'], statistics: { min: 5000, max: 150000, mean: 45000 }, description: 'Effectifs scolaires' },
      { name: 'enseignants', cleanName: 'enseignants', originalName: 'Enseignants', dataType: 'numeric', category: 'metric', sampleValues: ['1200', '850'], statistics: { min: 100, max: 5000, mean: 1200 }, description: 'Nombre d\'enseignants' },
      { name: 'ecoles', cleanName: 'ecoles', originalName: 'Écoles', dataType: 'numeric', category: 'metric', sampleValues: ['150', '95'], statistics: { min: 20, max: 500, mean: 120 }, description: 'Nombre d\'écoles' },
      { name: 'taux_reussite', cleanName: 'taux_reussite', originalName: 'Taux de réussite', dataType: 'percentage', category: 'metric', sampleValues: ['72', '68'], statistics: { min: 45, max: 95, mean: 72 }, description: 'Taux de réussite' },
    ],
    sampleData: [],
  },
  agriculture: {
    title: 'Tableau de Bord Agricole - Campagne 2024',
    executiveSummary: 'Bilan de la campagne agricole. Production totale de 2.5M tonnes avec un rendement moyen de 1.8 t/ha.',
    columns: [
      { name: 'campagne', cleanName: 'campagne', originalName: 'Campagne', dataType: 'category', category: 'temporal', sampleValues: ['2024-2025'], description: 'Campagne agricole' },
      { name: 'region', cleanName: 'region', originalName: 'Région', dataType: 'category', category: 'geographic', sampleValues: ['Thiès', 'Diourbel'], uniqueValues: ['Dakar', 'Thiès', 'Diourbel', 'Kaolack', 'Fatick', 'Tambacounda'], description: 'Région' },
      { name: 'culture', cleanName: 'culture', originalName: 'Culture', dataType: 'category', category: 'categorical', sampleValues: ['Mil', 'Arachide'], uniqueValues: ['Mil', 'Arachide', 'Maïs', 'Riz', 'Sorgho', 'Niébé'], description: 'Type de culture' },
      { name: 'production', cleanName: 'production', originalName: 'Production', dataType: 'numeric', category: 'metric', sampleValues: ['150000', '280000'], statistics: { min: 5000, max: 500000, mean: 120000 }, description: 'Production (tonnes)' },
      { name: 'surface', cleanName: 'surface', originalName: 'Surface', dataType: 'numeric', category: 'metric', sampleValues: ['85000', '120000'], statistics: { min: 1000, max: 300000, mean: 70000 }, description: 'Surface cultivée (ha)' },
      { name: 'rendement', cleanName: 'rendement', originalName: 'Rendement', dataType: 'numeric', category: 'metric', sampleValues: ['1.8', '2.3'], statistics: { min: 0.5, max: 4, mean: 1.8 }, description: 'Rendement (t/ha)' },
      { name: 'producteurs', cleanName: 'producteurs', originalName: 'Producteurs', dataType: 'numeric', category: 'metric', sampleValues: ['15000', '22000'], statistics: { min: 500, max: 50000, mean: 12000 }, description: 'Nombre de producteurs' },
    ],
    sampleData: [],
  },
  finance: {
    title: 'Tableau de Budgétaire - Exécution 2024',
    executiveSummary: 'Suivi de l\'exécution budgétaire. Taux d\'exécution de 78% avec des recettes de 450M FCFA.',
    columns: [
      { name: 'exercice', cleanName: 'exercice', originalName: 'Exercice', dataType: 'category', category: 'temporal', sampleValues: ['2024'], description: 'Exercice budgétaire' },
      { name: 'mois', cleanName: 'mois', originalName: 'Mois', dataType: 'date', category: 'temporal', sampleValues: ['2024-01', '2024-02'], description: 'Mois' },
      { name: 'categorie', cleanName: 'categorie', originalName: 'Catégorie', dataType: 'category', category: 'categorical', sampleValues: ['Personnel', 'Investissement'], uniqueValues: ['Personnel', 'Investissement', 'Fonctionnement', 'Subventions'], description: 'Catégorie budgétaire' },
      { name: 'budget_prevu', cleanName: 'budget_prevu', originalName: 'Budget prévu', dataType: 'currency', category: 'metric', sampleValues: ['50000000', '120000000'], statistics: { min: 1000000, max: 500000000, mean: 80000000 }, description: 'Budget prévu (FCFA)' },
      { name: 'budget_execute', cleanName: 'budget_execute', originalName: 'Budget exécuté', dataType: 'currency', category: 'metric', sampleValues: ['42000000', '95000000'], statistics: { min: 500000, max: 400000000, mean: 65000000 }, description: 'Budget exécuté (FCFA)' },
      { name: 'type', cleanName: 'type', originalName: 'Type', dataType: 'category', category: 'categorical', sampleValues: ['Recette', 'Dépense'], uniqueValues: ['Recette', 'Dépense'], description: 'Type budgétaire' },
    ],
    sampleData: [],
  },
  // Template par défaut
  default: {
    title: 'Tableau de Bord - Analyse de Données',
    executiveSummary: 'Analyse automatique de vos données. L\'IA a identifié les indicateurs clés pour votre activité.',
    columns: [
      { name: 'date', cleanName: 'date', originalName: 'Date', dataType: 'date', category: 'temporal', sampleValues: ['2024-01-01', '2024-01-02'], description: 'Date' },
      { name: 'categorie', cleanName: 'categorie', originalName: 'Catégorie', dataType: 'category', category: 'categorical', sampleValues: ['A', 'B', 'C'], uniqueValues: ['A', 'B', 'C', 'D', 'E'], description: 'Catégorie' },
      { name: 'valeur', cleanName: 'valeur', originalName: 'Valeur', dataType: 'numeric', category: 'metric', sampleValues: ['100', '250'], statistics: { min: 0, max: 1000, mean: 300 }, description: 'Valeur' },
      { name: 'montant', cleanName: 'montant', originalName: 'Montant', dataType: 'currency', category: 'metric', sampleValues: ['15000', '42000'], statistics: { min: 1000, max: 100000, mean: 35000 }, description: 'Montant' },
    ],
    sampleData: [],
  },
};

/**
 * Génère des données de démonstration
 */
function generateSampleData(columns: DemoColumnMetadata[], rowCount: number = 100): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const regions = ['Conakry', 'Kankan', 'Nzérékoré', 'Labé', 'Kindia', 'Boké', 'Faranah', 'Mamou'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {};

    columns.forEach((col) => {
      const colName = col.cleanName || col.name;
      
      switch (col.dataType) {
        case 'date':
          const date = new Date(2024, Math.floor(i / 10), (i % 28) + 1);
          row[colName] = date.toISOString().split('T')[0];
          break;

        case 'category':
          if (col.uniqueValues && col.uniqueValues.length > 0) {
            row[colName] = col.uniqueValues[i % col.uniqueValues.length];
          } else if (col.name.toLowerCase().includes('region') || col.cleanName?.toLowerCase().includes('region')) {
            row[colName] = regions[i % regions.length];
          } else if (col.name.toLowerCase().includes('mois') || col.cleanName?.toLowerCase().includes('mois')) {
            row[colName] = months[i % months.length];
          } else {
            row[colName] = `Catégorie ${(i % 5) + 1}`;
          }
          break;

        case 'numeric':
        case 'percentage':
          const min = col.statistics?.min ?? 0;
          const max = col.statistics?.max ?? 1000;
          // Générer des données plus réalistes et variées
          const baseValue = min + (Math.sin(i * 0.3) * 0.5 + 0.5) * (max - min) + Math.random() * (max - min) * 0.2;
          row[colName] = Math.round(baseValue);
          break;

        case 'currency':
          // Générer des montants réalistes
          const baseAmount = 1000000 + Math.random() * 50000000;
          row[colName] = Math.round(baseAmount);
          break;

        default:
          row[colName] = col.sampleValues[i % col.sampleValues.length] || `Valeur ${i + 1}`;
      }
    });

    data.push(row);
  }

  console.log(`generateSampleData - Generated ${data.length} rows with columns:`, columns.map(c => c.cleanName || c.name));
  console.log('generateSampleData - Sample row:', data[0]);

  return data;
}

/**
 * POST /api/demo/generate
 * Génère un dashboard de démonstration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationType, sector } = body;

    // Sélectionner le template approprié
    const templateKey = sector || 'default';
    const template = DEMO_TEMPLATES[templateKey] || DEMO_TEMPLATES.default;

    // Générer les données de démonstration
    const sampleData = generateSampleData(template.columns, 120);

    // Générer la configuration du dashboard
    const config = generateFallbackConfig(
      template.columns,
      (organizationType || 'ministry') as 'ministry' | 'ngo' | 'enterprise',
      (sector || 'health') as 'health' | 'education' | 'agriculture' | 'finance' | 'social' | 'infrastructure',
      sampleData
    );

    // Personnaliser le titre et le résumé
    config.title = template.title;
    config.executiveSummary = template.executiveSummary;

    return NextResponse.json({
      success: true,
      config,
      isDemo: true,
      // IMPORTANT: Retourner les données de démo pour que le frontend puisse les utiliser
      sampleData,
      columnsMetadata: template.columns,
      metadata: {
        generatedAt: new Date().toISOString(),
        columnCount: template.columns.length,
        rowCount: sampleData.length,
        sector: sector || 'default',
        organizationType: organizationType || 'ministry',
      },
    });
  } catch (error) {
    console.error('Erreur génération démo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération du dashboard de démo',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
