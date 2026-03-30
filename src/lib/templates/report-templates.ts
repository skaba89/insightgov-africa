/**
 * InsightGov Africa - Report Templates
 * =====================================
 * Système de templates de rapports pré-construits par secteur
 * pour générer des tableaux de bord professionnels rapidement.
 */

import type { KPIConfig, DashboardConfig, Sector } from '@/types';

/**
 * Template de rapport pré-défini
 */
export interface ReportTemplate {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  sector: Sector;
  organizationTypes: string[];
  icon: string;
  kpis: Omit<KPIConfig, 'id'>[];
  colorScheme: string[];
  executiveSummaryTemplate: string;
  recommendedDataColumns: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  previewImageUrl?: string;
}

/**
 * Templates de rapports par secteur
 */
export const REPORT_TEMPLATES: ReportTemplate[] = [
  // ============================================================================
  // SANTÉ
  // ============================================================================
  {
    id: 'health-ministry-monthly',
    name: 'Ministry of Health - Monthly Report',
    nameFr: 'Ministère de la Santé - Rapport Mensuel',
    description: 'Monthly health indicators dashboard for ministries',
    descriptionFr: 'Tableau de bord mensuel des indicateurs de santé pour les ministères',
    sector: 'health',
    organizationTypes: ['ministry'],
    icon: 'Heart',
    colorScheme: ['rose', 'red', 'pink', 'orange'],
    executiveSummaryTemplate: 'Rapport mensuel des activités de santé couvrant la période {period}. Les indicateurs clés montrent {trend}.',
    recommendedDataColumns: [
      { name: 'date', type: 'date', description: 'Date de consultation ou rapport', required: true },
      { name: 'region', type: 'category', description: 'Région ou district sanitaire', required: true },
      { name: 'consultations', type: 'numeric', description: 'Nombre de consultations', required: true },
      { name: 'hospitalisations', type: 'numeric', description: 'Nombre d\'hospitalisations', required: false },
      { name: 'vaccinations', type: 'numeric', description: 'Nombre de vaccinations', required: false },
      { name: 'deces', type: 'numeric', description: 'Nombre de décès', required: false },
      { name: 'accouchements', type: 'numeric', description: 'Nombre d\'accouchements', required: false },
    ],
    kpis: [
      {
        title: 'Total Consultations',
        description: 'Nombre total de consultations médicales',
        chartType: 'metric',
        columns: { y: 'consultations' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { compact: true },
      },
      {
        title: 'Consultations par Région',
        description: 'Répartition géographique des consultations',
        chartType: 'bar',
        columns: { x: 'region', y: 'consultations' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 2,
        isKeyMetric: false,
        colors: ['rose'],
      },
      {
        title: 'Évolution Mensuelle',
        description: 'Tendance des consultations dans le temps',
        chartType: 'line',
        columns: { x: 'date', y: 'consultations' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 3,
        isKeyMetric: true,
        colors: ['red'],
      },
      {
        title: 'Vaccinations',
        description: 'Nombre de vaccinations effectuées',
        chartType: 'metric',
        columns: { y: 'vaccinations' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 4,
        isKeyMetric: true,
        valueFormat: { compact: true },
      },
      {
        title: 'Taux d\'Hospitalisation',
        description: 'Répartition des hospitalisations par région',
        chartType: 'donut',
        columns: { x: 'region', y: 'hospitalisations' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 5,
        isKeyMetric: false,
        colors: ['rose', 'red', 'pink', 'orange'],
      },
      {
        title: 'Accouchements',
        description: 'Nombre d\'accouchements en structure sanitaire',
        chartType: 'metric',
        columns: { y: 'accouchements' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 6,
        isKeyMetric: false,
        valueFormat: { compact: true },
      },
    ],
  },
  {
    id: 'health-ngo-project',
    name: 'NGO Health Project Dashboard',
    nameFr: 'Tableau de Bord Projet Santé ONG',
    description: 'Project monitoring dashboard for health NGOs',
    descriptionFr: 'Tableau de bord de suivi de projet pour ONG de santé',
    sector: 'health',
    organizationTypes: ['ngo'],
    icon: 'Activity',
    colorScheme: ['teal', 'cyan', 'blue'],
    executiveSummaryTemplate: 'Suivi du projet {project_name}. {beneficiaries} bénéficiaires atteints sur {target} ({progress}%).',
    recommendedDataColumns: [
      { name: 'date', type: 'date', description: 'Date de l\'activité', required: true },
      { name: 'activite', type: 'category', description: 'Type d\'activité', required: true },
      { name: 'beneficiaires', type: 'numeric', description: 'Nombre de bénéficiaires', required: true },
      { name: 'zone', type: 'category', description: 'Zone d\'intervention', required: true },
      { name: 'budget', type: 'currency', description: 'Budget dépensé', required: false },
    ],
    kpis: [
      {
        title: 'Bénéficiaires Totaux',
        description: 'Nombre total de bénéficiaires atteints',
        chartType: 'metric',
        columns: { y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 4, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { compact: true },
      },
      {
        title: 'Répartition par Activité',
        description: 'Bénéficiaires par type d\'activité',
        chartType: 'bar',
        columns: { x: 'activite', y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 2,
        isKeyMetric: false,
        colors: ['teal'],
      },
      {
        title: 'Couverture Géographique',
        description: 'Bénéficiaires par zone',
        chartType: 'pie',
        columns: { x: 'zone', y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 3,
        isKeyMetric: false,
        colors: ['cyan', 'teal', 'blue'],
      },
    ],
  },

  // ============================================================================
  // ÉDUCATION
  // ============================================================================
  {
    id: 'education-ministry-annual',
    name: 'Ministry of Education - Annual Report',
    nameFr: 'Ministère de l\'Éducation - Rapport Annuel',
    description: 'Annual education statistics dashboard',
    descriptionFr: 'Tableau de bord annuel des statistiques éducatives',
    sector: 'education',
    organizationTypes: ['ministry'],
    icon: 'GraduationCap',
    colorScheme: ['blue', 'indigo', 'violet'],
    executiveSummaryTemplate: 'Bilan annuel de l\'éducation nationale. Taux de scolarisation: {rate}%. Effectifs totaux: {total_students}.',
    recommendedDataColumns: [
      { name: 'annee_scolaire', type: 'category', description: 'Année scolaire', required: true },
      { name: 'region', type: 'category', description: 'Région éducative', required: true },
      { name: 'niveau', type: 'category', description: 'Niveau d\'enseignement', required: true },
      { name: 'effectifs', type: 'numeric', description: 'Nombre d\'élèves', required: true },
      { name: 'enseignants', type: 'numeric', description: 'Nombre d\'enseignants', required: false },
      { name: 'ecoles', type: 'numeric', description: 'Nombre d\'écoles', required: false },
      { name: 'taux_reussite', type: 'percentage', description: 'Taux de réussite aux examens', required: false },
    ],
    kpis: [
      {
        title: 'Effectifs Totaux',
        description: 'Nombre total d\'élèves scolarisés',
        chartType: 'metric',
        columns: { y: 'effectifs' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { compact: true },
      },
      {
        title: 'Effectifs par Niveau',
        description: 'Répartition des élèves par niveau d\'enseignement',
        chartType: 'bar',
        columns: { x: 'niveau', y: 'effectifs' },
        aggregation: 'sum',
        size: { cols: 5, rows: 2 },
        order: 2,
        isKeyMetric: false,
        colors: ['blue'],
      },
      {
        title: 'Répartition Régionale',
        description: 'Élèves par région éducative',
        chartType: 'barList',
        columns: { x: 'region', y: 'effectifs' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 3,
        isKeyMetric: false,
      },
      {
        title: 'Ratio Élèves/Enseignant',
        description: 'Nombre moyen d\'élèves par enseignant',
        chartType: 'metric',
        columns: { y: 'effectifs' },
        aggregation: 'avg',
        size: { cols: 3, rows: 1 },
        order: 4,
        isKeyMetric: true,
      },
      {
        title: 'Taux de Réussite',
        description: 'Taux de réussite aux examens par région',
        chartType: 'bar',
        columns: { x: 'region', y: 'taux_reussite' },
        aggregation: 'avg',
        size: { cols: 6, rows: 2 },
        order: 5,
        isKeyMetric: true,
        valueFormat: { suffix: '%' },
        colors: ['indigo'],
      },
      {
        title: 'Nombre d\'Écoles',
        description: 'Établissements scolaires par région',
        chartType: 'donut',
        columns: { x: 'region', y: 'ecoles' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 6,
        isKeyMetric: false,
        colors: ['blue', 'indigo', 'violet'],
      },
    ],
  },
  {
    id: 'education-school-performance',
    name: 'School Performance Dashboard',
    nameFr: 'Tableau de Bord Performance Scolaire',
    description: 'Individual school performance tracking',
    descriptionFr: 'Suivi de performance d\'un établissement scolaire',
    sector: 'education',
    organizationTypes: ['enterprise', 'ngo'],
    icon: 'BookOpen',
    colorScheme: ['amber', 'yellow', 'orange'],
    executiveSummaryTemplate: 'Performance scolaire: Taux de réussite {success_rate}%. Amélioration de {improvement}% vs année précédente.',
    recommendedDataColumns: [
      { name: 'trimestre', type: 'category', description: 'Trimestre', required: true },
      { name: 'matiere', type: 'category', description: 'Matière', required: true },
      { name: 'classe', type: 'category', description: 'Classe', required: true },
      { name: 'moyenne', type: 'numeric', description: 'Moyenne de classe', required: true },
      { name: 'effectif', type: 'numeric', description: 'Effectif de la classe', required: false },
    ],
    kpis: [
      {
        title: 'Moyenne Générale',
        description: 'Moyenne générale de l\'établissement',
        chartType: 'metric',
        columns: { y: 'moyenne' },
        aggregation: 'avg',
        size: { cols: 4, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { decimals: 2, suffix: '/20' },
      },
      {
        title: 'Performance par Matière',
        description: 'Moyennes par matière',
        chartType: 'bar',
        columns: { x: 'matiere', y: 'moyenne' },
        aggregation: 'avg',
        size: { cols: 6, rows: 2 },
        order: 2,
        isKeyMetric: false,
        colors: ['amber'],
      },
    ],
  },

  // ============================================================================
  // AGRICULTURE
  // ============================================================================
  {
    id: 'agriculture-production',
    name: 'Agricultural Production Dashboard',
    nameFr: 'Tableau de Bord Production Agricole',
    description: 'Crop production and yield monitoring',
    descriptionFr: 'Suivi de la production et des rendements agricoles',
    sector: 'agriculture',
    organizationTypes: ['ministry', 'ngo', 'enterprise'],
    icon: 'Wheat',
    colorScheme: ['green', 'emerald', 'lime'],
    executiveSummaryTemplate: 'Production agricole totale: {total_production} tonnes. Rendement moyen: {yield} tonnes/ha. Couverture: {area} hectares.',
    recommendedDataColumns: [
      { name: 'campagne', type: 'category', description: 'Campagne agricole', required: true },
      { name: 'region', type: 'category', description: 'Région', required: true },
      { name: 'culture', type: 'category', description: 'Type de culture', required: true },
      { name: 'production', type: 'numeric', description: 'Production en tonnes', required: true },
      { name: 'surface', type: 'numeric', description: 'Surface cultivée en hectares', required: true },
      { name: 'rendement', type: 'numeric', description: 'Rendement en tonnes/ha', required: false },
      { name: 'producteurs', type: 'numeric', description: 'Nombre de producteurs', required: false },
    ],
    kpis: [
      {
        title: 'Production Totale',
        description: 'Production agricole totale en tonnes',
        chartType: 'metric',
        columns: { y: 'production' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { suffix: ' t', compact: true },
      },
      {
        title: 'Surface Cultivée',
        description: 'Surface totale cultivée en hectares',
        chartType: 'metric',
        columns: { y: 'surface' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 2,
        isKeyMetric: true,
        valueFormat: { suffix: ' ha', compact: true },
      },
      {
        title: 'Production par Culture',
        description: 'Répartition de la production par type de culture',
        chartType: 'bar',
        columns: { x: 'culture', y: 'production' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 3,
        isKeyMetric: false,
        colors: ['green'],
      },
      {
        title: 'Rendement Moyen',
        description: 'Rendement moyen en tonnes par hectare',
        chartType: 'gauge',
        columns: { y: 'rendement' },
        aggregation: 'avg',
        size: { cols: 3, rows: 2 },
        order: 4,
        isKeyMetric: true,
        valueFormat: { suffix: ' t/ha', decimals: 1 },
        thresholds: { warning: 1.5, critical: 1, target: 3 },
      },
      {
        title: 'Production Régionale',
        description: 'Production par région',
        chartType: 'barList',
        columns: { x: 'region', y: 'production' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 5,
        isKeyMetric: false,
      },
      {
        title: 'Répartition des Cultures',
        description: 'Part de chaque culture dans la production',
        chartType: 'donut',
        columns: { x: 'culture', y: 'production' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 6,
        isKeyMetric: false,
        colors: ['green', 'emerald', 'lime', 'teal'],
      },
    ],
  },

  // ============================================================================
  // FINANCE
  // ============================================================================
  {
    id: 'finance-budget-execution',
    name: 'Budget Execution Dashboard',
    nameFr: 'Tableau de Bord Exécution Budgétaire',
    description: 'Government budget execution tracking',
    descriptionFr: 'Suivi de l\'exécution budgétaire gouvernementale',
    sector: 'finance',
    organizationTypes: ['ministry'],
    icon: 'Banknote',
    colorScheme: ['blue', 'cyan', 'teal'],
    executiveSummaryTemplate: 'Taux d\'exécution budgétaire: {execution_rate}%. Recettes: {revenues}. Dépenses: {expenses}.',
    recommendedDataColumns: [
      { name: 'exercice', type: 'category', description: 'Exercice budgétaire', required: true },
      { name: 'mois', type: 'date', description: 'Mois', required: true },
      { name: 'categorie', type: 'category', description: 'Catégorie budgétaire', required: true },
      { name: 'budget_prevu', type: 'currency', description: 'Budget prévu', required: true },
      { name: 'budget_execute', type: 'currency', description: 'Budget exécuté', required: true },
      { name: 'type', type: 'category', description: 'Recette ou Dépense', required: true },
    ],
    kpis: [
      {
        title: 'Taux d\'Exécution',
        description: 'Pourcentage du budget exécuté',
        chartType: 'gauge',
        columns: { y: 'budget_execute' },
        aggregation: 'sum',
        size: { cols: 3, rows: 2 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { suffix: '%' },
        thresholds: { warning: 50, critical: 30, target: 95 },
      },
      {
        title: 'Budget Total',
        description: 'Budget total prévu',
        chartType: 'metric',
        columns: { y: 'budget_prevu' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 2,
        isKeyMetric: true,
        valueFormat: { prefix: 'FCFA ', compact: true },
      },
      {
        title: 'Évolution Mensuelle',
        description: 'Évolution de l\'exécution dans le temps',
        chartType: 'area',
        columns: { x: 'mois', y: 'budget_execute' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 3,
        isKeyMetric: false,
        colors: ['blue'],
      },
      {
        title: 'Exécution par Catégorie',
        description: 'Budget exécuté par catégorie',
        chartType: 'bar',
        columns: { x: 'categorie', y: 'budget_execute' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 4,
        isKeyMetric: false,
        colors: ['cyan'],
      },
      {
        title: 'Prévu vs Exécuté',
        description: 'Comparaison budget prévu et exécuté',
        chartType: 'bar',
        columns: { x: 'categorie', y: 'budget_execute', groupBy: 'type' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 5,
        isKeyMetric: false,
        colors: ['blue', 'cyan'],
      },
    ],
  },

  // ============================================================================
  // INFRASTRUCTURE
  // ============================================================================
  {
    id: 'infrastructure-projects',
    name: 'Infrastructure Projects Dashboard',
    nameFr: 'Tableau de Bord Projets Infrastructure',
    description: 'Construction and infrastructure project tracking',
    descriptionFr: 'Suivi des projets de construction et infrastructure',
    sector: 'infrastructure',
    organizationTypes: ['ministry', 'enterprise'],
    icon: 'Building2',
    colorScheme: ['slate', 'gray', 'zinc'],
    executiveSummaryTemplate: '{total_projects} projets en cours. Avancement moyen: {avg_progress}%. Budget total: {total_budget}.',
    recommendedDataColumns: [
      { name: 'projet', type: 'text', description: 'Nom du projet', required: true },
      { name: 'region', type: 'category', description: 'Région', required: true },
      { name: 'type_projet', type: 'category', description: 'Type de projet', required: true },
      { name: 'statut', type: 'category', description: 'Statut du projet', required: true },
      { name: 'avancement', type: 'percentage', description: 'Pourcentage d\'avancement', required: true },
      { name: 'budget', type: 'currency', description: 'Budget alloué', required: true },
      { name: 'depense', type: 'currency', description: 'Dépenses effectuées', required: false },
      { name: 'date_debut', type: 'date', description: 'Date de début', required: false },
      { name: 'date_fin_prevue', type: 'date', description: 'Date de fin prévue', required: false },
    ],
    kpis: [
      {
        title: 'Projets en Cours',
        description: 'Nombre total de projets',
        chartType: 'metric',
        columns: { y: 'projet' },
        aggregation: 'count',
        size: { cols: 3, rows: 1 },
        order: 1,
        isKeyMetric: true,
      },
      {
        title: 'Avancement Moyen',
        description: 'Progression moyenne des projets',
        chartType: 'gauge',
        columns: { y: 'avancement' },
        aggregation: 'avg',
        size: { cols: 3, rows: 2 },
        order: 2,
        isKeyMetric: true,
        valueFormat: { suffix: '%' },
        thresholds: { warning: 30, critical: 15, target: 80 },
      },
      {
        title: 'Budget Total',
        description: 'Budget total des projets',
        chartType: 'metric',
        columns: { y: 'budget' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 3,
        isKeyMetric: true,
        valueFormat: { prefix: 'FCFA ', compact: true },
      },
      {
        title: 'Projets par Statut',
        description: 'Répartition des projets par statut',
        chartType: 'donut',
        columns: { x: 'statut', y: 'projet' },
        aggregation: 'count',
        size: { cols: 4, rows: 2 },
        order: 4,
        isKeyMetric: false,
        colors: ['slate', 'gray', 'zinc', 'stone'],
      },
      {
        title: 'Avancement par Projet',
        description: 'Progression de chaque projet',
        chartType: 'bar',
        columns: { x: 'projet', y: 'avancement' },
        aggregation: 'avg',
        size: { cols: 6, rows: 2 },
        order: 5,
        isKeyMetric: false,
        valueFormat: { suffix: '%' },
        colors: ['slate'],
      },
      {
        title: 'Projets par Région',
        description: 'Distribution géographique',
        chartType: 'barList',
        columns: { x: 'region', y: 'projet' },
        aggregation: 'count',
        size: { cols: 4, rows: 2 },
        order: 6,
        isKeyMetric: false,
      },
    ],
  },

  // ============================================================================
  // SOCIAL
  // ============================================================================
  {
    id: 'social-protection',
    name: 'Social Protection Dashboard',
    nameFr: 'Tableau de Bord Protection Sociale',
    description: 'Social welfare and protection programs monitoring',
    descriptionFr: 'Suivi des programmes de protection sociale',
    sector: 'social',
    organizationTypes: ['ministry', 'ngo'],
    icon: 'Users',
    colorScheme: ['purple', 'violet', 'fuchsia'],
    executiveSummaryTemplate: '{beneficiaries} bénéficiaires des programmes sociaux. Montant distribué: {amount}. Couverture: {coverage}%.',
    recommendedDataColumns: [
      { name: 'programme', type: 'category', description: 'Nom du programme', required: true },
      { name: 'region', type: 'category', description: 'Région', required: true },
      { name: 'beneficiaires', type: 'numeric', description: 'Nombre de bénéficiaires', required: true },
      { name: 'montant', type: 'currency', description: 'Montant distribué', required: true },
      { name: 'menages', type: 'numeric', description: 'Nombre de ménages', required: false },
      { name: 'periode', type: 'date', description: 'Période', required: false },
    ],
    kpis: [
      {
        title: 'Bénéficiaires Totaux',
        description: 'Nombre total de bénéficiaires',
        chartType: 'metric',
        columns: { y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 1,
        isKeyMetric: true,
        valueFormat: { compact: true },
      },
      {
        title: 'Montant Distribué',
        description: 'Total des montants distribués',
        chartType: 'metric',
        columns: { y: 'montant' },
        aggregation: 'sum',
        size: { cols: 3, rows: 1 },
        order: 2,
        isKeyMetric: true,
        valueFormat: { prefix: 'FCFA ', compact: true },
      },
      {
        title: 'Bénéficiaires par Programme',
        description: 'Répartition par programme',
        chartType: 'bar',
        columns: { x: 'programme', y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 6, rows: 2 },
        order: 3,
        isKeyMetric: false,
        colors: ['purple'],
      },
      {
        title: 'Couverture Régionale',
        description: 'Bénéficiaires par région',
        chartType: 'donut',
        columns: { x: 'region', y: 'beneficiaires' },
        aggregation: 'sum',
        size: { cols: 4, rows: 2 },
        order: 4,
        isKeyMetric: false,
        colors: ['purple', 'violet', 'fuchsia', 'pink'],
      },
    ],
  },
];

/**
 * Récupère les templates par secteur
 */
export function getTemplatesBySector(sector: Sector): ReportTemplate[] {
  return REPORT_TEMPLATES.filter(t => t.sector === sector);
}

/**
 * Récupère les templates par type d'organisation
 */
export function getTemplatesByOrganizationType(type: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter(t => t.organizationTypes.includes(type));
}

/**
 * Récupère un template par ID
 */
export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find(t => t.id === id);
}

/**
 * Applique un template à un dataset
 * Génère une DashboardConfig complète basée sur le template
 */
export function applyTemplate(
  template: ReportTemplate,
  datasetId: string,
  customizations?: {
    title?: string;
    colorScheme?: string[];
  }
): DashboardConfig {
  const kpis: KPIConfig[] = template.kpis.map((kpi, index) => ({
    ...kpi,
    id: `kpi-${datasetId}-${index}`,
    colors: customizations?.colorScheme || kpi.colors || template.colorScheme,
  }));

  return {
    version: '2.0',
    title: customizations?.title || template.nameFr,
    description: template.descriptionFr,
    executiveSummary: template.executiveSummaryTemplate,
    keyInsights: [],
    recommendations: [],
    kpis,
    globalFilters: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'template',
      tokensUsed: 0,
      processingTimeMs: 0,
    },
  };
}

/**
 * Détecte le meilleur template pour des colonnes données
 */
export function detectBestTemplate(
  columns: { name: string; type: string }[],
  sector: Sector,
  organizationType: string
): ReportTemplate | null {
  const sectorTemplates = getTemplatesBySector(sector);
  
  if (sectorTemplates.length === 0) {
    return null;
  }

  // Score chaque template basé sur la correspondance des colonnes
  const scoredTemplates = sectorTemplates.map(template => {
    const requiredColumns = template.recommendedDataColumns.filter(c => c.required);
    const columnNames = columns.map(c => c.name.toLowerCase());
    
    let score = 0;
    for (const reqCol of requiredColumns) {
      const found = columnNames.some(
        name => name.includes(reqCol.name.toLowerCase()) || 
                reqCol.name.toLowerCase().includes(name)
      );
      if (found) score += 10;
    }

    // Bonus pour type d'organisation correspondant
    if (template.organizationTypes.includes(organizationType)) {
      score += 20;
    }

    return { template, score };
  });

  // Retourner le meilleur score
  scoredTemplates.sort((a, b) => b.score - a.score);
  return scoredTemplates[0]?.score > 0 ? scoredTemplates[0].template : sectorTemplates[0];
}
