/**
 * InsightGov Africa - Customers API
 * ===================================
 * API endpoints pour la gestion des clients.
 * GET: Lister les clients
 * POST: Créer un client
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const createCustomerSchema = z.object({
  businessId: z.string(),
  phone: z.string().min(8, 'Numéro de téléphone invalide').max(20),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  name: z.string().max(100).optional(),
  
  // Adresse
  address: z.string().max(500).optional(),
  region: z.string().max(100).optional(),
  prefecture: z.string().max(100).optional(),
  
  // Segmentation
  segment: z.enum(['new', 'regular', 'vip', 'inactive']).default('new'),
  
  // Notes
  notes: z.string().max(1000).optional(),
});

// =============================================================================
// Helper: Vérifier l'accès au business
// =============================================================================

async function checkBusinessAccess(
  businessId: string,
  userId: string
): Promise<{ success: true; business: any } | NextResponse> {
  if (!isValidUUID(businessId)) {
    return NextResponse.json(
      { success: false, error: 'ID business invalide' },
      { status: 400 }
    );
  }
  
  const business = await db?.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, name: true, currency: true },
  });
  
  if (!business) {
    return NextResponse.json(
      { success: false, error: 'Business non trouvé' },
      { status: 404 }
    );
  }
  
  if (business.ownerId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé' },
      { status: 403 }
    );
  }
  
  return { success: true, business };
}

// =============================================================================
// GET /api/customers - Liste des clients
// =============================================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const segment = searchParams.get('segment') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    const skip = (page - 1) * limit;
    
    // Récupérer les businesses de l'utilisateur
    const userBusinesses = await db!.business.findMany({
      where: { ownerId: auth.userId },
      select: { id: true },
    });
    
    const businessIds = userBusinesses.map(b => b.id);
    
    if (businessId && !businessIds.includes(businessId)) {
      return NextResponse.json(
        { success: false, error: 'Business non autorisé' },
        { status: 403 }
      );
    }
    
    const where = {
      businessId: businessId || { in: businessIds },
      ...(segment && { segment }),
      ...(search && {
        OR: [
          { phone: { contains: search } },
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };
    
    const [customers, total] = await Promise.all([
      db!.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          business: { select: { id: true, name: true } },
          _count: { select: { orders: true } },
        },
      }),
      db!.customer.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/customers - Créer un client
// =============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = createCustomerSchema.safeParse(body);
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
    
    // Vérifier l'accès au business
    const accessResult = await checkBusinessAccess(data.businessId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    // Vérifier si le client existe déjà (même téléphone)
    const existingCustomer = await db!.customer.findFirst({
      where: {
        businessId: data.businessId,
        phone: data.phone,
      },
    });
    
    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un client avec ce numéro existe déjà',
          existingCustomer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            phone: existingCustomer.phone,
          },
        },
        { status: 400 }
      );
    }
    
    // Créer le client
    const customer = await db!.customer.create({
      data: {
        businessId: data.businessId,
        phone: data.phone,
        email: data.email || null,
        name: data.name || null,
        address: data.address || null,
        region: data.region || null,
        prefecture: data.prefecture || null,
        segment: data.segment,
        notes: data.notes || null,
      },
      include: {
        business: { select: { id: true, name: true } },
      },
    });
    
    // Mettre à jour le compteur de clients du business
    await db!.business.update({
      where: { id: data.businessId },
      data: { totalCustomers: { increment: 1 } },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'customer',
        entityId: customer.id,
        metadata: JSON.stringify({ name: customer.name, phone: customer.phone }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json(
      { success: true, data: customer },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du client' },
      { status: 500 }
    );
  }
}
