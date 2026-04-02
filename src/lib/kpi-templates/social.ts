/**
 * InsightGov Africa - Social Protection KPI Templates
 * =====================================================
 * Indicateurs de performance pour la protection sociale
 */

import { KPITemplateDefinition } from './health';

export const socialKPIs: KPITemplateDefinition[] = [
  // COVERAGE
  {
    id: 'social_protection_coverage',
    name: 'Social Protection Coverage',
    nameFr: 'Couverture de la protection sociale',
    category: 'coverage',
    calculation: '(Covered population / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 50,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: ['region', 'program_type'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'social_coverage_poor',
    name: 'Social Protection Coverage - Poor',
    nameFr: 'Couverture des pauvres',
    category: 'coverage',
    calculation: '(Covered poor / Total poor) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'social_coverage_elderly',
    name: 'Social Protection Coverage - Elderly',
    nameFr: 'Couverture des personnes âgées',
    category: 'coverage',
    calculation: '(Elderly with pension / Total elderly) × 100',
    unit: '%',
    format: 'percentage',
    target: 60,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },

  // POVERTY
  {
    id: 'social_poverty_rate',
    name: 'Poverty Rate',
    nameFr: 'Taux de pauvreté',
    category: 'poverty',
    calculation: '(Poor population / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 1.2',
    frequency: 'annual',
    dimensions: ['region', 'urban_rural'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'social_extreme_poverty',
    name: 'Extreme Poverty Rate',
    nameFr: 'Taux de pauvreté extrême',
    category: 'poverty',
    calculation: '(Extreme poor / Total population) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 1.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'social_gini_coefficient',
    name: 'Gini Coefficient',
    nameFr: 'Coefficient de Gini',
    category: 'poverty',
    calculation: 'Statistical measure of income distribution',
    unit: 'index',
    format: 'number',
    target: 0.35,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 10.2',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'kpi' }
  },

  // EMPLOYMENT
  {
    id: 'social_unemployment_rate',
    name: 'Unemployment Rate',
    nameFr: 'Taux de chômage',
    category: 'employment',
    calculation: '(Unemployed / Labor force) × 100',
    unit: '%',
    format: 'percentage',
    target: 8,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 8.5',
    frequency: 'quarterly',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'social_youth_unemployment',
    name: 'Youth Unemployment Rate',
    nameFr: 'Taux de chômage des jeunes',
    category: 'employment',
    calculation: '(Unemployed youth / Youth labor force) × 100',
    unit: '%',
    format: 'percentage',
    target: 15,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 8.5',
    frequency: 'quarterly',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'social_labor_force_participation',
    name: 'Labor Force Participation Rate',
    nameFr: 'Taux d\'activité',
    category: 'employment',
    calculation: '(Labor force / Working-age population) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    sdgAlignment: 'ODD 8.5',
    frequency: 'quarterly',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge' }
  },

  // TRANSFERS
  {
    id: 'social_cash_transfer_beneficiaries',
    name: 'Cash Transfer Beneficiaries',
    nameFr: 'Bénéficiaires de transferts monétaires',
    category: 'transfers',
    calculation: 'Count of cash transfer recipients',
    unit: 'persons',
    format: 'number',
    target: 500000,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: ['region', 'program'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'social_targeting_accuracy',
    name: 'Targeting Accuracy',
    nameFr: 'Précision du ciblage',
    category: 'transfers',
    calculation: '(Poor beneficiaries / Total beneficiaries) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: ['program'],
    visualization: { defaultType: 'gauge' }
  },

  // GENDER
  {
    id: 'social_gender_pay_gap',
    name: 'Gender Pay Gap',
    nameFr: 'Écart salarial entre sexes',
    category: 'gender',
    calculation: '(Male wage - Female wage) / Male wage × 100',
    unit: '%',
    format: 'percentage',
    target: 10,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 8.5',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'social_women_parliament',
    name: 'Women in Parliament',
    nameFr: 'Femmes au parlement',
    category: 'gender',
    calculation: '(Women MPs / Total MPs) × 100',
    unit: '%',
    format: 'percentage',
    target: 30,
    sdgAlignment: 'ODD 5.5',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },

  // SPENDING
  {
    id: 'social_spending_gdp',
    name: 'Social Protection Spending to GDP',
    nameFr: 'Dépenses sociales/PIB',
    category: 'spending',
    calculation: '(Social protection spending / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    sdgAlignment: 'ODD 1.3',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
];

export default socialKPIs;
