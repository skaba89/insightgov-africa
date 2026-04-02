/**
 * InsightGov Africa - Business Products API
 * ==========================================
 * API endpoints pour la gestion des produits d'un business.
 * GET: Lister les produits d'un business
 * POST: Ajouter un produit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  description: z.string().max(2000).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  subCategory: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  
  // Prix
  priceGnf: z.number().positive('Le prix doit être positif'),
  priceUsd: z.number().positive().optional(),
  costPrice: z.number().min(0).optional(),
  wholesalePrice: z.number().min(0).optional(),
  minWholesaleQty: z.number().int().positive().optional(),
  
  // Stock
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(5),
  maxQuantity: z.number().int().positive().optional(),
  unit: z.string().max(20).optional(),
  
  // Variantes
  hasVariants: z.boolean().default(false),
  variants: z.record(z.string(), z.any()).optional(),
  
  // Images
  images: z.array(z.string().url()).optional(),
  mainImage: z.string().url().optional(),
  
  // SEO
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  
  // Statut
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  
  // Dates
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
});

// =============================================================================
// Helper: Vérifier l'accès au business
// =============================================================================

async function checkBusinessOwnership(
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
      { success: false, error: 'Accès refusé. Vous n\'êtes pas le propriétaire de ce business.' },
      { status: 403 }
    );
  }
  
  return { success: true, business };
}

// =============================================================================
// GET /api/business/[id]/products - Liste des produits
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id: businessId } = await params;
  
  try {
    const accessResult = await checkBusinessOwnership(businessId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const isActive = searchParams.get('isActive');
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    const skip = (page - 1) * limit;
    
    const where = {
      businessId,
      ...(category && { category }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(lowStock && {
        quantity: { lte: db!.product.fields.minQuantity },
      }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };
    
    const [products, total] = await Promise.all([
      db!.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      db!.product.count({ where }),
    ]);
    
    // Ajouter l'alerte de stock bas
    const productsWithAlerts = products.map(product => ({
      ...product,
      lowStockAlert: product.quantity <= product.minQuantity,
    }));
    
    return NextResponse.json({
      success: true,
      data: productsWithAlerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/business/[id]/products - Ajouter un produit
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id: businessId } = await params;
  
  try {
    const accessResult = await checkBusinessOwnership(businessId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = createProductSchema.safeParse(body);
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
    
    // Vérifier si le SKU existe déjà pour ce business
    if (data.sku) {
      const existingProduct = await db!.product.findFirst({
        where: { businessId, sku: data.sku },
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Un produit avec ce SKU existe déjà' },
          { status: 400 }
        );
      }
    }
    
    // Créer le produit
    const product = await db!.product.create({
      data: {
        businessId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        description: data.description || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        category: data.category || null,
        subCategory: data.subCategory || null,
        tags: JSON.stringify(data.tags || []),
        priceGnf: data.priceGnf,
        priceUsd: data.priceUsd || null,
        costPrice: data.costPrice || null,
        wholesalePrice: data.wholesalePrice || null,
        minWholesaleQty: data.minWholesaleQty || null,
        quantity: data.quantity,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity || null,
        unit: data.unit || null,
        hasVariants: data.hasVariants,
        variants: data.variants || null,
        images: JSON.stringify(data.images || []),
        mainImage: data.mainImage || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        isOnSale: data.isOnSale,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
      },
    });
    
    // Créer un mouvement de stock initial si quantité > 0
    if (data.quantity > 0) {
      await db!.stockMovement.create({
        data: {
          productId: product.id,
          type: 'in',
          quantity: data.quantity,
          previousStock: 0,
          newStock: data.quantity,
          reason: 'Stock initial',
          createdBy: auth.userId,
        },
      });
    }
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'product',
        entityId: product.id,
        metadata: JSON.stringify({ name: product.name, sku: product.sku }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}
