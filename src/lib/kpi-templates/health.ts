/**
 * InsightGov Africa - Health Sector KPI Templates
 * ================================================
 * Indicateurs de performance pour le secteur de la santé
 */

export interface KPITemplateDefinition {
  id: string;
  name: string;
  nameFr: string;
  description?: string;
  descriptionFr?: string;
  category: string;
  calculation: string;
  unit: string;
  format?: 'number' | 'percentage' | 'currency' | 'ratio';
  target?: number;
  sdgAlignment?: string;
  dataSource?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  lowerIsBetter?: boolean;
  dimensions?: string[];
  requiredColumns?: string[];
  visualization?: {
    defaultType: string;
    colors?: string[];
  };
}

export const healthKPIs: KPITemplateDefinition[] = [
  // VACCINATION
  {
    id: 'health_vaccination_dtp3',
    name: 'DTP3 Immunization Coverage',
    nameFr: 'Taux de vaccination DTC3',
    category: 'vaccination',
    calculation: '(Children receiving DTP3 / Target population) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 3.8',
    frequency: 'monthly',
    dimensions: ['region', 'district', 'age_group'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_vaccination_measles',
    name: 'Measles Immunization Coverage',
    nameFr: 'Taux de vaccination rougeole',
    category: 'vaccination',
    calculation: '(Children vaccinated against measles / Target population) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    sdgAlignment: 'ODD 3.8',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_vaccination_full',
    name: 'Full Immunization Coverage',
    nameFr: 'Couverture vaccinale complète',
    category: 'vaccination',
    calculation: '(Fully vaccinated children / Target population) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 3.8',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // MATERNAL HEALTH
  {
    id: 'health_maternal_anc4',
    name: 'ANC4+ Coverage',
    nameFr: 'Couverture CPN4+',
    category: 'maternal',
    calculation: '(Women with 4+ ANC visits / Expected pregnancies) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    sdgAlignment: 'ODD 3.1',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_maternal_sba',
    name: 'Skilled Birth Attendant Coverage',
    nameFr: 'Accouchement assisté par personnel qualifié',
    category: 'maternal',
    calculation: '(Births attended by SBA / Total births) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    sdgAlignment: 'ODD 3.1',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_maternal_facility',
    name: 'Institutional Delivery Rate',
    nameFr: 'Taux d\'accouchement institutionnel',
    category: 'maternal',
    calculation: '(Facility deliveries / Total deliveries) × 100',
    unit: '%',
    format: 'percentage',
    target: 85,
    sdgAlignment: 'ODD 3.1',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_maternal_mortality',
    name: 'Maternal Mortality Ratio',
    nameFr: 'Ratio de mortalité maternelle',
    category: 'maternal',
    calculation: '(Maternal deaths / Live births) × 100,000',
    unit: '/100,000',
    format: 'number',
    target: 140,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.1',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'trend', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },

  // CHILD HEALTH
  {
    id: 'health_child_mortality_under5',
    name: 'Under-5 Mortality Rate',
    nameFr: 'Taux de mortalité infanto-juvénile',
    category: 'child_health',
    calculation: '(Deaths under 5 / Live births) × 1,000',
    unit: '/1,000',
    format: 'number',
    target: 25,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.2',
    frequency: 'annual',
    dimensions: ['region', 'gender'],
    visualization: { defaultType: 'trend', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'health_child_mortality_infant',
    name: 'Infant Mortality Rate',
    nameFr: 'Taux de mortalité infantile',
    category: 'child_health',
    calculation: '(Deaths under 1 year / Live births) × 1,000',
    unit: '/1,000',
    format: 'number',
    target: 20,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.2',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'trend', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'health_child_stunting',
    name: 'Stunting Prevalence',
    nameFr: 'Prévalence du retard de croissance',
    category: 'child_health',
    calculation: '(Stunted children / Children under 5) × 100',
    unit: '%',
    format: 'percentage',
    target: 15,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 2.2',
    frequency: 'annual',
    dimensions: ['region', 'age_group'],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },

  // DISEASE CONTROL
  {
    id: 'health_malaria_incidence',
    name: 'Malaria Incidence Rate',
    nameFr: 'Taux d\'incidence du paludisme',
    category: 'disease_control',
    calculation: '(Malaria cases / Population) × 1,000',
    unit: '/1,000',
    format: 'number',
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.3',
    frequency: 'monthly',
    dimensions: ['region', 'district'],
    visualization: { defaultType: 'trend' }
  },
  {
    id: 'health_tb_incidence',
    name: 'TB Incidence Rate',
    nameFr: 'Taux d\'incidence tuberculose',
    category: 'disease_control',
    calculation: '(TB cases / Population) × 100,000',
    unit: '/100,000',
    format: 'number',
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.3',
    frequency: 'quarterly',
    dimensions: ['region'],
    visualization: { defaultType: 'trend' }
  },
  {
    id: 'health_hiv_prevalence',
    name: 'HIV Prevalence',
    nameFr: 'Prévalence VIH',
    category: 'disease_control',
    calculation: '(People living with HIV / Population) × 100',
    unit: '%',
    format: 'percentage',
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.3',
    frequency: 'annual',
    dimensions: ['region', 'age_group'],
    visualization: { defaultType: 'trend' }
  },
  {
    id: 'health_hiv_art_coverage',
    name: 'ART Coverage',
    nameFr: 'Couverture traitement ARV',
    category: 'disease_control',
    calculation: '(People on ART / People living with HIV) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    sdgAlignment: 'ODD 3.3',
    frequency: 'quarterly',
    dimensions: ['region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // HEALTH SYSTEM
  {
    id: 'health_facility_density',
    name: 'Health Facility Density',
    nameFr: 'Densité des formations sanitaires',
    category: 'health_system',
    calculation: '(Health facilities / Population) × 10,000',
    unit: '/10,000',
    format: 'number',
    target: 2,
    sdgAlignment: 'ODD 3.8',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'health_workforce_density',
    name: 'Health Workforce Density',
    nameFr: 'Densité du personnel de santé',
    category: 'health_system',
    calculation: '(Health workers / Population) × 10,000',
    unit: '/10,000',
    format: 'number',
    target: 23,
    sdgAlignment: 'ODD 3.8',
    frequency: 'annual',
    dimensions: ['region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'health_bed_occupancy',
    name: 'Bed Occupancy Rate',
    nameFr: 'Taux d\'occupation des lits',
    category: 'health_system',
    calculation: '(Patient days / (Beds × Days)) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'monthly',
    dimensions: ['facility'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'health_consultation_rate',
    name: 'Outpatient Consultation Rate',
    nameFr: 'Taux de consultation externe',
    category: 'health_system',
    calculation: 'Total consultations / Population',
    unit: '/person/year',
    format: 'number',
    target: 4,
    frequency: 'monthly',
    dimensions: ['region'],
    visualization: { defaultType: 'trend' }
  },

  // QUALITY
  {
    id: 'health_satisfaction_rate',
    name: 'Patient Satisfaction Rate',
    nameFr: 'Taux de satisfaction des patients',
    category: 'quality',
    calculation: '(Satisfied patients / Surveyed patients) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'quarterly',
    dimensions: ['facility'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'health_drug_availability',
    name: 'Essential Drug Availability',
    nameFr: 'Disponibilité médicaments essentiels',
    category: 'quality',
    calculation: '(Available essential drugs / Total essential drugs) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    frequency: 'monthly',
    dimensions: ['facility'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'health_equipment_functional',
    name: 'Functional Equipment Rate',
    nameFr: 'Taux d\'équipements fonctionnels',
    category: 'quality',
    calculation: '(Functional equipment / Total equipment) × 100',
    unit: '%',
    format: 'percentage',
    target: 85,
    frequency: 'quarterly',
    dimensions: ['facility'],
    visualization: { defaultType: 'gauge' }
  },

  // FINANCIAL
  {
    id: 'health_oope_share',
    name: 'Out-of-Pocket Expenditure Share',
    nameFr: 'Part des dépenses de santé à la charge des ménages',
    category: 'financial',
    calculation: '(OOP expenditure / Total health expenditure) × 100',
    unit: '%',
    format: 'percentage',
    target: 15,
    lowerIsBetter: true,
    sdgAlignment: 'ODD 3.8',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge', colors: ['#22c55e', '#f59e0b', '#ef4444'] }
  },
  {
    id: 'health_per_capita_spending',
    name: 'Per Capita Health Expenditure',
    nameFr: 'Dépenses de santé par habitant',
    category: 'financial',
    calculation: 'Total health expenditure / Population',
    unit: 'USD',
    format: 'currency',
    target: 86,
    sdgAlignment: 'ODD 3.8',
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'kpi' }
  },
];

export default healthKPIs;
