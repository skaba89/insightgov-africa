/**
 * InsightGov Africa - Types TypeScript
 * ================================
 * Types complets pour la plateforme SaaS de génération de dashboards automatisés.
 * Ces types définissent la structure des données échangées entre le frontend,
 * le backend, Supabase et l'API OpenAI.
 */

// =============================================================================
// ENUMS & TYPES DE BASE
// =============================================================================

/**
 * Types d'organisation supportés par la plateforme
 * Chaque type a des KPIs et visualisations recommandées différentes
 */
export type OrganizationType = 'ministry' | 'ngo' | 'enterprise' | 'academic' | 'other';

/**
 * Enum pour les types d'organisation (pour compatibilité)
 */
export enum OrganizationTypeEnum {
  MINISTRY = 'ministry',
  NGO = 'ngo',
  ENTERPRISE = 'enterprise',
  ACADEMIC = 'academic',
  OTHER = 'other',
}

/**
 * Types de fichiers supportés
 */
export enum FileType {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  PARQUET = 'parquet',
}

/**
 * Types de colonnes pour l'analyse de données
 */
export enum ColumnType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

/**
 * Types sémantiques pour la détection automatique
 */
export enum SemanticType {
  ID = 'ID',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  NAME = 'NAME',
  COUNTRY = 'COUNTRY',
  CITY = 'CITY',
  REGION = 'REGION',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  QUANTITY = 'QUANTITY',
  DATE = 'DATE',
  CATEGORY = 'CATEGORY',
  DESCRIPTION = 'DESCRIPTION',
  METRIC = 'METRIC',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Statut de traitement d'une analyse
 */
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Statut d'un export
 */
export enum ExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Types d'export disponibles
 */
export enum ExportType {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
  PNG = 'PNG',
}

/**
 * Types de graphiques Tremor
 */
export type TremorChartType = 
  | 'BarChart'
  | 'LineChart'
  | 'AreaChart'
  | 'DonutChart'
  | 'PieChart'
  | 'BarList'
  | 'SparkChart'
  | 'KpiCard'
  | 'MetricCard'
  | 'GaugeChart'
  | 'ProgressBar';

/**
 * Statistiques d'une colonne
 */
export interface ColumnStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  sum?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
  minDate?: string;
  maxDate?: string;
  topValues?: { value: string; count: number }[];
}

/**
 * Problème de qualité des données
 */
export interface DataQualityIssue {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedRows?: number;
  suggestion?: string;
}

/**
 * Qualité des données d'une colonne
 */
export interface DataQuality {
  completeness: number;
  uniqueness: number;
  consistency: number;
  validity: number;
  overallScore: number;
  issues: DataQualityIssue[];
}

/**
 * Données parsées depuis un fichier
 */
export interface ParsedData {
  columns: string[];
  data: Record<string, unknown>[];
  metadata: {
    rowCount: number;
    columnCount: number;
    fileSize: number;
    fileName: string;
    fileType: FileType;
  };
}

/**
 * Secteurs d'activité disponibles
 * Ces secteurs influencent le type d'analyse et les KPIs générés par l'IA
 */
export type Sector = 
  | 'health'           // Ministère de la Santé, ONG Santé
  | 'education'        // Ministère de l'Éducation, Écoles
  | 'agriculture'      // Ministère de l'Agriculture, ONG Agricole
  | 'finance'          // Ministère des Finances, Banques
  | 'infrastructure'   // Travaux Publics, Construction
  | 'energy'           // Énergie, Pétrole, Renouvelable
  | 'social'           // Affaires Sociales, Protection sociale
  | 'environment'      // Environnement, Changement climatique
  | 'trade'            // Commerce, Import/Export
  | 'mining'           // Mines et Ressources naturelles
  | 'transport'        // Transport, Logistique
  | 'telecom'          // Télécommunications
  | 'other';           // Autre secteur

/**
 * Niveaux d'abonnement disponibles
 * Chaque niveau débloque des fonctionnalités différentes
 */
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

