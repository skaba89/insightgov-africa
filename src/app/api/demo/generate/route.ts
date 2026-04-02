/**
 * InsightGov Africa - Demo Generate API
 * =======================================
 * Génère un dashboard de démonstration sans nécessiter de fichier uploadé
 * 
 * Rate limiting: Maximum 10 requests per minute per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFallbackConfig } from '@/lib/ai/analysis';

// Rate limiting - in-memory store (resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

/**
 * Check rate limit for a given identifier
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetTime: record.resetTime };
}

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

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
      // IMPORTANT: Utiliser cleanName comme nom de colonne dans les données
      const colName = col.cleanName || col.name;
      const colLower = colName.toLowerCase();

      // Détection basée sur le nom de la colonne
      if (colLower.includes('date') || colLower.includes('mois')) {
        const date = new Date(2024, Math.floor(i / 10), (i % 28) + 1);
        row[colName] = date.toISOString().split('T')[0];
      } else if (colLower.includes('region') || colLower.includes('région')) {
        row[colName] = regions[i % regions.length];
      } else if (colLower.includes('consultation')) {
        // Consultations: 100-500
        row[colName] = Math.floor(100 + Math.random() * 400);
      } else if (colLower.includes('vaccination') || colLower.includes('vaccin')) {
        // Vaccinations: 20-200
        row[colName] = Math.floor(20 + Math.random() * 180);
      } else if (colLower.includes('hospitalisation')) {
        // Hospitalisations: 5-50
        row[colName] = Math.floor(5 + Math.random() * 45);
      } else if (colLower.includes('deces') || colLower.includes('décès')) {
        // Décès: 0-10
        row[colName] = Math.floor(Math.random() * 11);
      } else if (colLower.includes('accouchement') || colLower.includes('naissance')) {
        // Accouchements: 10-60
        row[colName] = Math.floor(10 + Math.random() * 50);
      } else if (colLower.includes('taux') || colLower.includes('couverture') || colLower.includes('pourcentage')) {
        // Taux/Pourcentages: 60-98
        row[colName] = Math.floor(60 + Math.random() * 38);
      } else if (colLower.includes('effectif') || colLower.includes('nombre')) {
        // Effectifs: 1000-50000
        row[colName] = Math.floor(1000 + Math.random() * 49000);
      } else if (colLower.includes('enseignant') || colLower.includes('professeur')) {
        // Enseignants: 50-2000
        row[colName] = Math.floor(50 + Math.random() * 1950);
      } else if (colLower.includes('ecole') || colLower.includes('école')) {
        // Écoles: 10-500
        row[colName] = Math.floor(10 + Math.random() * 490);
      } else if (colLower.includes('production') || colLower.includes('tonne')) {
        // Production: 1000-500000
        row[colName] = Math.floor(1000 + Math.random() * 499000);
      } else if (colLower.includes('surface') || colLower.includes('hectare') || colLower.includes('ha')) {
        // Surface: 100-300000
        row[colName] = Math.floor(100 + Math.random() * 299900);
      } else if (colLower.includes('rendement')) {
        // Rendement: 0.5-4.0
        row[colName] = Math.round((0.5 + Math.random() * 3.5) * 10) / 10;
      } else if (colLower.includes('producteur') || colLower.includes('agriculteur')) {
        // Producteurs: 100-50000
        row[colName] = Math.floor(100 + Math.random() * 49900);
      } else if (colLower.includes('budget') || colLower.includes('montant') || colLower.includes('recette') || colLower.includes('depense')) {
        // Budget: 1M-500M
        row[colName] = Math.floor(1000000 + Math.random() * 499000000);
      } else if (colLower.includes('culture') || colLower.includes('type')) {
        const cultures = ['Mil', 'Arachide', 'Maïs', 'Riz', 'Sorgho'];
        row[colName] = cultures[i % cultures.length];
      } else if (colLower.includes('categorie') || colLower.includes('catégorie')) {
        const categories = ['Personnel', 'Investissement', 'Fonctionnement', 'Subventions'];
        row[colName] = categories[i % categories.length];
      } else if (colLower.includes('niveau')) {
        const niveaux = ['Primaire', 'Secondaire', 'Supérieur'];
        row[colName] = niveaux[i % niveaux.length];
      } else if (colLower.includes('campagne') || colLower.includes('exercice') || colLower.includes('annee')) {
        row[colName] = '2024';
      } else if (col.dataType === 'category' && col.uniqueValues && col.uniqueValues.length > 0) {
        row[colName] = col.uniqueValues[i % col.uniqueValues.length];
      } else if (col.dataType === 'numeric' || col.dataType === 'currency' || col.dataType === 'percentage') {
        // Valeur numérique générique basée sur les statistiques
        const min = col.statistics?.min ?? 0;
        const max = col.statistics?.max ?? 1000;
        const value = min + Math.random() * (max - min);
        row[colName] = col.dataType === 'percentage' ? Math.round(value) : Math.floor(value);
      } else {
        // Par défaut: utiliser les sampleValues ou générer une valeur
        row[colName] = col.sampleValues[i % col.sampleValues.length] || `Valeur ${i + 1}`;
      }
    });

    data.push(row);
  }

  console.log(`generateSampleData - Generated ${data.length} rows with columns:`, Object.keys(data[0]));
  console.log('generateSampleData - Sample row:', JSON.stringify(data[0], null, 2));

  return data;
}

/**
 * POST /api/demo/generate
 * Génère un dashboard de démonstration
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Trop de requêtes. Veuillez réessayer dans une minute.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { organizationType, sector } = body;

    // Journalisation
    console.log(`[Demo Generate] Request from IP ${clientIp}, sector: ${sector || 'default'}`);

    // Sélectionner le template approprié
    const templateKey = sector || 'default';
    const template = DEMO_TEMPLATES[templateKey] || DEMO_TEMPLATES.default;

    // Générer les données de démonstration
    const sampleData = generateSampleData(template.columns, 120);

    // Générer la configuration du dashboard
    const config = generateFallbackConfig(
      template.columns as any,
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
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
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
