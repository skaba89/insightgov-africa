/**
 * InsightGov Africa - Finance Sector KPI Templates (Public)
 * ==========================================================
 * Indicateurs de performance pour les finances publiques
 */

import { KPITemplateDefinition } from './health';

export const financeKPIs: KPITemplateDefinition[] = [
  // REVENUE
  {
    id: 'finance_tax_revenue_gdp',
    name: 'Tax Revenue to GDP Ratio',
    nameFr: 'Rapport recettes fiscales/PIB',
    category: 'revenue',
    calculation: '(Tax revenue / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    sdgAlignment: 'ODD 17.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'finance_tax_compliance',
    name: 'Tax Compliance Rate',
    nameFr: 'Taux de conformité fiscale',
    category: 'revenue',
    calculation: '(Compliant taxpayers / Total taxpayers) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    sdgAlignment: 'ODD 17.1',
    frequency: 'annual',
    dimensions: ['tax_type'],
    visualization: { defaultType: 'gauge' }
  },

  // EXPENDITURE
  {
    id: 'finance_expenditure_gdp',
    name: 'Government Expenditure to GDP',
    nameFr: 'Dépenses publiques/PIB',
    category: 'expenditure',
    calculation: '(Total expenditure / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 25,
    sdgAlignment: 'ODD 17.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'finance_capital_expenditure',
    name: 'Capital Expenditure Share',
    nameFr: 'Part des dépenses d\'investissement',
    category: 'expenditure',
    calculation: '(Capital expenditure / Total expenditure) × 100',
    unit: '%',
    format: 'percentage',
    target: 30,
    sdgAlignment: 'ODD 17.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'finance_execution_rate',
    name: 'Budget Execution Rate',
    nameFr: 'Taux d\'exécution budgétaire',
    category: 'expenditure',
    calculation: '(Actual expenditure / Budgeted expenditure) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    sdgAlignment: 'ODD 17.1',
    frequency: 'quarterly',
    dimensions: ['ministry'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // FISCAL BALANCE
  {
    id: 'finance_fiscal_balance',
    name: 'Fiscal Balance',
    nameFr: 'Solde budgétaire',
    category: 'fiscal',
    calculation: '(Revenue - Expenditure) / GDP × 100',
    unit: '%',
    format: 'percentage',
    target: -3,
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'finance_public_debt_gdp',
    name: 'Public Debt to GDP',
    nameFr: 'Dette publique/PIB',
    category: 'fiscal',
    calculation: '(Public debt / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    sdgAlignment: 'ODD 17.4',
    frequency: 'quarterly',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'finance_debt_service',
    name: 'Debt Service to Revenue',
    nameFr: 'Service de la dette/recettes',
    category: 'fiscal',
    calculation: '(Debt service / Revenue) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 17.4',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },

  // BUDGET MANAGEMENT
  {
    id: 'finance_budget_variance',
    name: 'Budget Variance',
    nameFr: 'Écart budgétaire',
    category: 'budget',
    calculation: '|Budgeted - Actual| / Budgeted × 100',
    unit: '%',
    format: 'percentage',
    target: 10,
    lowerIsBetter: true,
    frequency: 'quarterly',
    dimensions: ['ministry'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'finance_budget_credibility',
    name: 'Budget Credibility Score',
    nameFr: 'Score de crédibilité budgétaire',
    category: 'budget',
    calculation: 'Weighted average of execution and variance metrics',
    unit: 'score',
    format: 'number',
    target: 85,
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // PFM
  {
    id: 'finance_procurement_efficiency',
    name: 'Procurement Processing Time',
    nameFr: 'Délai de passation des marchés',
    category: 'pfm',
    calculation: 'Average days from request to contract award',
    unit: 'days',
    format: 'number',
    target: 60,
    lowerIsBetter: true,
    frequency: 'quarterly',
    dimensions: [],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'finance_payment_delays',
    name: 'Payment Delay',
    nameFr: 'Délai de paiement',
    category: 'pfm',
    calculation: 'Average days from invoice to payment',
    unit: 'days',
    format: 'number',
    target: 30,
    lowerIsBetter: true,
    frequency: 'monthly',
    dimensions: [],
    visualization: { defaultType: 'kpi' }
  },

  // TRANSPARENCY
  {
    id: 'finance_budget_transparency',
    name: 'Budget Transparency Score',
    nameFr: 'Score de transparence budgétaire',
    category: 'transparency',
    calculation: 'Composite score based on budget disclosure',
    unit: 'score',
    format: 'number',
    target: 65,
    sdgAlignment: 'ODD 16.6',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
];

export default financeKPIs;