/**
 * Types de graphiques supportés par Tremor
 * Ces types correspondent aux composants de @tremor/react
 */
export type ChartType = 
  | 'area'             // Graphique en aire
  | 'bar'              // Graphique à barres
  | 'line'             // Graphique linéaire
  | 'donut'            // Graphique en donut
  | 'pie'              // Graphique en camembert
  | 'barList'          // Liste de barres horizontales
  | 'sparkchart'       // Graphique sparkline
  | 'table'            // Tableau de données
  | 'kpi'              // Indicateur KPI simple
  | 'metric'           // Métrique avec tendance
  | 'gauge'            // Jauge circulaire
  | 'progressBar';     // Barre de progression

/**
 * Types de données détectés automatiquement par l'IA
 */
export type DataType = 
  | 'numeric'          // Nombre entier ou décimal
  | 'currency'         // Devise (FCFA, EUR, USD, etc.)
  | 'percentage'       // Pourcentage
  | 'date'             // Date
  | 'datetime'         // Date et heure
  | 'text'             // Texte libre
  | 'category'         // Catégorie (valeurs finies)
  | 'boolean'          // Vrai/Faux
  | 'id'               // Identifiant unique
  | 'geo'              // Données géographiques (pays, région, ville)
  | 'unknown';         // Type non détecté

/**
 * Statut de traitement d'un dataset
 */
export type DatasetStatus = 
  | 'uploading'        // En cours d'upload
  | 'pending'          // En attente d'analyse
  | 'analyzing'        // Analyse IA en cours
  | 'ready'            // Prêt pour visualisation
  | 'error';           // Erreur lors du traitement

// =============================================================================
// INTERFACES PRINCIPALES
// =============================================================================

/**
 * Métadonnées d'une colonne du fichier uploadé
 * Contient les informations analysées par l'IA sur chaque colonne
 */
export interface ColumnMetadata {
  /** Nom original de la colonne dans le fichier */
  originalName: string;
  
  /** Nom nettoyé et standardisé */
  cleanName?: string;
  
  /** Nom de la colonne */
  name: string;
  
  /** Type de données détecté */
  dataType?: DataType;
  
  /** Type de colonne */
  type?: ColumnType;
  
  /** Type sémantique détecté */
  detectedSemanticType?: SemanticType | string;
  
  /** Description générée par l'IA */
  description?: string;
  
  /** Statistiques de base */
  statistics?: ColumnStatistics;
  
  /** Qualité des données */
  quality?: DataQuality;
  
  /** Exemples de valeurs (pour affichage) */
  sampleValues: (string | number | boolean | null)[];
  
  /** Valeurs uniques (pour les catégories) */
  uniqueValues?: string[];
  
  /** Score de qualité (0-100) */
  qualityScore?: number;
  
  /** Suggéré pour les graphiques ? */
  isSuggestedForVisualization?: boolean;
  
  /** Format détecté (pour dates: 'YYYY-MM-DD', 'DD/MM/YYYY', etc.) */
  format?: string;
  
  /** Unité détectée (pour les nombres: 'FCFA', 'km', 'kg', etc.) */
  unit?: string;
}

/**
 * Configuration d'un KPI généré par l'IA
 * Un KPI peut être affiché seul ou faire partie d'un graphique
 */
export interface KPIConfig {
  /** Identifiant unique du KPI */
  id: string;
  
  /** Titre du KPI */
  title: string;
  
  /** Description détaillée */
  description: string;
  
  /** Type de visualisation recommandé */
  chartType: ChartType;
  
  /** Colonnes utilisées pour ce KPI */
  columns: {
    x?: string;       // Colonne pour l'axe X (catégories, dates)
    y?: string;       // Colonne pour l'axe Y (valeurs)
    z?: string;       // Colonne pour l'axe Z (si applicable)
    groupBy?: string; // Colonne pour grouper les données
    filter?: string;  // Colonne pour filtrer
  };
  
