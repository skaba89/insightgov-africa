/**
 * InsightGov Africa - KPI Templates Index
 * ========================================
 * Export centralisé de tous les templates KPI et Dashboard
 */

// KPI Templates by Sector
export { healthKPIs, default as healthKPITemplates } from './health';
export { educationKPIs, default as educationKPITemplates } from './education';
export { agricultureKPIs, default as agricultureKPITemplates } from './agriculture';
export { financeKPIs, default as financeKPITemplates } from './finance';
export { infrastructureKPIs, default as infrastructureKPITemplates } from './infrastructure';
export { socialKPIs, default as socialKPITemplates } from './social';

// Additional Sectors
export { logisticsKPIs, default as logisticsKPITemplates } from './logistics';
export { transportKPIs, default as transportKPITemplates } from './transport';
export { miningKPIs, default as miningKPITemplates } from './mining';
export { defenseKPIs, default as defenseKPITemplates } from './defense';
export { policeKPIs, default as policeKPITemplates } from './police';
export { retailKPIs, default as retailKPITemplates } from './retail';
export { tourismKPIs, default as tourismKPITemplates } from './tourism';
export { energyKPIs, default as energyKPITemplates } from './energy';
export { bankingKPIs, default as bankingKPITemplates } from './banking';
export { manufacturingKPIs, default as manufacturingKPITemplates } from './manufacturing';
export { constructionKPIs, default as constructionKPITemplates } from './construction';
export { telecomKPIs, default as telecomKPITemplates } from './telecom';
export { justiceKPIs, default as justiceKPITemplates } from './justice';
export { environmentKPIs, default as environmentKPITemplates } from './environment';
export { hrKPIs, default as hrKPITemplates } from './hr';
export { fisheriesKPIs, default as fisheriesKPITemplates } from './fisheries';

// Dashboard Templates
export { dashboardTemplates, default as dashboardTemplateConfigs } from './dashboard-templates';

// Types
export type { KPITemplateDefinition } from './health';
export type { DashboardTemplateDefinition, WidgetTemplateConfig } from './dashboard-templates';

// Aggregate all KPIs
import { healthKPIs } from './health';
import { educationKPIs } from './education';
import { agricultureKPIs } from './agriculture';
import { financeKPIs } from './finance';
import { infrastructureKPIs } from './infrastructure';
import { socialKPIs } from './social';
import { logisticsKPIs } from './logistics';
import { transportKPIs } from './transport';
import { miningKPIs } from './mining';
import { defenseKPIs } from './defense';
import { policeKPIs } from './police';
import { retailKPIs } from './retail';
import { tourismKPIs } from './tourism';
import { energyKPIs } from './energy';
import { bankingKPIs } from './banking';
import { manufacturingKPIs } from './manufacturing';
import { constructionKPIs } from './construction';
import { telecomKPIs } from './telecom';
import { justiceKPIs } from './justice';
import { environmentKPIs } from './environment';
import { hrKPIs } from './hr';
import { fisheriesKPIs } from './fisheries';
import { dashboardTemplates } from './dashboard-templates';

export const allKPITemplates = [
  // Original Sectors
  ...healthKPIs,
  ...educationKPIs,
  ...agricultureKPIs,
  ...financeKPIs,
  ...infrastructureKPIs,
  ...socialKPIs,
  // Additional Sectors
  ...logisticsKPIs,
  ...transportKPIs,
  ...miningKPIs,
  ...defenseKPIs,
  ...policeKPIs,
  ...retailKPIs,
  ...tourismKPIs,
  ...energyKPIs,
  ...bankingKPIs,
  ...manufacturingKPIs,
  ...constructionKPIs,
  ...telecomKPIs,
  ...justiceKPIs,
  ...environmentKPIs,
  ...hrKPIs,
  ...fisheriesKPIs,
];

// Helper functions
export function getKPIsBySector(sector: string) {
  const sectorMap: Record<string, any[]> = {
    health: healthKPIs,
    education: educationKPIs,
    agriculture: agricultureKPIs,
    finance: financeKPIs,
    infrastructure: infrastructureKPIs,
    social: socialKPIs,
    logistics: logisticsKPIs,
    transport: transportKPIs,
    mining: miningKPIs,
    defense: defenseKPIs,
    police: policeKPIs,
    retail: retailKPIs,
    tourism: tourismKPIs,
    energy: energyKPIs,
    banking: bankingKPIs,
    manufacturing: manufacturingKPIs,
    construction: constructionKPIs,
    telecom: telecomKPIs,
    justice: justiceKPIs,
    environment: environmentKPIs,
    hr: hrKPIs,
    fisheries: fisheriesKPIs,
  };
  return sectorMap[sector] || [];
}

