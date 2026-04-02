/**
 * InsightGov Africa - Organizations API Route
 * ============================================
 * Gestion des organisations (Ministères, ONG, Entreprises).
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import type { OrganizationType, Sector } from '@/types';

// ============================================
// GET /api/organizations
// Liste les organisations (filtré par utilisateur)
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const sector = searchParams.get('sector');

    // Si un ID spécifique est demandé
    if (id) {
      // Validation UUID
      const uuidError = validateUUID(id);
      if (uuidError) return uuidError;

      const org = await db.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
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

      // Vérifier que l'utilisateur appartient à cette organisation
      // (sauf owners/admins qui peuvent voir toutes les organisations)
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        if (auth.organizationId !== id) {
          return NextResponse.json(
            { success: false, error: 'Accès refusé.' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        organization: org,
      });
    }

    // Lister les organisations
    // Les utilisateurs normaux ne voient que leur propre organisation
    // Les owners/admins peuvent voir toutes les organisations
    let whereClause: Record<string, unknown> = { isActive: true };

    if (auth.role !== 'owner' && auth.role !== 'admin') {
      // Utilisateur normal : seulement son organisation
      if (!auth.organizationId) {
        return NextResponse.json({
          success: true,
          count: 0,
          organizations: [],
        });
      }
      whereClause.id = auth.organizationId;
    } else {
      // Owners/admins : filtrage optionnel
      if (type) whereClause.type = type;
      if (sector) whereClause.sector = sector;
    }

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
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des organisations' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/organizations
// Crée une nouvelle organisation (inscription)
// ============================================

export async function POST(request: NextRequest) {
  // Pas d'authentification requise pour créer une organisation (inscription)
  // Mais l'utilisateur doit créer un compte

  try {
    const body = await request.json();
    const { name, type, sector, country, city, userEmail, userFirstName, userLastName } = body;

    // Validations
    if (!name || !type || !sector || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'name, type, sector et userEmail sont requis' },
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

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' },
        { status: 400 }
      );
    }

    // Créer l'organisation et l'utilisateur en une transaction
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

      // Créer l'utilisateur owner
      const user = await tx.user.create({
        data: {
          email: userEmail,
          firstName: userFirstName || 'Admin',
          lastName: userLastName || 'User',
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
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création organisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'organisation' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/organizations
// Met à jour une organisation
// ============================================

export async function PATCH(request: NextRequest) {
  // Vérification d'authentification (admin requis pour modifier)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que l'utilisateur appartient à cette organisation
    // (sauf owners qui peuvent modifier toutes les organisations)
    if (auth.role !== 'owner') {
      if (auth.organizationId !== id) {
        return NextResponse.json(
          { success: false, error: 'Accès refusé.' },
          { status: 403 }
        );
      }
    }

    // Filtrer les champs autorisés
    const allowedFields = ['name', 'type', 'sector', 'country', 'city', 'phone', 'website', 'logoUrl'];
    const filteredData: Record<string, unknown> = {};
    
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    const organization = await db.organization.update({
      where: { id },
      data: filteredData,
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: id,
        action: 'settings_change',
        entityType: 'organization',
        entityId: id,
        metadata: JSON.stringify({ updatedFields: Object.keys(filteredData) }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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

// ============================================
// DELETE /api/organizations
// Supprime (désactive) une organisation
// ============================================

export async function DELETE(request: NextRequest) {
  // Seul un owner peut supprimer une organisation
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Validation UUID
    const uuidError = validateUUID(id);
    if (uuidError) return uuidError;

    // Vérifier que l'utilisateur est owner de cette organisation
    if (auth.role !== 'owner' || auth.organizationId !== id) {
      return NextResponse.json(
        { success: false, error: 'Seul le propriétaire peut supprimer l\'organisation.' },
        { status: 403 }
      );
    }

    // Désactiver l'organisation (soft delete)
    const organization = await db.organization.update({
      where: { id },
      data: { isActive: false },
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: id,
        action: 'delete',
        entityType: 'organization',
        entityId: id,
        metadata: JSON.stringify({ orgName: organization.name }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

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