  /** Agrégation à appliquer */
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'countDistinct';
  
  /** Format d'affichage des valeurs */
  valueFormat?: {
    prefix?: string;      // Préfixe (ex: 'FCFA ')
    suffix?: string;      // Suffixe (ex: ' %')
    decimals?: number;    // Nombre de décimales
    compact?: boolean;    // Notation compacte (1K, 1M)
  };
  
  /** Couleurs suggérées (palette Tremor) */
  colors?: string[];
  
  /** Ordre d'affichage dans le dashboard */
  order: number;
  
  /** Taille du composant (grille 12 colonnes) */
  size: {
    cols: number;  // 1-12
    rows: number;  // 1-6
  };
  
  /** Indique si ce KPI est un indicateur clé */
  isKeyMetric: boolean;
  
  /** Condition de visibilité (optionnel) */
  visibilityCondition?: {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: string | number;
  };
  
  /** Seuils d'alerte (pour les métriques) */
  thresholds?: {
    warning?: number;
    critical?: number;
    target?: number;
  };
}

/**
 * Configuration complète du dashboard générée par l'IA
 */
export interface DashboardConfig {
  /** Version du schéma de configuration */
  version: string;
  
  /** Titre suggéré pour le dashboard */
  title: string;
  
  /** Description générale */
  description: string;
  
  /** Résumé exécutif généré par l'IA */
  executiveSummary: string;
  
  /** Insights clés détectés */
  keyInsights: string[];
  
  /** Recommandations de l'IA */
  recommendations: string[];
  
  /** Liste des KPIs configurés */
  kpis: KPIConfig[];
  
  /** Filtres globaux disponibles */
  globalFilters: {
    column: string;
    label: string;
    type: 'select' | 'multiselect' | 'dateRange' | 'numberRange';
    defaultValue?: string | string[] | { start: string; end: string };
  }[];
  
  /** Période de référence (si dates détectées) */
  dateRange?: {
    start: string;
    end: string;
    column: string;
  };
  
  /** Métadonnées de génération */
  metadata: {
    generatedAt: string;
    model: string;
    tokensUsed: number;
    processingTimeMs: number;
  };
}

// =============================================================================
// TYPES POUR L'ANALYSE IA
// =============================================================================

/**
 * Résumé du dataset généré par l'IA
 */
export interface DatasetSummary {
  title: string;
  description?: string;
  mainTopic?: string;
  timeRange?: { start: string; end: string };
  geographicScope?: string[];
  dataQuality: string;
}

/**
 * KPI suggéré par l'IA
 */
export interface SuggestedKpi {
  name: string;
  description?: string;
  category?: string;
  calculation?: string;
  column?: string;
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Suggestion de graphique par l'IA
 */
export interface ChartSuggestion {
  chartType: string;
  title: string;
  subtitle?: string;
  xAxis?: { column: string; label?: string };
  yAxis?: { column: string; label?: string };
  series: { column: string; name?: string; color?: string }[];
  reasoning?: string;
  priority?: number;
}

/**
 * Requête d'analyse IA
 */
export interface AIAnalysisRequest {
  organizationType: OrganizationType;
  sector: string;
  subSector?: string;
  columns: ColumnMetadata[];
  sampleData: Record<string, unknown>[];
  language?: 'fr' | 'en';
  customInstructions?: string;
}

/**
 * Réponse de l'analyse IA
 */
export interface AIAnalysisResponse {
  success: boolean;
  datasetSummary: DatasetSummary;
  suggestedKpis: SuggestedKpi[];
  suggestedCharts: ChartSuggestion[];
  insights: string[];
  recommendations: string[];
  error?: string;
}

/**
 * Configuration d'un graphique
 */
export interface ChartConfig {
  chartType: TremorChartType | string;
  title?: string;
  subtitle?: string;
  dataSource?: {
    type: string;
    columns: string[];
    aggregationType?: string;
  };
  xAxis?: {
    column?: string;
    label?: string;
    type?: string;
  };
  yAxis?: {
    column?: string;
    label?: string;
    type?: string;
  };
  series?: {
    name?: string;
    column: string;
    color?: string;
  }[];
  colors?: string[];
  legend?: {
    show: boolean;
    position?: string;
  };
  tooltip?: {
    enabled: boolean;
  };
  options?: Record<string, unknown>;
}

/**
 * KPI stocké en base
 */
export interface Kpi {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  configJson?: ChartConfig;
  insightText?: string;
  displayOrder?: number;
  isPublic?: boolean;
  value?: number | string;
}

// =============================================================================
// ENTITÉS BASE DE DONNÉES
// =============================================================================

/**
 * Organisation cliente
 * Correspond à la table `organizations` dans Supabase
 */
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  sector: Sector;
  subscriptionTier: SubscriptionTier;
  logoUrl?: string;
  country?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  users?: User[];
  datasets?: Dataset[];
}

