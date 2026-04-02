/**
 * InsightGov Africa - Business by ID API
 * =======================================
 * API endpoints pour un business spécifique.
 * GET: Détails d'un business
 * PUT: Mettre à jour un business
 * DELETE: Supprimer un business
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const updateBusinessSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(['shop', 'restaurant', 'service', 'wholesale', 'manufacturer']).optional(),
  phone: z.string().min(8).max(20).optional(),
  phone2: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  
  // Localisation
  region: z.string().optional().nullable(),
  prefecture: z.string().optional().nullable(),
  subPrefecture: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  gpsLat: z.number().optional().nullable(),
  gpsLng: z.number().optional().nullable(),
  
  // Business info
  nif: z.string().max(50).optional().nullable(),
  rccm: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  
  // Configuration
  currency: z.string().optional(),
  acceptMobileMoney: z.boolean().optional(),
  acceptCash: z.boolean().optional(),
  acceptCard: z.boolean().optional(),
  isOpen24h: z.boolean().optional(),
  openingHours: z.record(z.string(), z.any()).optional().nullable(),
  
  // Statut
  isActive: z.boolean().optional(),
});

// =============================================================================
// Helper: Vérifier l'accès au business
// =============================================================================

async function checkBusinessAccess(
  businessId: string,
  userId: string,
  requireOwner: boolean = false
): Promise<{ success: true; business: any } | NextResponse> {
  if (!isValidUUID(businessId)) {
    return NextResponse.json(
      { success: false, error: 'ID invalide' },
      { status: 400 }
    );
  }
  
  const business = await db?.business.findUnique({
    where: { id: businessId },
    include: {
      products: { take: 5, orderBy: { createdAt: 'desc' } },
      orders: { take: 5, orderBy: { createdAt: 'desc' } },
      customers: { take: 5, orderBy: { createdAt: 'desc' } },
      _count: {
        select: { products: true, orders: true, customers: true },
      },
    },
  });
  
  if (!business) {
    return NextResponse.json(
      { success: false, error: 'Business non trouvé' },
      { status: 404 }
    );
  }
  
  // Vérifier que l'utilisateur est le propriétaire
  if (business.ownerId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé. Vous n\'êtes pas le propriétaire de ce business.' },
      { status: 403 }
    );
  }
  
  return { success: true, business };
}

// =============================================================================
// GET /api/business/[id] - Détails d'un business
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    const accessResult = await checkBusinessAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    return NextResponse.json({
      success: true,
      data: accessResult.business,
    });
  } catch (error) {
    console.error('[API] Error fetching business:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du business' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/business/[id] - Mettre à jour un business
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    const accessResult = await checkBusinessAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = updateBusinessSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.phone2 !== undefined) updateData.phone2 = data.phone2;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.prefecture !== undefined) updateData.prefecture = data.prefecture;
    if (data.subPrefecture !== undefined) updateData.subPrefecture = data.subPrefecture;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.gpsLat !== undefined) updateData.gpsLat = data.gpsLat;
    if (data.gpsLng !== undefined) updateData.gpsLng = data.gpsLng;
    if (data.nif !== undefined) updateData.nif = data.nif;
    if (data.rccm !== undefined) updateData.rccm = data.rccm;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.acceptMobileMoney !== undefined) updateData.acceptMobileMoney = data.acceptMobileMoney;
    if (data.acceptCash !== undefined) updateData.acceptCash = data.acceptCash;
    if (data.acceptCard !== undefined) updateData.acceptCard = data.acceptCard;
    if (data.isOpen24h !== undefined) updateData.isOpen24h = data.isOpen24h;
    if (data.openingHours !== undefined) updateData.openingHours = data.openingHours;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // Mettre à jour le business
    const updatedBusiness = await db!.business.update({
      where: { id },
      data: updateData,
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'update',
        entityType: 'business',
        entityId: id,
        metadata: JSON.stringify({ changes: Object.keys(updateData) }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      data: updatedBusiness,
    });
  } catch (error) {
    console.error('[API] Error updating business:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du business' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/business/[id] - Supprimer un business
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'delete');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    const accessResult = await checkBusinessAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    // Vérifier s'y a des commandes liées
    const ordersCount = await db!.order.count({
      where: { businessId: id },
    });
    
    if (ordersCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer ce business car il contient des commandes. Désactivez-le plutôt.',
          hasOrders: true,
          ordersCount,
        },
        { status: 400 }
      );
    }
    
    // Supprimer le business (cascade automatique pour products, customers)
    await db!.business.delete({
      where: { id },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'delete',
        entityType: 'business',
        entityId: id,
        metadata: JSON.stringify({ name: accessResult.business.name }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      message: 'Business supprimé avec succès',
    });
  } catch (error) {
    console.error('[API] Error deleting business:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du business' },
      { status: 500 }
    );
  }
}
