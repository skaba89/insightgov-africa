/**
 * InsightGov Africa - Production Seed Script
 * ============================================
 * Initialise la base de données avec les données minimales requises.
 * Exécuter avec: bun run prisma/seed-production.ts
 * 
 * Ce script crée uniquement les données essentielles:
 * - Compte admin par défaut
 * - Organisation de demo (optionnel)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Début du seeding production...\n');
  
  // Vérifier si un admin existe déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'owner' },
  });
  
  if (existingAdmin) {
    console.log('✅ Un utilisateur admin existe déjà, pas de seeding nécessaire.');
    return;
  }

  // Hasher le mot de passe
  const PASSWORD_HASH = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    10
  );

  // Créer l'organisation par défaut
  const org = await prisma.organization.create({
    data: {
      id: 'org_default',
      name: process.env.ORG_NAME || 'InsightGov Demo',
      type: 'enterprise',
      sector: 'other',
      subscriptionTier: 'enterprise',
      country: 'Sénégal',
      city: 'Dakar',
    },
  });
  
  console.log(`✅ Organisation créée: ${org.name}`);

  // Créer l'admin par défaut
  const admin = await prisma.user.create({
    data: {
      id: 'user_admin',
      email: process.env.ADMIN_EMAIL || 'admin@insightgov.africa',
      firstName: 'Admin',
      lastName: 'InsightGov',
      password: PASSWORD_HASH,
      organizationId: org.id,
      role: 'owner',
      emailVerified: new Date(),
    },
  });
  
  console.log(`✅ Admin créé: ${admin.email}`);

  // Créer l'abonnement par défaut
  await prisma.subscription.create({
    data: {
      id: 'sub_default',
      organizationId: org.id,
      tier: 'enterprise',
      status: 'active',
      price: 0,
      currency: 'EUR',
      billingCycle: 'monthly',
    },
  });
  
  console.log('✅ Abonnement créé\n');

  console.log('═'.repeat(50));
  console.log('🎉 Seeding production terminé!');
  console.log('═'.repeat(50));
  console.log('\n🔑 Compte admin:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Mot de passe: ${process.env.ADMIN_PASSWORD || 'ChangeMe123!'}`);
  console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!');
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
