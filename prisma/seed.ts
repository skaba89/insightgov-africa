/**
 * InsightGov Africa - Database Seed Script
 * =========================================
 * Initialise la base de données avec des données de démonstration.
 * Exécuter avec: bun run prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mot de passe par défaut pour les utilisateurs de test
const DEFAULT_PASSWORD = 'password123';

async function main() {
  console.log('🌱 Début du seeding...\n');
  
  // Hasher le mot de passe une seule fois
  const PASSWORD_HASH = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ===========================================================================
  // ORGANISATIONS DE DÉMO
  // ===========================================================================
  
  console.log('📋 Création des organisations...');

  const organizations = await Promise.all([
    // Ministère de la Santé
    prisma.organization.upsert({
      where: { id: 'org_ministry_health' },
      update: {},
      create: {
        id: 'org_ministry_health',
        name: 'Ministère de la Santé et de l\'Action Sociale',
        type: 'ministry',
        sector: 'health',
        subscriptionTier: 'professional',
        country: 'Sénégal',
        city: 'Dakar',
      },
    }),
    // Ministère de l'Éducation
    prisma.organization.upsert({
      where: { id: 'org_ministry_education' },
      update: {},
      create: {
        id: 'org_ministry_education',
        name: 'Ministère de l\'Éducation Nationale',
        type: 'ministry',
        sector: 'education',
        subscriptionTier: 'professional',
        country: 'Sénégal',
        city: 'Dakar',
      },
    }),
    // ONG Agriculture
    prisma.organization.upsert({
      where: { id: 'org_ngo_agri' },
      update: {},
      create: {
        id: 'org_ngo_agri',
        name: 'FAO Sénégal',
        type: 'ngo',
        sector: 'agriculture',
        subscriptionTier: 'starter',
        country: 'Sénégal',
        city: 'Dakar',
      },
    }),
    // Banque
    prisma.organization.upsert({
      where: { id: 'org_enterprise_finance' },
      update: {},
      create: {
        id: 'org_enterprise_finance',
        name: 'Banque Centrale des États de l\'Afrique de l\'Ouest',
        type: 'enterprise',
        sector: 'finance',
        subscriptionTier: 'enterprise',
        country: 'Sénégal',
        city: 'Dakar',
      },
    }),
    // Ministère de l'Énergie
    prisma.organization.upsert({
      where: { id: 'org_ministry_energy' },
      update: {},
      create: {
        id: 'org_ministry_energy',
        name: 'Ministère du Pétrole et des Énergies',
        type: 'ministry',
        sector: 'energy',
        subscriptionTier: 'starter',
        country: 'Sénégal',
        city: 'Dakar',
      },
    }),
  ]);

  console.log(`✅ ${organizations.length} organisations créées\n`);

  // ===========================================================================
  // UTILISATEURS DE DÉMO
  // ===========================================================================

  console.log('👥 Création des utilisateurs...');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'user_health_admin' },
      update: {},
      create: {
        id: 'user_health_admin',
        email: 'admin@sante.gouv.sn',
        firstName: 'Amadou',
        lastName: 'Diallo',
        password: PASSWORD_HASH,
        organizationId: 'org_ministry_health',
        role: 'owner',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { id: 'user_health_analyst' },
      update: {},
      create: {
        id: 'user_health_analyst',
        email: 'analyst@sante.gouv.sn',
        firstName: 'Fatou',
        lastName: 'Ndiaye',
        password: PASSWORD_HASH,
        organizationId: 'org_ministry_health',
        role: 'analyst',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { id: 'user_education_admin' },
      update: {},
      create: {
        id: 'user_education_admin',
        email: 'admin@education.gouv.sn',
        firstName: 'Ibrahima',
        lastName: 'Fall',
        password: PASSWORD_HASH,
        organizationId: 'org_ministry_education',
        role: 'owner',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { id: 'user_fao_admin' },
      update: {},
      create: {
        id: 'user_fao_admin',
        email: 'contact@fao.sn',
        firstName: 'Marie',
        lastName: 'Sow',
        password: PASSWORD_HASH,
        organizationId: 'org_ngo_agri',
        role: 'admin',
        emailVerified: new Date(),
      },
    }),
  ]);

  console.log(`✅ ${users.length} utilisateurs créés\n`);

  // ===========================================================================
  // ABONNEMENTS
  // ===========================================================================

  console.log('💳 Création des abonnements...');

  const subscriptions = await Promise.all([
    prisma.subscription.upsert({
      where: { id: 'sub_health' },
      update: {},
      create: {
        id: 'sub_health',
        organizationId: 'org_ministry_health',
        tier: 'professional',
        status: 'active',
        price: 500,
        currency: 'EUR',
        billingCycle: 'monthly',
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub_education' },
      update: {},
      create: {
        id: 'sub_education',
        organizationId: 'org_ministry_education',
        tier: 'professional',
        status: 'active',
        price: 500,
        currency: 'EUR',
        billingCycle: 'monthly',
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub_fao' },
      update: {},
      create: {
        id: 'sub_fao',
        organizationId: 'org_ngo_agri',
        tier: 'starter',
        status: 'active',
        price: 99,
        currency: 'EUR',
        billingCycle: 'monthly',
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub_bceao' },
      update: {},
      create: {
        id: 'sub_bceao',
        organizationId: 'org_enterprise_finance',
        tier: 'enterprise',
        status: 'active',
        price: 1500,
        currency: 'EUR',
        billingCycle: 'yearly',
      },
    }),
  ]);

  console.log(`✅ ${subscriptions.length} abonnements créés\n`);

  // ===========================================================================
  // DATASETS DE DÉMO
  // ===========================================================================

  console.log('📊 Création des datasets de démo...');

  // Dataset Santé
  await prisma.dataset.upsert({
    where: { id: 'dataset_health_1' },
    update: {},
    create: {
      id: 'dataset_health_1',
      organizationId: 'org_ministry_health',
      userId: 'user_health_admin',
      name: 'Statistiques Vaccination 2024',
      originalFileName: 'vaccination_2024.csv',
      fileUrl: 'demo://vaccination_2024.csv',
      fileSize: 524288,
      fileType: 'csv',
      rowCount: 1500,
      columnCount: 8,
      columnsMetadata: JSON.stringify([
        { originalName: 'region', cleanName: 'region', dataType: 'geo', description: 'Région sanitaire', sampleValues: ['Dakar', 'Thiès', 'Saint-Louis'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'district', cleanName: 'district', dataType: 'category', description: 'District sanitaire', sampleValues: ['Dakar Nord', 'Dakar Sud'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'annee', cleanName: 'annee', dataType: 'numeric', description: 'Année', sampleValues: [2024, 2023], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'mois', cleanName: 'mois', dataType: 'category', description: 'Mois', sampleValues: ['Janvier', 'Février'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'vaccin', cleanName: 'vaccin', dataType: 'category', description: 'Type de vaccin', sampleValues: ['BCG', 'DTC', 'Rougeole'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'cibles', cleanName: 'cibles', dataType: 'numeric', description: 'Nombre de cibles', sampleValues: [5000, 3200], statistics: { min: 500, max: 15000, sum: 500000, count: 1500 }, qualityScore: 95, isSuggestedForVisualization: true },
        { originalName: 'vaccines', cleanName: 'vaccines', dataType: 'numeric', description: 'Nombre vaccinés', sampleValues: [4500, 2800], statistics: { min: 400, max: 12000, sum: 400000, count: 1500 }, qualityScore: 95, isSuggestedForVisualization: true },
        { originalName: 'taux_couverture', cleanName: 'taux_couverture', dataType: 'percentage', description: 'Taux de couverture', sampleValues: [85, 92], statistics: { min: 45, max: 98, mean: 78, count: 1500 }, qualityScore: 98, isSuggestedForVisualization: true },
      ]),
      status: 'ready',
      analyzedAt: new Date(),
    },
  });

  // Dataset Éducation
  await prisma.dataset.upsert({
    where: { id: 'dataset_education_1' },
    update: {},
    create: {
      id: 'dataset_education_1',
      organizationId: 'org_ministry_education',
      userId: 'user_education_admin',
      name: 'Effectifs Scolaires 2023-2024',
      originalFileName: 'effectifs_scolaires.xlsx',
      fileUrl: 'demo://effectifs_scolaires.xlsx',
      fileSize: 1048576,
      fileType: 'xlsx',
      rowCount: 2500,
      columnCount: 10,
      columnsMetadata: JSON.stringify([
        { originalName: 'region', cleanName: 'region', dataType: 'geo', description: 'Région', sampleValues: ['Dakar', 'Thiès', 'Kaolack'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'departement', cleanName: 'departement', dataType: 'category', description: 'Département', sampleValues: ['Dakar', 'Guédiawaye'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'niveau', cleanName: 'niveau', dataType: 'category', description: 'Niveau scolaire', sampleValues: ['Primaire', 'Moyen', 'Secondaire'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'etablissement', cleanName: 'etablissement', dataType: 'category', description: 'Type d\'établissement', sampleValues: ['Public', 'Privé'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'effectif_garcons', cleanName: 'effectif_garcons', dataType: 'numeric', description: 'Effectif garçons', sampleValues: [450, 320], statistics: { sum: 500000, count: 2500 }, qualityScore: 98, isSuggestedForVisualization: true },
        { originalName: 'effectif_filles', cleanName: 'effectif_filles', dataType: 'numeric', description: 'Effectif filles', sampleValues: [420, 350], statistics: { sum: 480000, count: 2500 }, qualityScore: 98, isSuggestedForVisualization: true },
        { originalName: 'nb_enseignants', cleanName: 'nb_enseignants', dataType: 'numeric', description: 'Nombre d\'enseignants', sampleValues: [25, 18], statistics: { sum: 25000, count: 2500 }, qualityScore: 95, isSuggestedForVisualization: true },
        { originalName: 'nb_classes', cleanName: 'nb_classes', dataType: 'numeric', description: 'Nombre de classes', sampleValues: [12, 8], statistics: { sum: 15000, count: 2500 }, qualityScore: 95, isSuggestedForVisualization: true },
        { originalName: 'taux_reussite', cleanName: 'taux_reussite', dataType: 'percentage', description: 'Taux de réussite', sampleValues: [75, 82], statistics: { mean: 68, count: 2500 }, qualityScore: 92, isSuggestedForVisualization: true },
        { originalName: 'annee_scolaire', cleanName: 'annee_scolaire', dataType: 'category', description: 'Année scolaire', sampleValues: ['2023-2024'], qualityScore: 100, isSuggestedForVisualization: true },
      ]),
      status: 'ready',
      analyzedAt: new Date(),
    },
  });

  // Dataset Agriculture
  await prisma.dataset.upsert({
    where: { id: 'dataset_agri_1' },
    update: {},
    create: {
      id: 'dataset_agri_1',
      organizationId: 'org_ngo_agri',
      userId: 'user_fao_admin',
      name: 'Production Agricole 2024',
      originalFileName: 'production_agricole.csv',
      fileUrl: 'demo://production_agricole.csv',
      fileSize: 786432,
      fileType: 'csv',
      rowCount: 800,
      columnCount: 7,
      columnsMetadata: JSON.stringify([
        { originalName: 'region', cleanName: 'region', dataType: 'geo', description: 'Région agricole', sampleValues: ['Thiès', 'Diourbel', 'Fatick'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'culture', cleanName: 'culture', dataType: 'category', description: 'Type de culture', sampleValues: ['Mil', 'Maïs', 'Riz', 'Arachide'], qualityScore: 100, isSuggestedForVisualization: true },
        { originalName: 'surface_ha', cleanName: 'surface_ha', dataType: 'numeric', description: 'Surface cultivée (ha)', sampleValues: [500, 1200], statistics: { sum: 2500000, count: 800 }, qualityScore: 96, isSuggestedForVisualization: true },
        { originalName: 'production_tonnes', cleanName: 'production_tonnes', dataType: 'numeric', description: 'Production (tonnes)', sampleValues: [800, 1500], statistics: { sum: 5000000, count: 800 }, qualityScore: 96, isSuggestedForVisualization: true },
        { originalName: 'rendement', cleanName: 'rendement', dataType: 'numeric', description: 'Rendement (t/ha)', sampleValues: [1.6, 2.1], statistics: { mean: 2.0, count: 800 }, qualityScore: 94, isSuggestedForVisualization: true },
        { originalName: 'exploitants', cleanName: 'exploitants', dataType: 'numeric', description: 'Nombre d\'exploitants', sampleValues: [150, 280], statistics: { sum: 120000, count: 800 }, qualityScore: 95, isSuggestedForVisualization: true },
        { originalName: 'saison', cleanName: 'saison', dataType: 'category', description: 'Saison', sampleValues: ['Hivernage', 'Contre-saison'], qualityScore: 100, isSuggestedForVisualization: true },
      ]),
      status: 'ready',
      analyzedAt: new Date(),
    },
  });

  console.log(`✅ 3 datasets de démo créés\n`);

  // ===========================================================================
  // CONFIGURATIONS KPI
  // ===========================================================================

  console.log('📈 Création des configurations KPI...');

  // Config Santé
  await prisma.kPIConfig.upsert({
    where: { id: 'kpi_health_1' },
    update: {},
    create: {
      id: 'kpi_health_1',
      datasetId: 'dataset_health_1',
      userId: 'user_health_admin',
      version: 1,
      isPublished: true,
      configJson: JSON.stringify({
        version: '1.0',
        title: 'Dashboard Vaccination Sénégal',
        description: 'Suivi des indicateurs de vaccination par région',
        executiveSummary: 'Ce dashboard présente les indicateurs clés de la campagne de vaccination 2024. Le taux de couverture moyen est de 78%, avec des disparités régionales importantes.',
        keyInsights: [
          'Région de Dakar: meilleur taux de couverture (92%)',
          'Le vaccin BCG atteint 95% des cibles',
          'La région de Kédougou nécessite un renforcement des efforts'
        ],
        recommendations: [
          'Renforcer les campagnes dans les régions à faible couverture',
          'Améliorer la chaîne de froid dans les zones rurales',
          'Former davantage d\'agents de santé communautaires'
        ],
        kpis: [
          { id: 'kpi_1', title: 'Taux de Couverture Global', chartType: 'gauge', columns: { y: 'taux_couverture' }, order: 1, size: { cols: 3, rows: 1 }, isKeyMetric: true },
          { id: 'kpi_2', title: 'Nombre Total Vaccinés', chartType: 'metric', columns: { y: 'vaccines' }, aggregation: 'sum', order: 2, size: { cols: 3, rows: 1 }, isKeyMetric: true },
          { id: 'kpi_3', title: 'Couverture par Région', chartType: 'bar', columns: { x: 'region', y: 'taux_couverture' }, order: 3, size: { cols: 6, rows: 2 }, isKeyMetric: false },
          { id: 'kpi_4', title: 'Répartition par Type de Vaccin', chartType: 'donut', columns: { x: 'vaccin', y: 'vaccines' }, aggregation: 'sum', order: 4, size: { cols: 4, rows: 2 }, isKeyMetric: false },
          { id: 'kpi_5', title: 'Cibles vs Vaccinés', chartType: 'bar', columns: { x: 'mois', y: 'vaccines' }, order: 5, size: { cols: 6, rows: 2 }, isKeyMetric: false },
        ],
        globalFilters: [
          { column: 'region', label: 'Région', type: 'select' },
          { column: 'vaccin', label: 'Type de Vaccin', type: 'select' },
        ],
      }),
    },
  });

  // Config Éducation
  await prisma.kPIConfig.upsert({
    where: { id: 'kpi_education_1' },
    update: {},
    create: {
      id: 'kpi_education_1',
      datasetId: 'dataset_education_1',
      userId: 'user_education_admin',
      version: 1,
      isPublished: true,
      configJson: JSON.stringify({
        version: '1.0',
        title: 'Dashboard Effectifs Scolaires',
        description: 'Analyse des effectifs et performances scolaires',
        executiveSummary: 'Le système éducatif sénégalais compte 980 000 élèves pour l\'année 2023-2024, avec un taux de féminisation de 49%.',
        keyInsights: [
          'La région de Dakar concentre 35% des effectifs',
          'Le privé représente 28% des établissements',
          'Le ratio élèves/enseignant est de 40 en moyenne'
        ],
        recommendations: [
          'Recruter davantage d\'enseignants dans les zones rurales',
          'Développer les infrastructures dans les régions enclavées',
          'Renforcer l\'éducation des filles'
        ],
        kpis: [
          { id: 'kpi_1', title: 'Effectif Total', chartType: 'metric', columns: { y: 'effectif_garcons' }, aggregation: 'sum', order: 1, size: { cols: 3, rows: 1 }, isKeyMetric: true },
          { id: 'kpi_2', title: 'Taux de Réussite Moyen', chartType: 'gauge', columns: { y: 'taux_reussite' }, order: 2, size: { cols: 3, rows: 1 }, isKeyMetric: true },
          { id: 'kpi_3', title: 'Effectifs par Niveau', chartType: 'bar', columns: { x: 'niveau', y: 'effectif_garcons' }, aggregation: 'sum', order: 3, size: { cols: 6, rows: 2 }, isKeyMetric: false },
          { id: 'kpi_4', title: 'Répartition Public/Privé', chartType: 'donut', columns: { x: 'etablissement', y: 'effectif_garcons' }, aggregation: 'sum', order: 4, size: { cols: 4, rows: 2 }, isKeyMetric: false },
        ],
        globalFilters: [
          { column: 'region', label: 'Région', type: 'select' },
          { column: 'niveau', label: 'Niveau', type: 'select' },
        ],
      }),
    },
  });

  console.log('✅ 2 configurations KPI créées\n');

  // ===========================================================================
  // RÉSUMÉ
  // ===========================================================================

  console.log('═'.repeat(50));
  console.log('🎉 Seeding terminé avec succès!');
  console.log('═'.repeat(50));
  console.log('\n📊 Résumé:');
  console.log(`   • ${organizations.length} organisations`);
  console.log(`   • ${users.length} utilisateurs`);
  console.log(`   • ${subscriptions.length} abonnements`);
  console.log('   • 3 datasets');
  console.log('   • 2 configurations KPI');
  console.log('\n🔑 Comptes de test (mot de passe: password123):');
  console.log('   • admin@sante.gouv.sn (Ministère de la Santé)');
  console.log('   • admin@education.gouv.sn (Ministère de l\'Éducation)');
  console.log('   • contact@fao.sn (FAO Sénégal)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
