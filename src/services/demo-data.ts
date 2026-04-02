// ============================================
// InsightGov Africa - Générateur de Données Démo
// Jeux de données réalistes pour démonstration
// ============================================

import { OrganizationType } from '@/types';

// ============================================
// TYPES
// ============================================

export interface DemoDatasetConfig {
  organizationType: OrganizationType;
  sector: string;
  subSector?: string;
  rowCount: number;
  language: 'fr' | 'en';
}

// ============================================
// DONNÉES DE RÉFÉRENCE AFRIQUE
// ============================================

const AFRICAN_COUNTRIES = [
  { name: 'Cameroun', code: 'CM' },
  { name: 'Sénégal', code: 'SN' },
  { name: 'Côte d\'Ivoire', code: 'CI' },
  { name: 'Ghana', code: 'GH' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Mali', code: 'ML' },
  { name: 'Burkina Faso', code: 'BF' },
  { name: 'Bénin', code: 'BJ' },
  { name: 'Togo', code: 'TG' },
];

const REGIONS_CAMEROUN = [
  'Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest',
  'Nord', 'Extrême-Nord', 'Adamaoua', 'Est', 'Sud'
];

const HEALTH_FACILITIES = [
  'Hôpital Central de Yaoundé',
  'Hôpital Général de Douala',
  'Centre Hospitalier Universitaire',
  'Hôpital Régional de Garoua',
  'Centre de Santé de Bafoussam',
  'Clinique de l\'Espoir',
  'Hôpital de District de Bamenda',
  'Centre Médical de Maroua',
];

const PROJECT_NAMES = {
  health: [
    'Programme de Vaccination Élargi',
    'Plan de Lutte contre le Paludisme',
    'Initiative Santé Maternelle',
    'Programme VIH/SIDA',
    'Campagne de Sensibilisation',
    'Projet Amélioration Infrastructure',
    'Programme Nutrition Infantile',
    'Plan d\'Urgence Sanitaire',
  ],
  education: [
    'Programme Alphabétisation Adulte',
    'Projet École pour Tous',
    'Initiative Formation Enseignants',
    'Programme Bourses Étudiantes',
    'Projet Infrastructure Scolaire',
    'Programme Numérique Éducatif',
    'Plan Formation Professionnelle',
    'Initiative Éducation Filles',
  ],
  agriculture: [
    'Programme Sécurité Alimentaire',
    'Projet Développement Rural',
    'Initiative Agropastoral',
    'Programne Mécanisation Agricole',
    'Projet Irrigation',
    'Programme Filières Agricoles',
    'Plan Développement Pêche',
    'Initiative Semences Améliorées',
  ],
  finance: [
    'Programme Microfinance',
    'Projet Inclusion Financière',
    'Initiative Crédit Agricole',
    'Programme PME/PMI',
    'Projet Digitalisation Bancaire',
    'Programme Assurance Santé',
    'Plan Financement Entreprises',
    'Initiative Mobile Banking',
  ],
};

// ============================================
// GÉNÉRATEURS
// ============================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// DATASET: SANTÉ
// ============================================

export function generateHealthDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');

  for (let i = 0; i < config.rowCount; i++) {
    const date = randomDate(startDate, endDate);
    const facility = randomElement(HEALTH_FACILITIES);
    const region = randomElement(REGIONS_CAMEROUN);
    const patients = randomNumber(50, 500);
    const consultations = randomNumber(patients, patients * 2);
    const vaccinations = randomNumber(20, patients);
    const malariaCases = randomNumber(5, Math.floor(patients * 0.3));
    const maternalCases = randomNumber(5, 30);
    const hivTests = randomNumber(10, 100);
    const hivPositive = randomNumber(1, Math.floor(hivTests * 0.1));
    const budget = randomNumber(500000, 5000000) * 100; // FCFA
    const expenses = randomNumber(Math.floor(budget * 0.6), budget);

    data.push({
      date: formatDate(date),
      mois: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      region: region,
      etablissement: facility,
      patients_consultes: patients,
      nombre_consultations: consultations,
      vaccinations_realisees: vaccinations,
      cas_paludisme: malariaCases,
      cas_maternels: maternalCases,
      tests_vihs: hivTests,
      cas_vihs_positifs: hivPositive,
      budget_alloue_fcfa: budget,
      depenses_fcfa: expenses,
      taux_occupation: randomFloat(45, 95, 1),
      stock_medicaments: randomNumber(100, 1000),
      personnel_present: randomNumber(20, 100),
      deaths: randomNumber(0, Math.floor(patients * 0.02)),
    });
  }

  return data.sort((a, b) => 
    new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );
}

