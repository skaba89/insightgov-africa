/**
 * InsightGov Africa - Organizations API Route
 * ============================================
 * Gestion des organisations (Ministères, ONG, Entreprises).
 * Gracefully handles database unavailability.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { OrganizationType, Sector } from '@/types';

// Demo organization for when database is not available
const DEMO_ORG = {
  id: 'demo-org',
  name: 'Demo Organization',
  type: 'ministry',
  sector: 'health',
  subscriptionTier: 'professional',
  country: 'Sénégal',
  city: 'Dakar',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@insightgov.africa',
};

/**
 * GET /api/organizations
 * Liste les organisations
 */
export async function GET(request: NextRequest) {
  // If no database, return demo data
  if (!db) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id === 'demo-org') {
      return NextResponse.json({
        success: true,
        organization: DEMO_ORG,
      });
    }
    
    return NextResponse.json({
      success: true,
      count: 1,
      organizations: [DEMO_ORG],
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const sector = searchParams.get('sector');

    if (id) {
      const org = await db.organization.findUnique({
        where: { id },
        include: {
          users: true,
          datasets: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          subscriptions: true,
        },
      });

      if (!org) {
        return NextResponse.json(
          { success: false, error: 'Organisation non trouvée' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        organization: org,
      });
    }

    const whereClause: Record<string, unknown> = { isActive: true };
    if (type) whereClause.type = type;
    if (sector) whereClause.sector = sector;

    const organizations = await db.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, datasets: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    console.error('Erreur récupération organisations:', error);
    // Return demo data on error
    return NextResponse.json({
      success: true,
      count: 1,
      organizations: [DEMO_ORG],
    });
  }
}

/**
 * POST /api/organizations
 * Crée une nouvelle organisation avec un utilisateur temporaire
 */
export async function POST(request: NextRequest) {
  // If no database, return demo data
  if (!db) {
    return NextResponse.json({
      success: true,
      organization: DEMO_ORG,
      user: DEMO_USER,
    });
  }

  try {
    const body = await request.json();
    const { name, type, sector, country, city } = body;

    // Validations
    if (!name || !type || !sector) {
      return NextResponse.json(
        { success: false, error: 'name, type et sector sont requis' },
        { status: 400 }
      );
    }

    const validTypes = ['ministry', 'ngo', 'enterprise'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Type invalide. Valeurs autorisées: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validSectors = [
      'health', 'education', 'agriculture', 'finance', 'infrastructure',
      'energy', 'social', 'environment', 'trade', 'mining', 'transport', 'telecom', 'other'
    ];
    if (!validSectors.includes(sector)) {
      return NextResponse.json(
        { success: false, error: `Secteur invalide` },
        { status: 400 }
      );
    }

    // Créer l'organisation et un utilisateur temporaire en une transaction
    const result = await db.$transaction(async (tx) => {
      // Créer l'organisation
      const organization = await tx.organization.create({
        data: {
          name,
          type: type as OrganizationType,
          sector: sector as Sector,
          subscriptionTier: 'free',
          country: country || null,
          city: city || null,
        },
      });

      // Créer un utilisateur temporaire pour la démo
      const tempEmail = `guest_${Date.now()}@insightgov.africa`;
      const user = await tx.user.create({
        data: {
          email: tempEmail,
          firstName: 'Demo',
          lastName: 'User',
          organizationId: organization.id,
          role: 'owner',
          emailVerified: new Date(),
        },
      });

      // Créer un abonnement par défaut
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          tier: 'free',
          status: 'active',
          price: 0,
          currency: 'EUR',
          billingCycle: 'monthly',
        },
      });

      return { organization, user };
    });

    return NextResponse.json({
      success: true,
      organization: result.organization,
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    });
  } catch (error) {
    console.error('Erreur création organisation:', error);
    // Return demo data on error
    return NextResponse.json({
      success: true,
      organization: DEMO_ORG,
      user: DEMO_USER,
    });
  }
}

/**
 * PATCH /api/organizations
 * Met à jour une organisation
 */
export async function PATCH(request: NextRequest) {
  if (!db) {
    return NextResponse.json({
      success: true,
      organization: DEMO_ORG,
    });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const organization = await db.organization.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('Erreur mise à jour organisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations
 * Supprime (désactive) une organisation
 */
export async function DELETE(request: NextRequest) {
  if (!db) {
    return NextResponse.json({
      success: true,
      message: 'Organisation désactivée (demo)',
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const organization = await db.organization.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Organisation désactivée',
      organization,
    });
  } catch (error) {
    console.error('Erreur suppression organisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