/**
 * Utilisateur de la plateforme
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'analyst' | 'viewer';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  organization?: Organization;
}

/**
 * Dataset (fichier de données uploadé)
 * Correspond à la table `datasets` dans Supabase
 */
export interface Dataset {
  id: string;
  organizationId: string;
  name: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: 'csv' | 'xlsx' | 'xls';
  rowCount: number;
  columnCount: number;
  columnsMetadata: ColumnMetadata[];
  status: DatasetStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  organization?: Organization;
  kpiConfigs?: KPIConfigRecord[];
}

/**
 * Configuration KPI stockée en base
 * Correspond à la table `kpis` dans Supabase
 */
export interface KPIConfigRecord {
  id: string;
  datasetId: string;
  configJson: DashboardConfig;
  isPublished: boolean;
  version: number;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  dataset?: Dataset;
}

// =============================================================================
// TYPES API
// =============================================================================

/**
 * Requête d'upload de fichier
 */
export interface UploadRequest {
  file: File;
  organizationId: string;
  name?: string;
}

/**
 * Réponse d'upload
 */
export interface UploadResponse {
  success: boolean;
  dataset?: Dataset;
  error?: string;
}

/**
 * Requête d'analyse IA
 */
export interface AnalyzeRequest {
  datasetId: string;
  organizationType: OrganizationType;
  sector: Sector;
  customInstructions?: string;
}

/**
 * Réponse de l'analyse IA
 */
export interface AnalyzeResponse {
  success: boolean;
  config?: DashboardConfig;
  error?: string;
}

/**
 * Résultat de validation de fichier
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
  detectedEncoding: string;
  detectedDelimiter?: string;
}

// =============================================================================
// TYPES POUR L'APPLICATION FRONTEND
// =============================================================================

/**
 * État du store Zustand pour l'onboarding
 */
