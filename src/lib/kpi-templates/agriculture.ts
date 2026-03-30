/**
 * InsightGov Africa - Agriculture Sector KPI Templates
 * =====================================================
 * Indicateurs de performance pour le secteur agricole
 */

import { KPITemplateDefinition } from './health';

export const agricultureKPIs: KPITemplateDefinition[] = [
  // PRODUCTION
  {
    id: 'agriculture_cereal_yield',
    name: 'Cereal Yield',
    nameFr: 'Rendement céréalier',
    category: 'production',
    calculation: 'Total cereal production / Harvested area',
    unit: 'kg/ha',
    format: 'number',
    target: 2500,
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region', 'crop_type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'agriculture_production_index',
    name: 'Crop Production Index',
    nameFr: 'Indice de production végétale',
    category: 'production',
    calculation: '(Current production / Base production) × 100',
    unit: 'index',
    format: 'number',
    target: 120,
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'trend' }
  },
  {
    id: 'agriculture_livestock_index',
    name: 'Livestock Production Index',
    nameFr: 'Indice de production animale',
    category: 'production',
    calculation: '(Current production / Base production) × 100',
    unit: 'index',
    format: 'number',
    target: 120,
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'trend' }
  },

  // FOOD SECURITY
  {
    id: 'agriculture_food_insecurity',
    name: 'Prevalence of Food Insecurity',
    nameFr: 'Prévalence de l\'insécurité alimentaire',
    category: 'food_security',
    calculation: '(Food insecure population / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 15,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 2.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'agriculture_undernourishment',
    name: 'Prevalence of Undernourishment',
    nameFr: 'Prévalence de la sous-alimentation',
    category: 'food_security',
    calculation: '(Undernourished population / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 2.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'agriculture_cereal_self_sufficiency',
    name: 'Cereal Self-Sufficiency Ratio',
    nameFr: 'Taux d\'autosuffisance céréalier',
    category: 'food_security',
    calculation: '(Cereal production / Total cereal supply) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    sdgAlignment: 'ODD 2.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },

  // LAND & IRRIGATION
  {
    id: 'agriculture_irrigated_area',
    name: 'Irrigated Area',
    nameFr: 'Surface irriguée',
    category: 'land',
    calculation: 'Total irrigated agricultural area',
    unit: 'ha',
    format: 'number',
    target: 500000,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'agriculture_irrigation_share',
    name: 'Irrigated Area Share',
    nameFr: 'Part des terres irriguées',
    category: 'land',
    calculation: '(Irrigated area / Cultivated area) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'agriculture_arable_land',
    name: 'Arable Land per Capita',
    nameFr: 'Terres arables par habitant',
    category: 'land',
    calculation: 'Arable land / Population',
    unit: 'ha/person',
    format: 'number',
    target: 0.25,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },

  // INPUTS
  {
    id: 'agriculture_fertilizer_use',
    name: 'Fertilizer Consumption',
    nameFr: 'Consommation d\'engrais',
    category: 'inputs',
    calculation: 'Total fertilizer used / Arable land',
    unit: 'kg/ha',
    format: 'number',
    target: 50,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'agriculture_improved_seeds',
    name: 'Improved Seed Use Rate',
    nameFr: 'Taux d\'utilisation de semences améliorées',
    category: 'inputs',
    calculation: '(Farmers using improved seeds / Total farmers) × 100',
    unit: '%',
    format: 'percentage',
    target: 50,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },

  // FARMERS
  {
    id: 'agriculture_farmer_income',
    name: 'Average Farmer Income',
    nameFr: 'Revenu moyen des agriculteurs',
    category: 'livelihoods',
    calculation: 'Total farm income / Farm households',
    unit: 'USD',
    format: 'currency',
    target: 3000,
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'agriculture_credit_access',
    name: 'Agricultural Credit Access',
    nameFr: 'Accès au crédit agricole',
    category: 'livelihoods',
    calculation: '(Farmers with credit / Total farmers) × 100',
    unit: '%',
    format: 'percentage',
    target: 40,
    sdgAlignment: 'ODD 2.3',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'agriculture_female_farmers',
    name: 'Female Farmers Share',
    nameFr: 'Part des agricultrices',
    category: 'livelihoods',
    calculation: '(Female farmers / Total farmers) × 100',
    unit: '%',
    format: 'percentage',
    target: 50,
    sdgAlignment: 'ODD 5.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },

  // SUSTAINABILITY
  {
    id: 'agriculture_organic_farming',
    name: 'Organic Farming Share',
    nameFr: 'Part de l\'agriculture biologique',
    category: 'sustainability',
    calculation: '(Organic land / Agricultural land) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    sdgAlignment: 'ODD 2.4',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'agriculture_forest_cover',
    name: 'Forest Cover',
    nameFr: 'Couverture forestière',
    category: 'sustainability',
    calculation: '(Forest area / Total land) × 100',
    unit: '%',
    format: 'percentage',
    target: 25,
    sdgAlignment: 'ODD 15.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'agriculture_government_spending',
    name: 'Government Agricultural Expenditure',
    nameFr: 'Dépenses agricoles du gouvernement',
    category: 'financing',
    calculation: '(Ag expenditure / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 10,
    sdgAlignment: 'ODD 2.a',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
];

export default agricultureKPIs;