export function getKPIsByCategory(sector: string, category: string) {
  const kpis = getKPIsBySector(sector);
  return kpis.filter(kpi => kpi.category === category);
}

export function getDashboardBySector(sector: string) {
  return dashboardTemplates.filter(d => d.sector === sector || d.sector === 'cross-sector');
}

export function getKPIById(id: string) {
  return allKPITemplates.find(kpi => kpi.id === id);
}

export function getDashboardById(id: string) {
  return dashboardTemplates.find(d => d.id === id);
}

// Statistics
export function getKPIStats() {
  return {
    total: allKPITemplates.length,
    bySector: {
      health: healthKPIs.length,
      education: educationKPIs.length,
      agriculture: agricultureKPIs.length,
      finance: financeKPIs.length,
      infrastructure: infrastructureKPIs.length,
      social: socialKPIs.length,
      logistics: logisticsKPIs.length,
      transport: transportKPIs.length,
      mining: miningKPIs.length,
      defense: defenseKPIs.length,
      police: policeKPIs.length,
      retail: retailKPIs.length,
      tourism: tourismKPIs.length,
      energy: energyKPIs.length,
      banking: bankingKPIs.length,
      manufacturing: manufacturingKPIs.length,
      construction: constructionKPIs.length,
      telecom: telecomKPIs.length,
      justice: justiceKPIs.length,
      environment: environmentKPIs.length,
      hr: hrKPIs.length,
      fisheries: fisheriesKPIs.length,
    },
    dashboards: dashboardTemplates.length,
    totalSectors: 22,
  };
}

// Sector list for UI
export const sectorList = [
  { id: 'health', name: 'Santé', nameEn: 'Health', icon: 'Activity' },
  { id: 'education', name: 'Éducation', nameEn: 'Education', icon: 'GraduationCap' },
  { id: 'agriculture', name: 'Agriculture', nameEn: 'Agriculture', icon: 'Wheat' },
  { id: 'finance', name: 'Finances Publiques', nameEn: 'Public Finance', icon: 'Landmark' },
  { id: 'infrastructure', name: 'Infrastructure', nameEn: 'Infrastructure', icon: 'Building' },
  { id: 'social', name: 'Protection Sociale', nameEn: 'Social Protection', icon: 'Users' },
  { id: 'logistics', name: 'Logistique', nameEn: 'Logistics', icon: 'Truck' },
  { id: 'transport', name: 'Transport & Mobilité', nameEn: 'Transport & Mobility', icon: 'Bus' },
  { id: 'mining', name: 'Mines & Extraction', nameEn: 'Mining & Extraction', icon: 'Mountain' },
  { id: 'defense', name: 'Défense', nameEn: 'Defense', icon: 'Shield' },
  { id: 'police', name: 'Sécurité Intérieure', nameEn: 'Internal Security', icon: 'Siren' },
  { id: 'retail', name: 'Commerce & Distribution', nameEn: 'Retail & Distribution', icon: 'ShoppingCart' },
  { id: 'tourism', name: 'Tourisme & Hôtellerie', nameEn: 'Tourism & Hospitality', icon: 'Palmtree' },
  { id: 'energy', name: 'Énergie', nameEn: 'Energy', icon: 'Zap' },
  { id: 'banking', name: 'Banque & Finance', nameEn: 'Banking & Finance', icon: 'Building2' },
  { id: 'manufacturing', name: 'Industrie Manufacturière', nameEn: 'Manufacturing', icon: 'Factory' },
  { id: 'construction', name: 'Construction & BTP', nameEn: 'Construction', icon: 'HardHat' },
  { id: 'telecom', name: 'Télécommunications', nameEn: 'Telecommunications', icon: 'Signal' },
  { id: 'justice', name: 'Justice', nameEn: 'Justice', icon: 'Scale' },
  { id: 'environment', name: 'Environnement', nameEn: 'Environment', icon: 'Leaf' },
  { id: 'hr', name: 'Ressources Humaines', nameEn: 'Human Resources', icon: 'UserCog' },
  { id: 'fisheries', name: 'Pêche & Aquaculture', nameEn: 'Fisheries & Aquaculture', icon: 'Fish' },
];