export interface OnboardingState {
  currentStep: number;
  organizationType: OrganizationType | null;
  sector: Sector | null;
  organizationName: string;
  country: string;
  dataset: Dataset | null;
  isAnalyzing: boolean;
  analysisResult: DashboardConfig | null;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setOrganizationType: (type: OrganizationType) => void;
  setSector: (sector: Sector) => void;
  setOrganizationName: (name: string) => void;
  setCountry: (country: string) => void;
  setDataset: (dataset: Dataset | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisResult: (result: DashboardConfig | null) => void;
  reset: () => void;
}

/**
 * Options pour les selects de l'interface
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Secteurs disponibles avec leurs métadonnées
 */
export interface SectorOption extends SelectOption<Sector> {
  icon: string;         // Nom de l'icône Lucide
  examples: string[];   // Exemples d'utilisations
  recommendedKPIs: string[]; // Types de KPIs recommandés
}

// =============================================================================
// TYPES OPENAI / PROMPTS
// =============================================================================

/**
 * Contexte envoyé à GPT-4o pour l'analyse
 */
export interface AIAnalysisContext {
  organizationType: OrganizationType;
  sector: Sector;
  columns: {
    name: string;
    sampleValues: (string | number | null)[];
    detectedType: DataType;
  }[];
  rowCount: number;
  customInstructions?: string;
}

/**
 * Schéma de réponse attendu de GPT-4o
 * Utilisé avec structured outputs
 */
export const AIDashboardConfigSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    executiveSummary: { type: "string" },
    keyInsights: {
      type: "array",
      items: { type: "string" }
    },
    recommendations: {
      type: "array",
      items: { type: "string" }
    },
    kpis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          chartType: { 
            type: "string",
            enum: ["area", "bar", "line", "donut", "pie", "barList", "sparkchart", "table", "kpi", "metric", "gauge", "progressBar"]
          },
          columns: {
            type: "object",
            properties: {
              x: { type: "string" },
              y: { type: "string" },
              z: { type: "string" },
              groupBy: { type: "string" },
              filter: { type: "string" }
            }
          },
          aggregation: { 
            type: "string",
            enum: ["sum", "avg", "count", "min", "max", "countDistinct"]
          },
          valueFormat: {
            type: "object",
            properties: {
              prefix: { type: "string" },
              suffix: { type: "string" },
              decimals: { type: "number" },
              compact: { type: "boolean" }
            }
          },
          colors: {
            type: "array",
            items: { type: "string" }
          },
          order: { type: "number" },
          size: {
            type: "object",
            properties: {
              cols: { type: "number" },
              rows: { type: "number" }
            },
            required: ["cols", "rows"]
          },
          isKeyMetric: { type: "boolean" },
          thresholds: {
            type: "object",
            properties: {
              warning: { type: "number" },
              critical: { type: "number" },
              target: { type: "number" }
            }
          }
        },
        required: ["id", "title", "chartType", "columns", "order", "size"]
      }
    },
    globalFilters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          column: { type: "string" },
          label: { type: "string" },
          type: { 
            type: "string",
            enum: ["select", "multiselect", "dateRange", "numberRange"]
          },
          defaultValue: { type: "string" }
        },
        required: ["column", "label", "type"]
      }
    }
  },
  required: ["title", "description", "kpis"]
} as const;

// =============================================================================
// EXPORTS UTILES
// =============================================================================

/**
 * Liste des types d'organisation avec leurs labels
 */
export const ORGANIZATION_TYPES = [
  { 
    value: 'ministry' as OrganizationType, 
    label: 'Ministère / Gouvernement',
    description: 'Institutions publiques et administrations gouvernementales'
  },
  { 
    value: 'ngo' as OrganizationType, 
    label: 'ONG / Organisation Internationale',
    description: 'Organisations non gouvernementales et agences internationales'
  },
  { 
    value: 'enterprise' as OrganizationType, 
    label: 'Entreprise Privée',
    description: 'Entreprises commerciales et structures privées'
  }
];

/**
 * Liste des secteurs avec leurs métadonnées
 */
