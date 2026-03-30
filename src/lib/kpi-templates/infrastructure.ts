/**
 * InsightGov Africa - Infrastructure Sector KPI Templates
 * =========================================================
 * Indicateurs de performance pour le secteur des infrastructures
 */

import { KPITemplateDefinition } from './health';

export const infrastructureKPIs: KPITemplateDefinition[] = [
  // ROADS
  {
    id: 'infrastructure_road_network',
    name: 'Total Road Network Length',
    nameFr: 'Longueur totale du réseau routier',
    category: 'roads',
    calculation: 'Sum of all road lengths',
    unit: 'km',
    format: 'number',
    target: 50000,
    sdgAlignment: 'ODD 9.1',
    frequency: 'annual',
    dimensions: ['road_type', 'region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'infrastructure_paved_roads',
    name: 'Paved Roads Share',
    nameFr: 'Part des routes revêtues',
    category: 'roads',
    calculation: '(Paved roads / Total roads) × 100',
    unit: '%',
    format: 'percentage',
    target: 30,
    sdgAlignment: 'ODD 9.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'infrastructure_road_condition',
    name: 'Roads in Good Condition',
    nameFr: 'Routes en bon état',
    category: 'roads',
    calculation: '(Good roads / Total roads) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    sdgAlignment: 'ODD 9.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'infrastructure_rural_access',
    name: 'Rural Road Access',
    nameFr: 'Accessibilité routière rurale',
    category: 'roads',
    calculation: '(Population with access / Rural population) × 100',
    unit: '%',
    format: 'percentage',
    target: 75,
    sdgAlignment: 'ODD 9.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // ENERGY
  {
    id: 'infrastructure_electrification_rate',
    name: 'Electrification Rate',
    nameFr: 'Taux d\'électrification',
    category: 'energy',
    calculation: '(Population with electricity / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 7.1',
    frequency: 'annual',
    dimensions: ['region', 'urban_rural'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'infrastructure_renewable_share',
    name: 'Renewable Energy Share',
    nameFr: 'Part des énergies renouvelables',
    category: 'energy',
    calculation: '(Renewable generation / Total generation) × 100',
    unit: '%',
    format: 'percentage',
    target: 50,
    sdgAlignment: 'ODD 7.2',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'infrastructure_system_losses',
    name: 'Electricity System Losses',
    nameFr: 'Pertes du système électrique',
    category: 'energy',
    calculation: '(Losses / Generation) × 100',
    unit: '%',
    format: 'percentage',
    target: 12,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 7.3',
    frequency: 'monthly',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },

  // WATER
  {
    id: 'infrastructure_water_access',
    name: 'Basic Water Access',
    nameFr: 'Accès à l\'eau de base',
    category: 'water',
    calculation: '(Population with water / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 6.1',
    frequency: 'annual',
    dimensions: ['region', 'urban_rural'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'infrastructure_sanitation_access',
    name: 'Basic Sanitation Access',
    nameFr: 'Accès à l\'assainissement de base',
    category: 'water',
    calculation: '(Population with sanitation / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 6.2',
    frequency: 'annual',
    dimensions: ['region', 'urban_rural'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'infrastructure_open_defecation',
    name: 'Open Defecation Rate',
    nameFr: 'Taux de défécation à l\'air libre',
    category: 'water',
    calculation: '(Population practicing OD / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 0,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 6.2',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },

  // ICT
  {
    id: 'infrastructure_internet_penetration',
    name: 'Internet Penetration Rate',
    nameFr: 'Taux de pénétration Internet',
    category: 'ict',
    calculation: '(Internet users / Population) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    sdgAlignment: 'ODD 9.c',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'infrastructure_mobile_penetration',
    name: 'Mobile Phone Penetration',
    nameFr: 'Taux de pénétration mobile',
    category: 'ict',
    calculation: '(Mobile subscriptions / Population) × 100',
    unit: '/100',
    format: 'number',
    target: 100,
    sdgAlignment: 'ODD 9.c',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'infrastructure_4g_coverage',
    name: '4G Network Coverage',
    nameFr: 'Couverture réseau 4G',
    category: 'ict',
    calculation: '(Population with 4G / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 9.c',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // HOUSING
  {
    id: 'infrastructure_housing_deficit',
    name: 'Housing Deficit',
    nameFr: 'Déficit de logements',
    category: 'housing',
    calculation: 'Housing need - Housing supply',
    unit: 'households',
    format: 'number',
    target: 0,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 11.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'infrastructure_slum_population',
    name: 'Slum Population Share',
    nameFr: 'Population en zone d\'habitat précaire',
    category: 'housing',
    calculation: '(Slum population / Urban population) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 11.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
];

export default infrastructureKPIs;
