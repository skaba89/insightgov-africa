/**
 * InsightGov Africa - Business API
 * ==================================
 * API endpoints pour la gestion des businesses/commerces.
 * GET: Lister les businesses de l'utilisateur
 * POST: Créer un nouveau business
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const createBusinessSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  type: z.enum(['shop', 'restaurant', 'service', 'wholesale', 'manufacturer'], {
    errorMap: () => ({ message: 'Type de business invalide' }),
  }),
  phone: z.string().min(8, 'Numéro de téléphone invalide').max(20),
  phone2: z.string().max(20).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  
  // Localisation
  region: z.string().optional(),
  prefecture: z.string().optional(),
  subPrefecture: z.string().optional(),
  address: z.string().max(500).optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  
  // Business info
  nif: z.string().max(50).optional(),
  rccm: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  
  // Configuration
  currency: z.string().default('GNF'),
  acceptMobileMoney: z.boolean().default(true),
  acceptCash: z.boolean().default(true),
  acceptCard: z.boolean().default(false),
  isOpen24h: z.boolean().default(false),
  openingHours: z.record(z.any()).optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique slug for business
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  let slug = baseSlug;
  let counter = 1;
  
  while (await db?.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// =============================================================================
// GET /api/business - Liste des businesses
// =============================================================================

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;
    const region = searchParams.get('region') || undefined;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || undefined;
    
    const skip = (page - 1) * limit;
    
    const where = {
      ownerId: auth.userId,
      ...(type && { type }),
      ...(region && { region }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { category: { contains: search } },
        ],
      }),
    };
    
    const [businesses, total] = await Promise.all([
      db!.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true, orders: true, customers: true },
          },
        },
      }),
      db!.business.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching businesses:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des businesses' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/business - Créer un nouveau business
// =============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = createBusinessSchema.safeParse(body);
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
    
    // Générer un slug unique
    const slug = await generateUniqueSlug(data.name);
    
    // Créer le business
    const business = await db!.business.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        phone: data.phone,
        phone2: data.phone2 || null,
        email: data.email || null,
        website: data.website || null,
        region: data.region || null,
        prefecture: data.prefecture || null,
        subPrefecture: data.subPrefecture || null,
        address: data.address || null,
        gpsLat: data.gpsLat || null,
        gpsLng: data.gpsLng || null,
        nif: data.nif || null,
        rccm: data.rccm || null,
        category: data.category || null,
        tags: JSON.stringify(data.tags || []),
        currency: data.currency,
        acceptMobileMoney: data.acceptMobileMoney,
        acceptCash: data.acceptCash,
        acceptCard: data.acceptCard,
        isOpen24h: data.isOpen24h,
        openingHours: data.openingHours || null,
        ownerId: auth.userId,
        organizationId: auth.organizationId,
      },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'business',
        entityId: business.id,
        metadata: JSON.stringify({ name: business.name, type: business.type }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json(
      { success: true, data: business },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating business:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du business' },
      { status: 500 }
    );
  }
}