export const SECTORS: SectorOption[] = [
  { 
    value: 'health', 
    label: 'Santé', 
    icon: 'Heart',
    examples: ['Ministère de la Santé', 'OMS', 'Cliniques'],
    recommendedKPIs: ['Patients traités', 'Taux de vaccination', 'Mortalité']
  },
  { 
    value: 'education', 
    label: 'Éducation', 
    icon: 'GraduationCap',
    examples: ['Ministère de l\'Éducation', 'Écoles', 'Universités'],
    recommendedKPIs: ['Taux de scolarisation', 'Résultats examens', 'Effectifs']
  },
  { 
    value: 'agriculture', 
    label: 'Agriculture', 
    icon: 'Wheat',
    examples: ['Ministère de l\'Agriculture', 'FAO', 'Coopératives'],
    recommendedKPIs: ['Production', 'Rendement', 'Surface cultivée']
  },
  { 
    value: 'finance', 
    label: 'Finance', 
    icon: 'Banknote',
    examples: ['Ministère des Finances', 'Banques', 'Assurances'],
    recommendedKPIs: ['Recettes', 'Dépenses', 'Taux de change']
  },
  { 
    value: 'infrastructure', 
    label: 'Infrastructure', 
    icon: 'Building2',
    examples: ['Travaux Publics', 'Construction', 'BTP'],
    recommendedKPIs: ['Projets réalisés', 'Km de routes', 'Budget exécuté']
  },
  { 
    value: 'energy', 
    label: 'Énergie', 
    icon: 'Zap',
    examples: ['Ministère de l\'Énergie', 'Sociétés d\'électricité', 'Pétrole'],
    recommendedKPIs: ['Production', 'Consommation', 'Taux d\'électrification']
  },
  { 
    value: 'social', 
    label: 'Affaires Sociales', 
    icon: 'Users',
    examples: ['Protection sociale', 'Action humanitaire', 'Aide sociale'],
    recommendedKPIs: ['Bénéficiaires', 'Montants distribués', 'Couverture']
  },
  { 
    value: 'environment', 
    label: 'Environnement', 
    icon: 'Leaf',
    examples: ['Ministère de l\'Environnement', 'Climat', 'Forêts'],
    recommendedKPIs: ['Émissions CO2', 'Déforestation', 'Aires protégées']
  },
  { 
    value: 'trade', 
    label: 'Commerce', 
    icon: 'ShoppingCart',
    examples: ['Chambre de Commerce', 'Import/Export', 'Marchés'],
    recommendedKPIs: ['Volume échanges', 'Balance commerciale', 'Prix']
  },
  { 
    value: 'mining', 
    label: 'Mines & Ressources', 
    icon: 'Mountain',
    examples: ['Ministère des Mines', 'Compagnies minières'],
    recommendedKPIs: ['Production', 'Redevances', 'Emplois']
  },
  { 
    value: 'transport', 
    label: 'Transport', 
    icon: 'Truck',
    examples: ['Transport routier', 'Aviation', 'Ferroviaire'],
    recommendedKPIs: ['Passagers', 'Tonnage', 'Ponctualité']
  },
  { 
    value: 'telecom', 
    label: 'Télécommunications', 
    icon: 'Signal',
    examples: ['Opérateurs télécom', 'Régulateur', 'Internet'],
    recommendedKPIs: ['Abonnés', 'Couverture', 'Débit moyen']
  },
  { 
    value: 'other', 
    label: 'Autre secteur', 
    icon: 'Folder',
    examples: ['Autre type d\'organisation'],
    recommendedKPIs: ['KPIs personnalisés']
  }
];

/**
 * Couleurs Tremor par défaut
 */
export const TREMOR_COLORS = {
  blue: ['blue'],
  emerald: ['emerald'],
  violet: ['violet'],
  amber: ['amber'],
  rose: ['rose'],
  cyan: ['cyan'],
  lime: ['lime'],
  orange: ['orange'],
  fuchsia: ['fuchsia'],
  teal: ['teal'],
} as const;

/**
 * Palette de couleurs pour les graphiques
 */
export const CHART_COLOR_PALETTE = [
  'blue',
  'emerald', 
  'violet',
  'amber',
  'rose',
  'cyan',
  'lime',
  'orange',
  'fuchsia',
  'teal'
] as const;

// =============================================================================
// DATA WAREHOUSE - STAR SCHEMA TYPES
// =============================================================================

/**
 * Types de dimension disponibles
 */
export type DimensionType = 
  | 'time'        // Dimension temporelle
  | 'geography'   // Dimension géographique
  | 'organization' // Dimension organisationnelle
  | 'project'     // Dimension projet/programme
  | 'indicator'   // Dimension indicateur/KPI
  | 'source'      // Dimension source de données
  | 'custom';     // Dimension personnalisée

/**
 * Types de filtres disponibles
 */
