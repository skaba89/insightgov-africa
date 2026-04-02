/**
 * InsightGov Africa - Guinea Mining Sector KPI Templates
 * ========================================================
 * Indicateurs spécifiques pour le secteur minier guinéen
 * Focus: Bauxite (1er producteur mondial), Or, Diamant
 */

import { KPITemplateDefinition } from './health';

export const guineaMiningKPIs: KPITemplateDefinition[] = [
  // BAUXITE PRODUCTION (Guinea is world's #1 producer)
  {
    id: 'guinea_bauxite_production',
    name: 'Bauxite Production Volume',
    nameFr: 'Volume de production de bauxite',
    category: 'production',
    calculation: 'Total tonnes of bauxite extracted',
    unit: 'tonnes',
    format: 'number',
    target: 100000000, // 100 million tonnes/year
    sdgAlignment: 'ODD 12.2',
    frequency: 'monthly',
    dimensions: ['mine', 'region', 'company'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_bauxite_alumina_content',
    name: 'Alumina (Al2O3) Content',
    nameFr: 'Teneur en alumine (Al2O3)',
    category: 'quality',
    calculation: 'Average Al2O3 percentage in bauxite',
    unit: '%',
    format: 'percentage',
    target: 55, // Guinea bauxite typically 50-60%
    frequency: 'weekly',
    dimensions: ['mine', 'deposit'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_bauxite_silica_content',
    name: 'Silica (SiO2) Content',
    nameFr: 'Teneur en silice (SiO2)',
    category: 'quality',
    calculation: 'Average SiO2 percentage in bauxite',
    unit: '%',
    format: 'percentage',
    target: 2, // Lower is better for alumina refining
    lowerIsBetter: true,
    frequency: 'weekly',
    dimensions: ['mine', 'deposit'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'guinea_bauxite_exports',
    name: 'Bauxite Export Volume',
    nameFr: 'Volume d\'exportation de bauxite',
    category: 'exports',
    calculation: 'Total bauxite exported',
    unit: 'tonnes',
    format: 'number',
    target: 95000000, // Annual target
    sdgAlignment: 'ODD 17.11',
    frequency: 'monthly',
    dimensions: ['port', 'destination', 'company'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_bauxite_export_value',
    name: 'Bauxite Export Value',
    nameFr: 'Valeur des exportations de bauxite',
    category: 'exports',
    calculation: 'Total USD value of bauxite exports',
    unit: 'USD',
    format: 'currency',
    target: 5000000000, // $5 billion
    sdgAlignment: 'ODD 17.1',
    frequency: 'monthly',
    dimensions: ['port', 'destination'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_alumina_refinery',
    name: 'Alumina Refinery Production',
    nameFr: 'Production de raffinerie d\'alumine',
    category: 'value_addition',
    calculation: 'Alumina produced from bauxite',
    unit: 'tonnes',
    format: 'number',
    target: 2000000, // Growing capacity
    frequency: 'monthly',
    dimensions: ['facility'],
    visualization: { defaultType: 'kpi' }
  },

  // GOLD MINING (Guinea is significant gold producer)
  {
    id: 'guinea_gold_production',
    name: 'Gold Production Volume',
    nameFr: 'Volume de production d\'or',
    category: 'production',
    calculation: 'Total gold produced (kilograms or ounces)',
    unit: 'kg',
    format: 'number',
    target: 40000, // ~40 tonnes/year
    sdgAlignment: 'ODD 12.2',
    frequency: 'monthly',
    dimensions: ['mine', 'region', 'type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_gold_artisanal',
    name: 'Artisanal Gold Production',
    nameFr: 'Production d\'or artisanal',
    category: 'production',
    calculation: 'Gold from artisanal and small-scale mining',
    unit: 'kg',
    format: 'number',
    target: 15000, // Significant portion
    frequency: 'quarterly',
    dimensions: ['region', 'prefecture'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_gold_exports',
    name: 'Gold Export Value',
    nameFr: 'Valeur des exportations d\'or',
    category: 'exports',
    calculation: 'Total USD value of gold exports',
    unit: 'USD',
    format: 'currency',
    target: 2000000000, // $2 billion
    sdgAlignment: 'ODD 17.1',
    frequency: 'monthly',
    dimensions: ['mine', 'destination'],
    visualization: { defaultType: 'kpi' }
  },

  // GOVERNMENT REVENUE
  {
    id: 'guinea_mining_royalties',
    name: 'Mining Royalties Collected',
    nameFr: 'Royalties minières collectées',
    category: 'government_revenue',
    calculation: 'Total mining royalties paid to government',
    unit: 'GNF',
    format: 'currency',
    target: 5000000000000, // 5 trillion GNF
    sdgAlignment: 'ODD 17.1',
    frequency: 'monthly',
    dimensions: ['mineral_type', 'company'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_mining_taxes',
    name: 'Mining Tax Revenue',
    nameFr: 'Recettes fiscales minières',
    category: 'government_revenue',
    calculation: 'Total taxes from mining sector',
    unit: 'GNF',
    format: 'currency',
    target: 10000000000000, // 10 trillion GNF
    sdgAlignment: 'ODD 17.1',
    frequency: 'quarterly',
    dimensions: ['tax_type', 'company'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_mining_dividends',
    name: 'State Mining Dividends',
    nameFr: 'Dividendes de l\'État',
    category: 'government_revenue',
    calculation: 'Dividends from state mining shares',
    unit: 'GNF',
    format: 'currency',
    target: 2000000000000, // 2 trillion GNF
    sdgAlignment: 'ODD 17.1',
    frequency: 'annual',
    dimensions: ['company'],
    visualization: { defaultType: 'kpi' }
  },

  // LOCAL CONTENT & DEVELOPMENT
  {
    id: 'guinea_local_employment_mining',
    name: 'Local Employment Rate (Mining)',
    nameFr: 'Taux d\'emploi local (Mines)',
    category: 'local_content',
    calculation: '(Guinean employees / Total employees) × 100',
    unit: '%',
    format: 'percentage',
    target: 85, // Mining code requirement
    sdgAlignment: 'ODD 8.5',
    frequency: 'quarterly',
    dimensions: ['mine', 'skill_level'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_local_procurement_mining',
    name: 'Local Procurement Rate (Mining)',
    nameFr: 'Taux d\'achats locaux (Mines)',
    category: 'local_content',
    calculation: '(Local purchases / Total purchases) × 100',
    unit: '%',
    format: 'percentage',
    target: 25, // Mining code target
    sdgAlignment: 'ODD 9.2',
    frequency: 'quarterly',
    dimensions: ['mine', 'category'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_community_development',
    name: 'Community Development Fund',
    nameFr: 'Fonds de développement communautaire',
    category: 'local_content',
    calculation: 'Community development contributions',
    unit: 'USD',
    format: 'currency',
    target: 50000000, // $50 million
    sdgAlignment: 'ODD 1.a',
    frequency: 'annual',
    dimensions: ['mine', 'region', 'project_type'],
    visualization: { defaultType: 'kpi' }
  },

  // INFRASTRUCTURE
  {
    id: 'guinea_railway_transport',
    name: 'Railway Transport Volume',
    nameFr: 'Volume transporté par chemin de fer',
    category: 'infrastructure',
    calculation: 'Tonnes transported by railway',
    unit: 'tonnes',
    format: 'number',
    target: 50000000, // 50 million tonnes
    frequency: 'monthly',
    dimensions: ['railway', 'mineral_type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_port_exports',
    name: 'Port Export Volume',
    nameFr: 'Volume d\'exportation portuaire',
    category: 'infrastructure',
    calculation: 'Tonnes exported through ports',
    unit: 'tonnes',
    format: 'number',
    target: 100000000, // 100 million tonnes
    frequency: 'monthly',
    dimensions: ['port', 'mineral_type'],
    visualization: { defaultType: 'kpi' }
  },

  // ENVIRONMENTAL & SOCIAL
  {
    id: 'guinea_mining_rehabilitation',
    name: 'Land Rehabilitation Progress',
    nameFr: 'Progrès de réhabilitation',
    category: 'environment',
    calculation: '(Rehabilitated hectares / Disturbed hectares) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 15.3',
    frequency: 'annual',
    dimensions: ['mine', 'region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_water_management',
    name: 'Water Quality Compliance',
    nameFr: 'Conformité qualité de l\'eau',
    category: 'environment',
    calculation: '(Compliant samples / Total samples) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 6.3',
    frequency: 'monthly',
    dimensions: ['mine', 'water_body'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // MINING CODE COMPLIANCE
  {
    id: 'guinea_mining_code_compliance',
    name: 'Mining Code Compliance Rate',
    nameFr: 'Taux de conformité au Code Minier',
    category: 'compliance',
    calculation: '(Compliant provisions / Total provisions) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    frequency: 'annual',
    dimensions: ['company', 'compliance_area'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_cahier_charges',
    name: 'Cahier des Charges Compliance',
    nameFr: 'Conformité au Cahier des Charges',
    category: 'compliance',
    calculation: '(Completed obligations / Total obligations) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    frequency: 'annual',
    dimensions: ['company', 'obligation_type'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
];

// Guinea Mining Regions
export const guineaMiningRegions = [
  { code: 'BOKE', name: 'Boké', minerals: ['Bauxite'], majorMines: ['Sangaredi', 'Kamsar'] },
  { code: 'KINDIA', name: 'Kindia', minerals: ['Bauxite'], majorMines: ['Débélé', 'Fria'] },
  { code: 'FARANAH', name: 'Faranah', minerals: ['Or', 'Diamant'], majorMines: ['Siguiri', 'Kouroussa'] },
  { code: 'KANKAN', name: 'Kankan', minerals: ['Or', 'Diamant'], majorMines: ['Mandiana'] },
  { code: 'NZEREKORE', name: 'N\'Zérékoré', minerals: ['Or', 'Fer'], majorMines: ['Simandou'] },
] as const;

// Major Mining Companies in Guinea
export const guineaMiningCompanies = [
  { name: 'CBG', fullName: 'Compagnie des Bauxites de Guinée', mineral: 'Bauxite', production: '14M tonnes' },
  { name: 'RUSAL', fullName: 'United Company RUSAL', mineral: 'Bauxite/Alumina', production: '3M tonnes' },
  { name: 'CBG-DC', fullName: 'CBG Dian-Dian', mineral: 'Bauxite', production: '12M tonnes' },
  { name: 'SMB', fullName: 'Société Minière de Boké', mineral: 'Bauxite', production: '35M tonnes' },
  { name: 'GAC', fullName: 'Guinea Alumina Corporation', mineral: 'Bauxite', production: '12M tonnes' },
  { name: 'AngloGold', fullName: 'AngloGold Ashanti', mineral: 'Or', production: '8 tonnes' },
] as const;

export default guineaMiningKPIs;
