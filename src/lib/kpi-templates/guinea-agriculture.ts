/**
 * InsightGov Africa - Guinea Agriculture Sector KPI Templates
 * =============================================================
 * Indicateurs spécifiques pour le secteur agricole guinéen
 * Focus: Riz, Café, Cacao, Anacarde, Palmier à huile, Fruits
 */

import { KPITemplateDefinition } from './health';

export const guineaAgricultureKPIs: KPITemplateDefinition[] = [
  // RICE PRODUCTION (Staple food)
  {
    id: 'guinea_rice_production',
    name: 'Rice Production Volume',
    nameFr: 'Volume de production de riz',
    category: 'production',
    calculation: 'Total rice produced (paddy and milled)',
    unit: 'tonnes',
    format: 'number',
    target: 2000000, // 2 million tonnes
    sdgAlignment: 'ODD 2.3',
    frequency: 'seasonal',
    dimensions: ['region', 'variety', 'season'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_rice_self_sufficiency',
    name: 'Rice Self-Sufficiency Rate',
    nameFr: 'Taux d\'autosuffisance en riz',
    category: 'food_security',
    calculation: '(Local production / Total consumption) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 2.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'guinea_rice_imports',
    name: 'Rice Imports',
    nameFr: 'Importations de riz',
    category: 'trade',
    calculation: 'Total rice imported',
    unit: 'tonnes',
    format: 'number',
    target: 200000, // Reduce imports
    lowerIsBetter: true,
    sdgAlignment: 'ODD 2.1',
    frequency: 'monthly',
    dimensions: ['origin', 'type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_rice_yield',
    name: 'Rice Yield per Hectare',
    nameFr: 'Rendement riz par hectare',
    category: 'productivity',
    calculation: 'Rice production / Cultivated area',
    unit: 'tonnes/ha',
    format: 'number',
    target: 3.5, // Improve from current ~2 t/ha
    sdgAlignment: 'ODD 2.3',
    frequency: 'seasonal',
    dimensions: ['region', 'variety', 'irrigation_type'],
    visualization: { defaultType: 'kpi' }
  },

  // CASH CROPS - COFFEE
  {
    id: 'guinea_coffee_production',
    name: 'Coffee Production Volume',
    nameFr: 'Volume de production de café',
    category: 'cash_crops',
    calculation: 'Total coffee beans produced',
    unit: 'tonnes',
    format: 'number',
    target: 50000, // 50,000 tonnes
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'variety'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_coffee_exports',
    name: 'Coffee Export Value',
    nameFr: 'Valeur des exportations de café',
    category: 'exports',
    calculation: 'Total coffee export value',
    unit: 'USD',
    format: 'currency',
    target: 100000000, // $100 million
    sdgAlignment: 'ODD 17.11',
    frequency: 'annual',
    dimensions: ['variety', 'destination'],
    visualization: { defaultType: 'kpi' }
  },

  // CASH CROPS - CACAO
  {
    id: 'guinea_cocoa_production',
    name: 'Cocoa Production Volume',
    nameFr: 'Volume de production de cacao',
    category: 'cash_crops',
    calculation: 'Total cocoa beans produced',
    unit: 'tonnes',
    format: 'number',
    target: 30000, // Growing sector
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'variety'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_cocoa_exports',
    name: 'Cocoa Export Value',
    nameFr: 'Valeur des exportations de cacao',
    category: 'exports',
    calculation: 'Total cocoa export value',
    unit: 'USD',
    format: 'currency',
    target: 80000000, // $80 million
    sdgAlignment: 'ODD 17.11',
    frequency: 'annual',
    dimensions: ['quality_grade', 'destination'],
    visualization: { defaultType: 'kpi' }
  },

  // CASHEW (Anacarde) - Growing export
  {
    id: 'guinea_cashew_production',
    name: 'Cashew Production Volume',
    nameFr: 'Volume de production d\'anacarde',
    category: 'cash_crops',
    calculation: 'Total raw cashew nuts produced',
    unit: 'tonnes',
    format: 'number',
    target: 100000, // Fast growing
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'processing_status'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_cashew_processing',
    name: 'Cashew Processing Rate',
    nameFr: 'Taux de transformation anacarde',
    category: 'value_addition',
    calculation: '(Processed nuts / Total production) × 100',
    unit: '%',
    format: 'percentage',
    target: 50, // Government target
    sdgAlignment: 'ODD 9.2',
    frequency: 'annual',
    dimensions: ['region', 'processing_type'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // PALM OIL
  {
    id: 'guinea_palm_oil_production',
    name: 'Palm Oil Production',
    nameFr: 'Production d\'huile de palme',
    category: 'cash_crops',
    calculation: 'Total crude palm oil produced',
    unit: 'tonnes',
    format: 'number',
    target: 50000, // 50,000 tonnes
    sdgAlignment: 'ODD 2.3',
    frequency: 'monthly',
    dimensions: ['region', 'plantation_type'],
    visualization: { defaultType: 'kpi' }
  },

  // FRUITS & VEGETABLES
  {
    id: 'guinea_fruits_production',
    name: 'Fruit Production Volume',
    nameFr: 'Volume de production de fruits',
    category: 'horticulture',
    calculation: 'Total fruit production',
    unit: 'tonnes',
    format: 'number',
    target: 500000, // Mango, pineapple, banana, etc.
    sdgAlignment: 'ODD 2.3',
    frequency: 'seasonal',
    dimensions: ['fruit_type', 'region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_mango_exports',
    name: 'Mango Export Volume',
    nameFr: 'Volume d\'exportation de mangues',
    category: 'exports',
    calculation: 'Total mangoes exported',
    unit: 'tonnes',
    format: 'number',
    target: 15000, // Growing European market
    sdgAlignment: 'ODD 17.11',
    frequency: 'seasonal',
    dimensions: ['variety', 'destination'],
    visualization: { defaultType: 'kpi' }
  },

  // LIVESTOCK
  {
    id: 'guinea_cattle_population',
    name: 'Cattle Population',
    nameFr: 'Population bovine',
    category: 'livestock',
    calculation: 'Total cattle count',
    unit: 'heads',
    format: 'number',
    target: 3000000, // 3 million cattle
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'breed'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_poultry_production',
    name: 'Poultry Production',
    nameFr: 'Production avicole',
    category: 'livestock',
    calculation: 'Total poultry raised',
    unit: 'heads',
    format: 'number',
    target: 10000000, // 10 million
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['type', 'region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_meat_production',
    name: 'Meat Production',
    nameFr: 'Production de viande',
    category: 'livestock',
    calculation: 'Total meat produced',
    unit: 'tonnes',
    format: 'number',
    target: 80000, // 80,000 tonnes
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['meat_type', 'region'],
    visualization: { defaultType: 'kpi' }
  },

  // FISHERIES
  {
    id: 'guinea_fish_production',
    name: 'Fish Production',
    nameFr: 'Production halieutique',
    category: 'fisheries',
    calculation: 'Total fish catch (marine + inland)',
    unit: 'tonnes',
    format: 'number',
    target: 200000, // 200,000 tonnes
    sdgAlignment: 'ODD 14.4',
    frequency: 'monthly',
    dimensions: ['fishing_type', 'species'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_fishing_employment',
    name: 'Fishing Employment',
    nameFr: 'Emploi dans la pêche',
    category: 'fisheries',
    calculation: 'Total people employed in fishing',
    unit: 'persons',
    format: 'number',
    target: 100000, // 100,000 fishers
    sdgAlignment: 'ODD 8.5',
    frequency: 'annual',
    dimensions: ['fishing_type', 'region'],
    visualization: { defaultType: 'kpi' }
  },

  // AGRICULTURAL SUPPORT
  {
    id: 'guinea_irrigated_area',
    name: 'Irrigated Agricultural Area',
    nameFr: 'Surface agricole irriguée',
    category: 'infrastructure',
    calculation: 'Total irrigated land',
    unit: 'hectares',
    format: 'number',
    target: 50000, // 50,000 ha target
    sdgAlignment: 'ODD 2.a',
    frequency: 'annual',
    dimensions: ['region', 'irrigation_type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_tractor_density',
    name: 'Tractor Density',
    nameFr: 'Densité de tracteurs',
    category: 'mechanization',
    calculation: 'Number of tractors per 1000 ha',
    unit: '/1000 ha',
    format: 'number',
    target: 5, // Improve mechanization
    sdgAlignment: 'ODD 2.a',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_fertilizer_use',
    name: 'Fertilizer Application Rate',
    nameFr: 'Taux d\'application d\'engrais',
    category: 'inputs',
    calculation: 'Average fertilizer use per hectare',
    unit: 'kg/ha',
    format: 'number',
    target: 50, // Increase from very low levels
    sdgAlignment: 'ODD 2.a',
    frequency: 'seasonal',
    dimensions: ['region', 'crop', 'fertilizer_type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_seed_distribution',
    name: 'Improved Seed Distribution',
    nameFr: 'Distribution de semences améliorées',
    category: 'inputs',
    calculation: 'Total improved seeds distributed',
    unit: 'tonnes',
    format: 'number',
    target: 10000, // 10,000 tonnes
    sdgAlignment: 'ODD 2.a',
    frequency: 'seasonal',
    dimensions: ['crop', 'variety', 'region'],
    visualization: { defaultType: 'kpi' }
  },

  // FARMER SUPPORT
  {
    id: 'guinea_farmers_reached',
    name: 'Farmers Reached by Programs',
    nameFr: 'Agriculteurs atteints par les programmes',
    category: 'extension',
    calculation: 'Number of farmers receiving support',
    unit: 'farmers',
    format: 'number',
    target: 500000, // 500,000 farmers
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'program_type', 'gender'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_agricultural_credit',
    name: 'Agricultural Credit Disbursed',
    nameFr: 'Crédit agricole distribué',
    category: 'finance',
    calculation: 'Total credit to agricultural sector',
    unit: 'GNF',
    format: 'currency',
    target: 500000000000, // 500 billion GNF
    sdgAlignment: 'ODD 2.a',
    frequency: 'quarterly',
    dimensions: ['credit_type', 'region', 'crop'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'guinea_cooperatives',
    name: 'Active Agricultural Cooperatives',
    nameFr: 'Coopératives agricoles actives',
    category: 'organization',
    calculation: 'Number of registered cooperatives',
    unit: 'cooperatives',
    format: 'number',
    target: 5000, // 5,000 cooperatives
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'type', 'crop'],
    visualization: { defaultType: 'kpi' }
  },
];

// Guinea Agricultural Regions & Specialties
export const guineaAgriRegions = [
  { code: 'GUIN_MAR', name: 'Guinée Maritime', specialties: ['Riz', 'Fruits', 'Palmier'], rainfall: '3000mm' },
  { code: 'MOY_GUIN', name: 'Moyenne Guinée', specialties: ['Riz', 'Coton', 'Arachide'], rainfall: '1500mm' },
  { code: 'HAUT_GUIN', name: 'Haute Guinée', specialties: ['Riz', 'Coton', 'Anacarde', 'Mangue'], rainfall: '1200mm' },
  { code: 'GUI_FORE', name: 'Guinée Forestière', specialties: ['Café', 'Cacao', 'Riz', 'Palmier'], rainfall: '2000mm' },
] as const;

// Key Crops Calendar
export const guineaCropCalendar = [
  { crop: 'Riz pluvial', planting: 'Avril-Mai', harvest: 'Octobre-Novembre' },
  { crop: 'Riz de bas-fond', planting: 'Juin-Juillet', harvest: 'Décembre-Janvier' },
  { crop: 'Riz irrigué', planting: 'Toute l\'année', harvest: 'Toute l\'année' },
  { crop: 'Café', planting: 'Mars-Juin', harvest: 'Novembre-Janvier' },
  { crop: 'Cacao', planting: 'Mars-Juin', harvest: 'Octobre-Décembre' },
  { crop: 'Anacarde', planting: 'Juin-Août', harvest: 'Février-Mai' },
  { crop: 'Mangue', planting: 'Juin-Sept', harvest: 'Mars-Juin' },
] as const;

export default guineaAgricultureKPIs;
