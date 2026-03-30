/**
 * InsightGov Africa - Dashboard Templates
 * ========================================
 * Templates de dashboards prédéfinis par secteur
 */

export interface WidgetTemplateConfig {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'map' | 'gauge' | 'text';
  title: string;
  titleFr: string;
  kpiId?: string;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardTemplateDefinition {
  id: string;
  name: string;
  nameFr: string;
  description?: string;
  descriptionFr?: string;
  sector: string;
  category?: 'executive' | 'operational' | 'facility' | 'regional' | 'program';
  icon?: string;
  tags?: string[];
  widgets: WidgetTemplateConfig[];
  filters?: string[];
  alerts?: {
    kpiId: string;
    condition: string;
    threshold: number;
    severity: 'warning' | 'critical';
  }[];
}

export const dashboardTemplates: DashboardTemplateDefinition[] = [
  // HEALTH
  {
    id: 'health_executive_overview',
    name: 'Health Ministry Executive Dashboard',
    nameFr: 'Tableau de bord exécutif - Ministère de la Santé',
    sector: 'health',
    category: 'executive',
    icon: 'Activity',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_vaccination',
        type: 'gauge',
        title: 'Vaccination Coverage',
        titleFr: 'Couverture vaccinale',
        kpiId: 'health_vaccination_full',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_maternal',
        type: 'gauge',
        title: 'Skilled Birth Attendance',
        titleFr: 'Accouchement assisté',
        kpiId: 'health_maternal_sba',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_mortality',
        type: 'kpi',
        title: 'Under-5 Mortality',
        titleFr: 'Mortalité infanto-juvénile',
        kpiId: 'health_child_mortality_under5',
        config: { format: '/1,000', lowerIsBetter: true },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_facilities',
        type: 'kpi',
        title: 'Health Facility Density',
        titleFr: 'Densité des FS',
        kpiId: 'health_facility_density',
        config: { format: '/10,000' },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['region', 'period'],
    alerts: [
      { kpiId: 'health_drug_availability', condition: 'lt', threshold: 50, severity: 'critical' }
    ]
  },

  // EDUCATION
  {
    id: 'education_executive_overview',
    name: 'Education Ministry Executive Dashboard',
    nameFr: 'Tableau de bord exécutif - Ministère de l\'Éducation',
    sector: 'education',
    category: 'executive',
    icon: 'GraduationCap',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_enrollment_primary',
        type: 'gauge',
        title: 'Primary Enrollment',
        titleFr: 'Scolarisation primaire',
        kpiId: 'education_net_enrollment_primary',
        config: { thresholds: { warning: 80, critical: 60 }, unit: '%' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_enrollment_secondary',
        type: 'gauge',
        title: 'Secondary Enrollment',
        titleFr: 'Scolarisation secondaire',
        kpiId: 'education_net_enrollment_secondary',
        config: { thresholds: { warning: 60, critical: 40 }, unit: '%' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_completion_rate',
        type: 'gauge',
        title: 'Primary Completion',
        titleFr: 'Achèvement primaire',
        kpiId: 'education_completion_primary',
        config: { thresholds: { warning: 75, critical: 50 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_literacy',
        type: 'gauge',
        title: 'Adult Literacy',
        titleFr: 'Alphabétisation adultes',
        kpiId: 'education_adult_literacy',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['region', 'level', 'year'],
    alerts: []
  },

  // AGRICULTURE
  {
    id: 'agriculture_executive_overview',
    name: 'Agriculture Ministry Executive Dashboard',
    nameFr: 'Tableau de bord exécutif - Ministère de l\'Agriculture',
    sector: 'agriculture',
    category: 'executive',
    icon: 'Wheat',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_cereal_yield',
        type: 'kpi',
        title: 'Cereal Yield',
        titleFr: 'Rendement céréalier',
        kpiId: 'agriculture_cereal_yield',
        config: { format: 'kg/ha' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_food_security',
        type: 'gauge',
        title: 'Food Security',
        titleFr: 'Sécurité alimentaire',
        kpiId: 'agriculture_food_insecurity',
        config: { thresholds: { warning: 30, critical: 50 }, unit: '%', lowerIsBetter: true },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_irrigation',
        type: 'gauge',
        title: 'Irrigated Area',
        titleFr: 'Surface irriguée',
        kpiId: 'agriculture_irrigation_share',
        config: { thresholds: { warning: 10, critical: 5 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_production_index',
        type: 'kpi',
        title: 'Production Index',
        titleFr: 'Indice de production',
        kpiId: 'agriculture_production_index',
        config: { format: 'number', baseline: 100 },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['region', 'crop_type', 'season', 'year'],
    alerts: []
  },

  // FINANCE
  {
    id: 'finance_executive_overview',
    name: 'Finance Ministry Executive Dashboard',
    nameFr: 'Tableau de bord exécutif - Ministère des Finances',
    sector: 'finance',
    category: 'executive',
    icon: 'Landmark',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_tax_gdp',
        type: 'gauge',
        title: 'Tax Revenue/GDP',
        titleFr: 'Recettes fiscales/PIB',
        kpiId: 'finance_tax_revenue_gdp',
        config: { thresholds: { warning: 15, critical: 10 }, unit: '%' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_fiscal_balance',
        type: 'kpi',
        title: 'Fiscal Balance',
        titleFr: 'Solde budgétaire',
        kpiId: 'finance_fiscal_balance',
        config: { format: '%GDP' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_public_debt',
        type: 'gauge',
        title: 'Public Debt/GDP',
        titleFr: 'Dette publique/PIB',
        kpiId: 'finance_public_debt_gdp',
        config: { thresholds: { warning: 60, critical: 70 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_budget_execution',
        type: 'gauge',
        title: 'Budget Execution',
        titleFr: 'Exécution budgétaire',
        kpiId: 'finance_execution_rate',
        config: { thresholds: { warning: 80, critical: 60 }, unit: '%' },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['ministry', 'program', 'quarter', 'year'],
    alerts: [
      { kpiId: 'finance_public_debt_gdp', condition: 'gt', threshold: 70, severity: 'critical' }
    ]
  },

  // INFRASTRUCTURE
  {
    id: 'infrastructure_executive_overview',
    name: 'Infrastructure Executive Dashboard',
    nameFr: 'Tableau de bord Infrastructures',
    sector: 'infrastructure',
    category: 'executive',
    icon: 'Building',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_electrification',
        type: 'gauge',
        title: 'Electrification Rate',
        titleFr: 'Taux d\'électrification',
        kpiId: 'infrastructure_electrification_rate',
        config: { thresholds: { warning: 60, critical: 40 }, unit: '%' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_water_access',
        type: 'gauge',
        title: 'Water Access',
        titleFr: 'Accès à l\'eau',
        kpiId: 'infrastructure_water_access',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_road_condition',
        type: 'gauge',
        title: 'Roads in Good Condition',
        titleFr: 'Routes en bon état',
        kpiId: 'infrastructure_road_condition',
        config: { thresholds: { warning: 50, critical: 30 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_internet',
        type: 'gauge',
        title: 'Internet Penetration',
        titleFr: 'Pénétration Internet',
        kpiId: 'infrastructure_internet_penetration',
        config: { thresholds: { warning: 40, critical: 20 }, unit: '%' },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['region', 'infrastructure_type', 'urban_rural', 'year'],
    alerts: []
  },

  // SOCIAL
  {
    id: 'social_executive_overview',
    name: 'Social Protection Executive Dashboard',
    nameFr: 'Tableau de bord Protection Sociale',
    sector: 'social',
    category: 'executive',
    icon: 'Users',
    tags: ['executive', 'ministry'],
    widgets: [
      {
        id: 'widget_poverty_rate',
        type: 'gauge',
        title: 'Poverty Rate',
        titleFr: 'Taux de pauvreté',
        kpiId: 'social_poverty_rate',
        config: { thresholds: { warning: 30, critical: 50 }, unit: '%', lowerIsBetter: true },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_sp_coverage',
        type: 'gauge',
        title: 'SP Coverage',
        titleFr: 'Couverture PS',
        kpiId: 'social_protection_coverage',
        config: { thresholds: { warning: 30, critical: 15 }, unit: '%' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_unemployment',
        type: 'gauge',
        title: 'Unemployment Rate',
        titleFr: 'Taux de chômage',
        kpiId: 'social_unemployment_rate',
        config: { thresholds: { warning: 10, critical: 15 }, unit: '%', lowerIsBetter: true },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_gini',
        type: 'kpi',
        title: 'Gini Coefficient',
        titleFr: 'Coefficient de Gini',
        kpiId: 'social_gini_coefficient',
        config: { format: 'decimal', lowerIsBetter: true },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['region', 'program', 'population_group', 'year'],
    alerts: []
  },

  // LOGISTICS
  {
    id: 'logistics_executive_overview',
    name: 'Logistics Executive Dashboard',
    nameFr: 'Tableau de bord Logistique',
    sector: 'logistics',
    category: 'executive',
    icon: 'Truck',
    tags: ['executive', 'operations'],
    widgets: [
      {
        id: 'widget_inventory_accuracy',
        type: 'gauge',
        title: 'Inventory Accuracy',
        titleFr: 'Précision des stocks',
        kpiId: 'logistics_inventory_accuracy',
        config: { thresholds: { warning: 95, critical: 90 }, unit: '%' },
        position: { x: 0, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_on_time_delivery',
        type: 'gauge',
        title: 'On-Time Delivery',
        titleFr: 'Livraison à temps',
        kpiId: 'logistics_on_time_delivery',
        config: { thresholds: { warning: 90, critical: 80 }, unit: '%' },
        position: { x: 3, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_perfect_order',
        type: 'gauge',
        title: 'Perfect Order Rate',
        titleFr: 'Commandes parfaites',
        kpiId: 'logistics_perfect_order',
        config: { thresholds: { warning: 90, critical: 80 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 3 }
      },
      {
        id: 'widget_fleet_utilization',
        type: 'gauge',
        title: 'Fleet Utilization',
        titleFr: 'Utilisation flotte',
        kpiId: 'logistics_fleet_utilization',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 9, y: 0, w: 3, h: 3 }
      }
    ],
    filters: ['warehouse', 'carrier', 'region'],
    alerts: []
  },

  // REGIONAL (Cross-sector)
  {
    id: 'regional_overview',
    name: 'Regional Governor Dashboard',
    nameFr: 'Tableau de bord Gouverneur de Région',
    sector: 'cross-sector',
    category: 'regional',
    icon: 'Map',
    tags: ['regional', 'cross-sector', 'governance'],
    widgets: [
      {
        id: 'widget_regional_poverty',
        type: 'gauge',
        title: 'Poverty Rate',
        titleFr: 'Pauvreté',
        kpiId: 'social_poverty_rate',
        config: { thresholds: { warning: 30, critical: 50 }, unit: '%', lowerIsBetter: true },
        position: { x: 0, y: 0, w: 3, h: 2 }
      },
      {
        id: 'widget_regional_schools',
        type: 'kpi',
        title: 'School Enrollment',
        titleFr: 'Scolarisation',
        kpiId: 'education_net_enrollment_primary',
        config: { format: '%' },
        position: { x: 3, y: 0, w: 3, h: 2 }
      },
      {
        id: 'widget_regional_health',
        type: 'gauge',
        title: 'Vaccination',
        titleFr: 'Vaccination',
        kpiId: 'health_vaccination_full_coverage',
        config: { thresholds: { warning: 70, critical: 50 }, unit: '%' },
        position: { x: 6, y: 0, w: 3, h: 2 }
      },
      {
        id: 'widget_regional_electricity',
        type: 'gauge',
        title: 'Electrification',
        titleFr: 'Électrification',
        kpiId: 'infrastructure_electrification_rate',
        config: { thresholds: { warning: 60, critical: 40 }, unit: '%' },
        position: { x: 9, y: 0, w: 3, h: 2 }
      }
    ],
    filters: ['district', 'sector', 'year'],
    alerts: []
  }
];

export default dashboardTemplates;
