/**
 * InsightGov Africa - Template Seed Script
 * =========================================
 * Script pour peupler la base de données avec les templates de KPI et Dashboard
 * 
 * Usage: npx tsx prisma/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import all KPI templates
import { healthKPIs } from '../src/lib/kpi-templates/health';
import { educationKPIs } from '../src/lib/kpi-templates/education';
import { agricultureKPIs } from '../src/lib/kpi-templates/agriculture';
import { financeKPIs } from '../src/lib/kpi-templates/finance';
import { infrastructureKPIs } from '../src/lib/kpi-templates/infrastructure';
import { socialKPIs } from '../src/lib/kpi-templates/social';
import { logisticsKPIs } from '../src/lib/kpi-templates/logistics';
import { transportKPIs } from '../src/lib/kpi-templates/transport';
import { miningKPIs } from '../src/lib/kpi-templates/mining';
import { defenseKPIs } from '../src/lib/kpi-templates/defense';
import { policeKPIs } from '../src/lib/kpi-templates/police';
import { retailKPIs } from '../src/lib/kpi-templates/retail';
import { tourismKPIs } from '../src/lib/kpi-templates/tourism';
import { energyKPIs } from '../src/lib/kpi-templates/energy';
import { bankingKPIs } from '../src/lib/kpi-templates/banking';
import { manufacturingKPIs } from '../src/lib/kpi-templates/manufacturing';
import { constructionKPIs } from '../src/lib/kpi-templates/construction';
import { telecomKPIs } from '../src/lib/kpi-templates/telecom';
import { justiceKPIs } from '../src/lib/kpi-templates/justice';
import { environmentKPIs } from '../src/lib/kpi-templates/environment';
import { hrKPIs } from '../src/lib/kpi-templates/hr';
import { fisheriesKPIs } from '../src/lib/kpi-templates/fisheries';

// Import dashboard templates
import { dashboardTemplates } from '../src/lib/kpi-templates/dashboard-templates';

// Combine all KPIs
const allKPIs = [
  ...healthKPIs,
  ...educationKPIs,
  ...agricultureKPIs,
  ...financeKPIs,
  ...infrastructureKPIs,
  ...socialKPIs,
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

async function seedKPITemplates() {
  console.log('Seeding KPI templates...');

  // Clear existing templates
  await prisma.kPITemplate.deleteMany({});
  console.log('Cleared existing KPI templates');

  // Insert KPI templates
  const kpiTemplatesData = allKPIs.map(kpi => ({
    sector: kpi.id.split('_')[0],
    category: kpi.category,
    code: kpi.id,
    name: kpi.name,
    nameFr: kpi.nameFr,
    description: kpi.description || kpi.descriptionFr || null,
    formula: kpi.calculation,
    unit: kpi.unit,
    format: kpi.format || 'number',
    decimals: 0,
    target: kpi.target || null,
    targetSource: kpi.sdgAlignment || null,
    lowerIsBetter: kpi.lowerIsBetter || false,
    sdgAlignment: kpi.sdgAlignment || null,
    dataSource: kpi.dataSource || null,
    frequency: kpi.frequency || 'monthly',
    disaggregation: JSON.stringify(kpi.dimensions || []),
    alertThresholds: JSON.stringify({}),
    visualizationType: kpi.visualization?.defaultType || null,
    visualizationColors: kpi.visualization?.colors 
      ? JSON.stringify(kpi.visualization.colors) 
      : null,
    requiredColumns: kpi.requiredColumns 
      ? JSON.stringify(kpi.requiredColumns) 
      : null,
    dimensions: kpi.dimensions 
      ? JSON.stringify(kpi.dimensions) 
      : null,
    isActive: true,
  }));

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < kpiTemplatesData.length; i += batchSize) {
    const batch = kpiTemplatesData.slice(i, i + batchSize);
    await prisma.kPITemplate.createMany({ data: batch });
    console.log(`Inserted KPI templates ${i + 1} to ${Math.min(i + batchSize, kpiTemplatesData.length)}`);
  }

  console.log(`Seeded ${kpiTemplatesData.length} KPI templates`);
  return kpiTemplatesData.length;
}

async function seedDashboardTemplates() {
  console.log('Seeding dashboard templates...');

  // Clear existing templates and widget templates
  await prisma.widgetTemplate.deleteMany({});
  await prisma.dashboardTemplate.deleteMany({});
  console.log('Cleared existing dashboard templates');

  // Insert dashboard templates
  let totalWidgets = 0;

  for (const template of dashboardTemplates) {
    // Create dashboard template
    const dashboardTemplate = await prisma.dashboardTemplate.create({
      data: {
        sector: template.sector,
        category: template.category || null,
        code: template.id,
        name: template.name,
        nameFr: template.nameFr,
        description: template.description || template.descriptionFr || null,
        widgets: JSON.stringify(template.widgets),
        filters: JSON.stringify(template.filters || []),
        alerts: JSON.stringify(template.alerts || []),
        icon: template.icon || null,
        tags: JSON.stringify(template.tags || []),
        recommendedFor: JSON.stringify([]),
        isActive: true,
      },
    });

    // Create widget templates
    const widgetTemplatesData = template.widgets.map((widget: any, index: number) => ({
      dashboardTemplateId: dashboardTemplate.id,
      x: widget.position?.x ?? (index % 3) * 4,
      y: widget.position?.y ?? Math.floor(index / 3) * 4,
      width: widget.position?.w ?? 4,
      height: widget.position?.h ?? 3,
      type: widget.type,
      title: widget.titleFr || widget.title,
      titleFr: widget.titleFr || widget.title,
      kpiTemplateCode: widget.kpiId || null,
      config: JSON.stringify(widget.config || {}),
      displayOrder: index,
    }));

    if (widgetTemplatesData.length > 0) {
      await prisma.widgetTemplate.createMany({ data: widgetTemplatesData });
      totalWidgets += widgetTemplatesData.length;
    }

    console.log(`Created dashboard template: ${template.nameFr}`);
  }

  console.log(`Seeded ${dashboardTemplates.length} dashboard templates with ${totalWidgets} widgets`);
  return { dashboardCount: dashboardTemplates.length, widgetCount: totalWidgets };
}

async function main() {
  console.log('Starting template seed...');
  console.log('========================\n');

  try {
    const kpiCount = await seedKPITemplates();
    console.log('');
    
    const { dashboardCount, widgetCount } = await seedDashboardTemplates();
    console.log('');

    console.log('========================');
    console.log('Seed completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - KPI Templates: ${kpiCount}`);
    console.log(`  - Dashboard Templates: ${dashboardCount}`);
    console.log(`  - Widget Templates: ${widgetCount}`);
    console.log('');

    // Print breakdown by sector
    const sectorCounts: Record<string, number> = {};
    allKPIs.forEach(kpi => {
      const sector = kpi.id.split('_')[0];
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    console.log('KPI Templates by Sector:');
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      console.log(`  - ${sector}: ${count} KPIs`);
    });

  } catch (error) {
    console.error('Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