// ============================================
// DATASET: ÉDUCATION
// ============================================

export function generateEducationDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-09-01');
  const endDate = new Date('2024-06-30');
  
  const schools = [
    'Lycée Général Leclerc', 'Lycée de New Bell', 'Collège Bilingue de Yaoundé',
    'École Primaire de Nkongsamba', 'Lycée Technique de Douala',
    'Collège Saint Michel', 'École Normale Supérieure', 'Université de Yaoundé I',
  ];
  
  const levels = ['Primaire', 'Secondaire', 'Supérieur'];
  const programs = PROJECT_NAMES.education;

  for (let i = 0; i < config.rowCount; i++) {
    const date = randomDate(startDate, endDate);
    const region = randomElement(REGIONS_CAMEROUN);
    const students = randomNumber(100, 2000);
    const teachers = randomNumber(10, 100);
    const ratio = parseFloat((students / teachers).toFixed(1));
    const budget = randomNumber(2000000, 20000000) * 100;

    data.push({
      date: formatDate(date),
      annee_scolaire: '2023-2024',
      region: region,
      etablissement: randomElement(schools),
      niveau: randomElement(levels),
      programme: randomElement(programs),
      eleves_inscrits: students,
      eleves_presents: randomNumber(Math.floor(students * 0.85), students),
      enseignants: teachers,
      ratio_eleve_enseignant: ratio,
      salles_classe: randomNumber(10, 50),
      manuels_distribues: randomNumber(100, 2000),
      budget_alloue_fcfa: budget,
      depenses_fcfa: randomNumber(Math.floor(budget * 0.7), budget),
      taux_reussite: randomFloat(55, 95, 1),
      abandons: randomNumber(0, Math.floor(students * 0.1)),
      filles_inscrites: randomNumber(Math.floor(students * 0.4), Math.floor(students * 0.6)),
      garcons_inscrits: 0, // Will be calculated
    });
  }

  // Calculate boys
  data.forEach(row => {
    row.garcons_inscrits = (row.eleves_inscrits as number) - (row.filles_inscrites as number);
  });

  return data.sort((a, b) => 
    new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );
}

// ============================================
// DATASET: AGRICULTURE
// ============================================

export function generateAgricultureDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  const crops = ['Maïs', 'Manioc', 'Mil', 'Sorgho', 'Riz', 'Cacao', 'Café', 'Coton'];
  const projects = PROJECT_NAMES.agriculture;

  for (let i = 0; i < config.rowCount; i++) {
    const date = randomDate(startDate, endDate);
    const region = randomElement(REGIONS_CAMEROUN);
    const area = randomNumber(10, 5000); // hectares
    const yieldPerHa = randomFloat(1, 5, 2); // tonnes/ha
    const production = area * yieldPerHa;
    const revenue = production * randomNumber(200, 800); // FCFA/kg * 1000

    data.push({
      date: formatDate(date),
      saison: date.getMonth() >= 3 && date.getMonth() <= 10 ? 'Pluies' : 'Sèche',
      region: region,
      culture: randomElement(crops),
      projet: randomElement(projects),
      superficie_ha: area,
      rendement_tha: yieldPerHa,
      production_tonnes: Math.round(production),
      agriculteurs_impliques: randomNumber(10, 500),
      revenus_fcfa: revenue,
      intrants_distribues: randomNumber(100, 5000),
      formations_realisees: randomNumber(1, 20),
      equipements_distribues: randomNumber(0, 50),
      budget_projet_fcfa: randomNumber(1000000, 50000000),
      pertes_post_recolte_pct: randomFloat(5, 25, 1),
      certificats_sanitaires: randomNumber(10, 200),
    });
  }

  return data.sort((a, b) => 
    new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );
}

