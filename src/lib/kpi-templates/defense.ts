/**
 * InsightGov Africa - Defense & Military KPI Templates
 * ======================================================
 * Indicateurs de performance pour le secteur de la défense
 */

import { KPITemplateDefinition } from './health';

export const defenseKPIs: KPITemplateDefinition[] = [
  // READINESS
  {
    id: 'defense_personnel_readiness',
    name: 'Personnel Readiness Rate',
    nameFr: 'Taux de préparation du personnel',
    category: 'readiness',
    calculation: '(Ready personnel / Total personnel) × 100',
    unit: '%',
    format: 'percentage',
    target: 85,
    frequency: 'monthly',
    dimensions: ['unit', 'branch', 'rank'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_equipment_readiness',
    name: 'Equipment Readiness Rate',
    nameFr: 'Taux de disponibilité des équipements',
    category: 'readiness',
    calculation: '(Operational equipment / Total equipment) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'monthly',
    dimensions: ['equipment_type', 'unit'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_force_strength',
    name: 'Force Strength',
    nameFr: 'Effectif des forces',
    category: 'readiness',
    calculation: 'Total active military personnel',
    unit: 'personnel',
    format: 'number',
    target: 50000,
    frequency: 'annual',
    dimensions: ['branch', 'rank', 'specialty'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_deployment_capacity',
    name: 'Deployment Capacity',
    nameFr: 'Capacité de déploiement',
    category: 'readiness',
    calculation: 'Personnel deployable within 48 hours',
    unit: 'personnel',
    format: 'number',
    target: 10000,
    frequency: 'quarterly',
    dimensions: ['branch', 'type'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_response_time',
    name: 'Response Time',
    nameFr: 'Temps de réponse',
    category: 'readiness',
    calculation: 'Average time to deploy rapid response force',
    unit: 'hours',
    format: 'number',
    target: 4,
    lowerIsBetter: true,
    frequency: 'quarterly',
    dimensions: ['alert_level', 'location'],
    visualization: { defaultType: 'kpi' }
  },

  // TRAINING
  {
    id: 'defense_training_completion',
    name: 'Training Completion Rate',
    nameFr: 'Taux d\'achèvement formation',
    category: 'training',
    calculation: '(Training completed / Training planned) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    frequency: 'annual',
    dimensions: ['training_type', 'branch', 'unit'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_training_hours',
    name: 'Training Hours per Capita',
    nameFr: 'Heures de formation par personne',
    category: 'training',
    calculation: 'Total training hours / Total personnel',
    unit: 'hours/person',
    format: 'number',
    target: 200,
    frequency: 'annual',
    dimensions: ['branch', 'rank'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_exercises_conducted',
    name: 'Exercises Conducted',
    nameFr: 'Exercices menés',
    category: 'training',
    calculation: 'Total exercises conducted',
    unit: 'exercises',
    format: 'number',
    target: 50,
    frequency: 'annual',
    dimensions: ['exercise_type', 'branch'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_certification_rate',
    name: 'Certification Rate',
    nameFr: 'Taux de certification',
    category: 'training',
    calculation: '(Certified personnel / Personnel required) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    frequency: 'annual',
    dimensions: ['specialty', 'certification_type'],
    visualization: { defaultType: 'gauge' }
  },

  // LOGISTICS
  {
    id: 'defense_fleet_readiness',
    name: 'Fleet Readiness Rate',
    nameFr: 'Disponibilité flotte',
    category: 'logistics',
    calculation: '(Operational vehicles / Total vehicles) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'monthly',
    dimensions: ['vehicle_type', 'unit'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_aircraft_availability',
    name: 'Aircraft Availability',
    nameFr: 'Disponibilité aéronefs',
    category: 'logistics',
    calculation: '(Mission-capable aircraft / Total aircraft) × 100',
    unit: '%',
    format: 'percentage',
    target: 75,
    frequency: 'monthly',
    dimensions: ['aircraft_type', 'base'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_naval_readiness',
    name: 'Naval Vessel Readiness',
    nameFr: 'Disponibilité navires',
    category: 'logistics',
    calculation: '(Operational vessels / Total vessels) × 100',
    unit: '%',
    format: 'percentage',
    target: 70,
    frequency: 'monthly',
    dimensions: ['vessel_type', 'base'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_ammo_stockpile',
    name: 'Ammunition Stockpile Level',
    nameFr: 'Niveau stock munitions',
    category: 'logistics',
    calculation: '(Current stock / Required stock) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    frequency: 'quarterly',
    dimensions: ['ammo_type', 'location'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_fuel_reserves',
    name: 'Fuel Reserve Days',
    nameFr: 'Jours de réserve carburant',
    category: 'logistics',
    calculation: 'Days of fuel at current consumption rate',
    unit: 'days',
    format: 'number',
    target: 90,
    frequency: 'monthly',
    dimensions: ['fuel_type', 'location'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_supply_chain_speed',
    name: 'Supply Delivery Time',
    nameFr: 'Délai livraison approvisionnement',
    category: 'logistics',
    calculation: 'Average days from request to delivery',
    unit: 'days',
    format: 'number',
    target: 7,
    lowerIsBetter: true,
    frequency: 'monthly',
    dimensions: ['supply_type', 'location'],
    visualization: { defaultType: 'kpi' }
  },

  // OPERATIONS
  {
    id: 'defense_mission_success',
    name: 'Mission Success Rate',
    nameFr: 'Taux de succès des missions',
    category: 'operations',
    calculation: '(Successful missions / Total missions) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    frequency: 'annual',
    dimensions: ['mission_type', 'region'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_patrols_conducted',
    name: 'Patrols Conducted',
    nameFr: 'Patrouilles effectuées',
    category: 'operations',
    calculation: 'Total patrols completed',
    unit: 'patrols',
    format: 'number',
    target: 1000,
    frequency: 'monthly',
    dimensions: ['patrol_type', 'region'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_border_coverage',
    name: 'Border Coverage Rate',
    nameFr: 'Couverture frontalière',
    category: 'operations',
    calculation: '(Monitored border length / Total border) × 100',
    unit: '%',
    format: 'percentage',
    target: 90,
    frequency: 'annual',
    dimensions: ['border_region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_peacekeeping',
    name: 'Peacekeeping Contribution',
    nameFr: 'Contribution maintien paix',
    category: 'operations',
    calculation: 'Personnel deployed in peacekeeping missions',
    unit: 'personnel',
    format: 'number',
    target: 3000,
    sdgAlignment: 'ODD 16.1',
    frequency: 'annual',
    dimensions: ['mission'],
    visualization: { defaultType: 'kpi' }
  },

  // SAFETY
  {
    id: 'defense_accident_rate',
    name: 'Military Accident Rate',
    nameFr: 'Taux d\'accidents militaires',
    category: 'safety',
    calculation: '(Accidents × 1,000) / Personnel',
    unit: '/1,000',
    format: 'number',
    target: 5,
    lowerIsBetter: true,
    frequency: 'annual',
    dimensions: ['accident_type', 'unit'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_casualties',
    name: 'Operational Casualties',
    nameFr: 'Pertes opérationnelles',
    category: 'safety',
    calculation: 'Total casualties in operations',
    unit: 'casualties',
    format: 'number',
    target: 0,
    lowerIsBetter: true,
    frequency: 'annual',
    dimensions: ['operation', 'cause'],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_friendly_fire',
    name: 'Friendly Fire Incidents',
    nameFr: 'Incidents tirs amis',
    category: 'safety',
    calculation: 'Total friendly fire incidents',
    unit: 'incidents',
    format: 'number',
    target: 0,
    lowerIsBetter: true,
    frequency: 'annual',
    dimensions: ['operation'],
    visualization: { defaultType: 'kpi' }
  },

  // PERSONNEL
  {
    id: 'defense_retention_rate',
    name: 'Personnel Retention Rate',
    nameFr: 'Taux de rétention',
    category: 'personnel',
    calculation: '(Personnel retained / Total personnel) × 100',
    unit: '%',
    format: 'percentage',
    target: 85,
    frequency: 'annual',
    dimensions: ['rank', 'branch', 'years_service'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_recruitment_target',
    name: 'Recruitment Target Achievement',
    nameFr: 'Atteinte objectifs recrutement',
    category: 'personnel',
    calculation: '(Recruited / Target) × 100',
    unit: '%',
    format: 'percentage',
    target: 100,
    frequency: 'annual',
    dimensions: ['branch', 'specialty'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },
  {
    id: 'defense_women_share',
    name: 'Female Personnel Share',
    nameFr: 'Part des femmes',
    category: 'personnel',
    calculation: '(Female personnel / Total personnel) × 100',
    unit: '%',
    format: 'percentage',
    target: 15,
    sdgAlignment: 'ODD 5.1',
    frequency: 'annual',
    dimensions: ['branch', 'rank'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_morale_index',
    name: 'Morale Index',
    nameFr: 'Indice de moral',
    category: 'personnel',
    calculation: 'Composite score from surveys',
    unit: 'index',
    format: 'number',
    target: 75,
    frequency: 'quarterly',
    dimensions: ['branch', 'rank'],
    visualization: { defaultType: 'gauge', colors: ['#ef4444', '#f59e0b', '#22c55e'] }
  },

  // BUDGET
  {
    id: 'defense_budget_execution',
    name: 'Budget Execution Rate',
    nameFr: 'Taux d\'exécution budgétaire',
    category: 'budget',
    calculation: '(Expenditure / Budget) × 100',
    unit: '%',
    format: 'percentage',
    target: 95,
    frequency: 'annual',
    dimensions: ['category', 'branch'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_gdp_share',
    name: 'Defense Spending as % GDP',
    nameFr: 'Dépenses défense en % PIB',
    category: 'budget',
    calculation: '(Defense budget / GDP) × 100',
    unit: '%',
    format: 'percentage',
    target: 2,
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_per_capita',
    name: 'Defense Spending per Capita',
    nameFr: 'Dépenses défense par habitant',
    category: 'budget',
    calculation: 'Defense budget / Population',
    unit: 'USD',
    format: 'currency',
    target: 50,
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'kpi' }
  },
  {
    id: 'defense_personnel_cost',
    name: 'Personnel Cost Share',
    nameFr: 'Part des coûts personnels',
    category: 'budget',
    calculation: '(Personnel costs / Total budget) × 100',
    unit: '%',
    format: 'percentage',
    target: 40,
    frequency: 'annual',
    dimensions: [],
    visualization: { defaultType: 'gauge' }
  },

  // INFRASTRUCTURE
  {
    id: 'defense_base_utilization',
    name: 'Base Utilization Rate',
    nameFr: 'Taux d\'utilisation des bases',
    category: 'infrastructure',
    calculation: '(Used capacity / Total capacity) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'annual',
    dimensions: ['base_type', 'region'],
    visualization: { defaultType: 'gauge' }
  },
  {
    id: 'defense_facility_condition',
    name: 'Facility Condition Index',
    nameFr: 'Indice état installations',
    category: 'infrastructure',
    calculation: '(Facilities in good condition / Total facilities) × 100',
    unit: '%',
    format: 'percentage',
    target: 80,
    frequency: 'annual',
    dimensions: ['facility_type'],
    visualization: { defaultType: 'gauge' }
  },
];

export default defenseKPIs;