export type FilterType = 
  | 'year'        // Filtre par année
  | 'period'      // Filtre par période (YYYY-MM)
  | 'quarter'     // Filtre par trimestre
  | 'month'       // Filtre par mois
  | 'geography'   // Filtre géographique
  | 'organization' // Filtre organisationnel
  | 'project'     // Filtre par projet
  | 'indicator'   // Filtre par indicateur
  | 'custom';     // Filtre personnalisé

/**
 * Opérateurs de filtre
 */
export type FilterOperator = 
  | 'eq'        // Égal
  | 'neq'       // Non égal
  | 'gt'        // Supérieur
  | 'lt'        // Inférieur
  | 'gte'       // Supérieur ou égal
  | 'lte'       // Inférieur ou égal
  | 'in'        // Dans une liste
  | 'between'   // Entre deux valeurs
  | 'contains'  // Contient
  | 'startsWith' // Commence par
  | 'endsWith'; // Finit par

/**
 * Configuration d'un filtre de dashboard
 */
export interface DashboardFilterConfig {
  id: string;
  filterType: FilterType;
  dimension: DimensionType;
  operator: FilterOperator;
  value: string | number | string[] | number[] | { min: number; max: number } | null;
  isActive: boolean;
  displayOrder: number;
  label?: string;
  description?: string;
}

/**
 * État des filtres actifs
 */
export interface FilterState {
  years: number[];
  periods: string[];       // YYYY-MM format
  quarters: number[];      // 1-4
  months: number[];        // 1-12
  geographies: string[];   // IDs ou noms
  organizations: string[];
  projects: string[];
  indicators: string[];
  customFilters: Record<string, unknown>;
}

/**
 * Options de comparaison
 */
export interface ComparisonOptions {
  enabled: boolean;
  type: 'yoy' | 'mom' | 'qoq' | 'custom'; // Year-over-year, Month-over-month, Quarter-over-quarter
  baselineYear?: number;
  baselinePeriod?: string;
  comparisonYears?: number[];
  comparisonPeriods?: string[];
}

/**
 * Dimension Temps
 */
export interface DimTimeRecord {
  id: string;
  date: Date;
  year: number;
  quarter: number;
  month: number;
  monthName: string;
  week: number;
  dayOfWeek: number;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  fiscalYear?: number;
  period: string; // YYYY-MM
}

/**
 * Dimension Géographique
 */
export interface DimGeographyRecord {
  id: string;
  country: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  district?: string;
  districtCode?: string;
  city?: string;
  cityCode?: string;
  latitude?: number;
  longitude?: number;
  level: 'country' | 'region' | 'district' | 'city';
}

/**
 * Dimension Organisationnelle
 */
export interface DimOrganizationRecord {
  id: string;
  name: string;
  type: string;
  code?: string;
  parentOrgId?: string;
  level: number;
  sector?: string;
  isActive: boolean;
}

/**
 * Dimension Projet/Programme
 */
export interface DimProjectRecord {
  id: string;
  name: string;
  code?: string;
  type: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency: string;
  sector?: string;
  donor?: string;
}

/**
 * Dimension Indicateur/KPI
 */
export interface DimIndicatorRecord {
  id: string;
  name: string;
  code?: string;
  category: string;
  subcategory?: string;
  unit?: string;
  description?: string;
  targetValue?: number;
  isPercentage: boolean;
  isKeyIndicator: boolean;
  sdgAlignment?: string;
}

/**
 * Enregistrement de la table de faits
 */
export interface FactRecord {
  id: string;
  datasetId: string;
  organizationId?: string;
  timeId?: string;
  geographyId?: string;
  orgDimId?: string;
  projectId?: string;
  indicatorId?: string;
  sourceId?: string;
  value?: number;
  valueString?: string;
  valueFormatted?: string;
  rowNumber?: number;
  rawData?: string;
  qualityScore: number;
  isVerified: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  timeDim?: DimTimeRecord;
  geographyDim?: DimGeographyRecord;
  orgDim?: DimOrganizationRecord;
  projectDim?: DimProjectRecord;
  indicatorDim?: DimIndicatorRecord;
}

/**
 * Données agrégées pour les visualisations
 */
