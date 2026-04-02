/**
 * InsightGov Africa - Education Sector KPI Templates
 * ===================================================
 * Indicateurs de performance pour le secteur éducatif
 */

import { KPITemplateDefinition } from './health';

export const educationKPIs: KPITemplateDefinition[] = [
  // ACCESS
  {
    id: 'education_net_enrollment_primary',
    name: 'Net Enrollment Rate - Primary',
    nameFr: 'Taux net de scolarisation - Primaire',
    category: 'access',
    calculation: '(Official age enrollment / Primary age population) × 100',
    unit: '%',
    format: 'percentage',
    target: 97,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'education_net_enrollment_secondary',
    name: 'Net Enrollment Rate - Secondary',
    nameFr: 'Taux net de scolarisation - Secondaire',
    category: 'access',
    calculation: '(Official age enrollment / Secondary age population) × 100',
    unit: '%',
    format: 'percentage',
    target: 75,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'education_out_of_school',
    name: 'Out-of-School Children Rate',
    nameFr: 'Taux d\'enfants non scolarisés',
    category: 'access',
    calculation: '(Out-of-school children / School-age population) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'education_adult_literacy',
    name: 'Adult Literacy Rate',
    nameFr: 'Taux d\'alphabétisation des adultes',
    category: 'access',
    calculation: '(Literate adults / Adult population) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    sdgAlignment: 'ODD 4.6',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'education_gpi_primary',
    name: 'Gender Parity Index - Primary',
    nameFr: 'Indice de parité entre sexes - Primaire',
    category: 'access',
    calculation: 'Female GER / Male GER',
    unit: 'ratio',
    format: 'ratio',
    target: 1,
    sdgAlignment: 'ODD 4.5',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },

  // COMPLETION
  {
    id: 'education_completion_primary',
    name: 'Primary Completion Rate',
    nameFr: 'Taux d\'achèvement primaire',
    category: 'completion',
    calculation: '(Primary completers / Primary age cohort) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'education_dropout_primary',
    name: 'Dropout Rate - Primary',
    nameFr: 'Taux d\'abandon - Primaire',
    category: 'completion',
    calculation: '(Dropouts / Total enrollment) × 100',
    unit: '%',
    format: 'percentage',
    target: 5,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'education_transition_rate',
    name: 'Transition Rate to Secondary',
    nameFr: 'Taux de transition vers le secondaire',
    category: 'completion',
    calculation: '(New secondary entrants / Primary graduates) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'gauge' }
  },

  // QUALITY
  {
    id: 'education_learning_poverty',
    name: 'Learning Poverty Rate',
    nameFr: 'Taux de pauvreté d\'apprentissage',
    category: 'quality',
    calculation: '(Children below minimum proficiency / Total children) × 100',
    unit: '%',
    format: 'percentage',
    target: 30,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'education_exam_pass_rate',
    name: 'Examination Pass Rate',
    nameFr: 'Taux de réussite aux examens',
    category: 'quality',
    calculation: '(Students passing / Students examined) × 100',
    unit: '%',
    format: 'percentage',
    target: 75,
    frequency: 'annual',
    dimensions: ['region', 'exam_type'],
    visualization: { defaultType: 'gauge' }
  },

  // RESOURCES
  {
    id: 'education_pupil_teacher_primary',
    name: 'Pupil-Teacher Ratio - Primary',
    nameFr: 'Ratio élèves/enseignant - Primaire',
    category: 'resources',
    calculation: 'Total primary pupils / Total primary teachers',
    unit: ':1',
    format: 'ratio',
    target: 40,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 4.c',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'education_qualified_teachers',
    name: 'Qualified Teachers Rate - Primary',
    nameFr: 'Taux d\'enseignants qualifiés - Primaire',
    category: 'resources',
    calculation: '(Qualified teachers / Total teachers) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 4.c',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'education_schools_electricity',
    name: 'Schools with Electricity',
    nameFr: 'Écoles avec électricité',
    category: 'resources',
    calculation: '(Schools with electricity / Total schools) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 4.a',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'education_schools_water',
    name: 'Schools with Drinking Water',
    nameFr: 'Écoles avec eau potable',
    category: 'resources',
    calculation: '(Schools with water / Total schools) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 4.a',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'education_schools_internet',
    name: 'Schools with Internet',
    nameFr: 'Écoles avec connexion Internet',
    category: 'resources',
    calculation: '(Schools with internet / Total schools) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    sdgAlignment: 'ODD 4.a',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge' }
  },

  // FINANCING
  {
    id: 'education_gdp_share',
    name: 'Education Expenditure as % of GDP',
    nameFr: 'Dépenses d\'éducation en % du PIB',
    category: 'financing',
    calculation: '(Education expenditure / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 6,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'education_budget_share',
    name: 'Education Share of Government Budget',
    nameFr: 'Part de l\'éducation dans le budget',
    category: 'financing',
    calculation: '(Education expenditure / Total budget) × 100',
    unit: '%',
    format: 'percentage',
    target: 20,
    sdgAlignment: 'ODD 4.1',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
];

export default educationKPIs;