// ============================================
// DATASET: FINANCE
// ============================================

export function generateFinanceDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  const branches = ['Yaoundé Centre', 'Douala Port', 'Bafoussam', 'Garoua', 'Bamenda'];
  const products = ['Crédit Agricole', 'Microcrédit', 'Épargne', 'Assurance', 'Mobile Money'];
  const segments = ['Particuliers', 'PME', 'Entreprises', 'Agriculteurs', 'Femmes'];
  const projects = PROJECT_NAMES.finance;

  for (let i = 0; i < config.rowCount; i++) {
    const date = randomDate(startDate, endDate);
    const loansDisbursed = randomNumber(10, 200) * 1000000; // FCFA
    const repayments = randomNumber(Math.floor(loansDisbursed * 0.5), loansDisbursed);
    const defaults = randomNumber(0, Math.floor(loansDisbursed * 0.1));
    const deposits = randomNumber(50, 500) * 1000000;

    data.push({
      date: formatDate(date),
      mois: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      agence: randomElement(branches),
      produit: randomElement(products),
      segment: randomElement(segments),
      projet: randomElement(projects),
      credits_debourses_fcfa: loansDisbursed,
      remboursements_fcfa: repayments,
      impayes_fcfa: defaults,
      depot_total_fcfa: deposits,
      retraits_fcfa: randomNumber(Math.floor(deposits * 0.3), Math.floor(deposits * 0.7)),
      nouveaux_clients: randomNumber(10, 200),
      clients_actifs: randomNumber(500, 5000),
      comptes_mobile_money: randomNumber(100, 3000),
      transactions_mobile: randomNumber(1000, 50000),
      taux_recouvrement_pct: randomFloat(75, 99, 1),
      taux_impayes_pct: randomFloat(1, 15, 1),
      employees: randomNumber(5, 50),
    });
  }

  return data.sort((a, b) => 
    new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

export function generateDemoDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  switch (config.sector) {
    case 'health':
      return generateHealthDataset(config);
    case 'education':
      return generateEducationDataset(config);
    case 'agriculture':
      return generateAgricultureDataset(config);
    case 'finance':
      return generateFinanceDataset(config);
    default:
      // Dataset générique
      return generateGenericDataset(config);
  }
}

// ============================================
// DATASET GÉNÉRIQUE
// ============================================

function generateGenericDataset(config: DemoDatasetConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');

  for (let i = 0; i < config.rowCount; i++) {
    const date = randomDate(startDate, endDate);
    
    data.push({
      id: i + 1,
      date: formatDate(date),
      categorie: `Catégorie ${randomNumber(1, 5)}`,
      region: randomElement(REGIONS_CAMEROUN),
      valeur_1: randomNumber(100, 10000),
      valeur_2: randomNumber(50, 5000),
      montant_fcfa: randomNumber(100000, 10000000),
      pourcentage: randomFloat(0, 100, 1),
      statut: randomElement(['Actif', 'En cours', 'Terminé', 'Suspendu']),
      nombre: randomNumber(1, 100),
      description: `Élément ${i + 1} du dataset`,
    });
  }

  return data.sort((a, b) => 
    new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
  );
}

// ============================================
// EXPORT CSV
// ============================================

export function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default {
  generateDemoDataset,
  generateHealthDataset,
  generateEducationDataset,
  generateAgricultureDataset,
  generateFinanceDataset,
  convertToCSV,
};