export interface AggregatedData {
  dimension: string;
  dimensionValue: string;
  metric: string;
  value: number;
  count: number;
  percentage?: number;
  trend?: number;       // Variation vs période précédente
  previousValue?: number; // Valeur période précédente
}

/**
 * Résultat d'une requête multi-année
 */
export interface MultiYearResult {
  year: number;
  period?: string;
  value: number;
  count: number;
  change?: number;      // Variation absolue
  changePercent?: number; // Variation en %
}

/**
 * Préférences d'affichage du dashboard
 */
export interface DashboardViewPreferences {
  viewMode: 'table' | 'chart' | 'both';
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  showTrendLine?: boolean;
  showComparison?: boolean;
  compactMode?: boolean;
  displayOptions: Record<string, unknown>;
}

/**
 * Type de KPI étendu pour les comparaisons
 */
export interface EnhancedKPIConfig extends KPIConfig {
  // Support multi-année
  supportsMultiYear?: boolean;
  defaultYearComparison?: 'yoy' | 'none';
  
  // Dimensions détectées
  detectedDimensions?: {
    time?: string;        // Colonne temps détectée
    geography?: string;   // Colonne géographie détectée
    category?: string;    // Colonne catégorie détectée
  };
  
  // Filtres suggérés
  suggestedFilters?: DashboardFilterConfig[];
  
  // Comparaison
  comparison?: ComparisonOptions;
  
  // Objectifs/cibles
  targets?: {
    yearly?: Record<number, number>;  // Année -> Target
    quarterly?: Record<string, number>; // "2024-Q1" -> Target
    monthly?: Record<string, number>;   // "2024-01" -> Target
  };
}

/**
 * Configuration de dashboard étendue
 */
export interface EnhancedDashboardConfig extends DashboardConfig {
  // Années disponibles dans les données
  availableYears?: number[];
  
  // Périodes disponibles
  availablePeriods?: string[];
  
  // Dimensions détectées
  detectedDimensions?: {
    time?: string;
    geography?: string[];
    categories?: string[];
  };
  
  // KPIs étendus
  kpis: EnhancedKPIConfig[];
  
  // Filtres par défaut
  defaultFilters?: FilterState;
  
  // Options de comparaison
  comparisonOptions?: ComparisonOptions;
}

/**
 * Métadonnées de source de données
 */
export interface DataSourceMetadata {
  id: string;
  name: string;
  type: 'file' | 'api' | 'database' | 'manual';
  format: 'csv' | 'xlsx' | 'parquet' | 'json';
  url?: string;
  organization?: string;
  reliability: number; // 1-5
  lastUpdated?: Date;
  
  // Statistiques
  rowCount?: number;
  columnCount?: number;
  dateRange?: { start: Date; end: Date };
  yearsCovered?: number[];
}

/**
 * Résultat de transformation en star schema
 */
export interface StarSchemaTransformResult {
  success: boolean;
  factRecords: number;
  timeRecords: number;
  geographyRecords: number;
  organizationRecords: number;
  projectRecords: number;
  indicatorRecords: number;
  sourceRecords: number;
  errors: string[];
  warnings: string[];
}

/**
 * Options de transformation de données
 */
export interface TransformOptions {
  datasetId: string;
  organizationId?: string;
  detectDates: boolean;
  detectGeography: boolean;
  detectOrganizations: boolean;
  detectProjects: boolean;
  detectIndicators: boolean;
  dateColumns?: string[];
  geographyColumns?: string[];
  organizationColumns?: string[];
  projectColumns?: string[];
  indicatorColumns?: string[];
  valueColumns?: string[];
}

/**
 * Configuration d'export de données filtrées
 */
export interface FilteredExportConfig {
  format: 'csv' | 'xlsx' | 'json' | 'parquet';
  includeFilters: boolean;
  includeMetadata: boolean;
  includeCalculations: boolean;
  locale: string;
  dateFormat: string;
  numberFormat: string;
}
