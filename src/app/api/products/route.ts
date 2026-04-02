/**
 * InsightGov Africa - Products API
 * ==================================
 * API endpoints pour la gestion des produits.
 * GET: Lister les produits avec filtres
 * POST: Créer un nouveau produit
 * 
 * Sécurisé avec authentification requireAuth
 * Validation Zod pour toutes les entrées
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

/**
 * Schema de validation pour la création d'un produit
 */
const createProductSchema = z.object({
  // Champs requis
  businessId: z.string().min(1, 'L\'ID du business est requis'),
  name: z.string().min(1, 'Le nom du produit est requis').max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  priceGnf: z.number().positive('Le prix doit être positif'),
  
  // Champs optionnels - Description
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  
  // Champs optionnels - Catégorisation
  category: z.string().max(100).optional().nullable(),
  subCategory: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  
  // Champs optionnels - Prix
  priceUsd: z.number().positive().optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  minWholesaleQty: z.number().int().positive().optional().nullable(),
  
  // Champs optionnels - Stock
  quantity: z.number().int().min(0).optional().default(0),
  minQuantity: z.number().int().min(0).optional().default(5),
  maxQuantity: z.number().int().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  
  // Champs optionnels - Variantes
  hasVariants: z.boolean().optional().default(false),
  variants: z.record(z.string(), z.any()).optional().nullable(),
  
  // Champs optionnels - Images
  images: z.array(z.string().url()).max(10).optional(),
  mainImage: z.string().url().optional().nullable(),
  
  // Champs optionnels - SEO
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  
  // Champs optionnels - Statut
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  isOnSale: z.boolean().optional().default(false),
  
  // Champs optionnels - Dates
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
});

/**
 * Schema pour les filtres de recherche
 */
const productFiltersSchema = z.object({
  businessId: z.string().optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  isFeatured: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  search: z.string().max(100).optional(),
  minPrice: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  maxPrice: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
  minStock: z.string().optional().transform(v => v ? parseInt(v) : undefined),
  maxStock: z.string().optional().transform(v => v ? parseInt(v) : undefined),
  lowStock: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  limit: z.string().optional().transform(v => v ? Math.min(parseInt(v) || 20, 100) : 20),
  offset: z.string().optional().transform(v => v ? parseInt(v) || 0 : 0),
  sortBy: z.enum(['name', 'priceGnf', 'quantity', 'createdAt', 'category']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// Helper: Générer un slug unique
// =============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
      { success: false, error: 'Accès refusé - Vous n\'êtes pas le propriétaire de ce business' },
      { status: 403 }
    );
  }
  
  return { success: true, business };
}

// =============================================================================
// GET /api/products - Lister les produits
// =============================================================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    // Récupérer et valider les paramètres de recherche
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = productFiltersSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    
    const filters = validationResult.data;
    
    // Construire la clause WHERE
    const where: Record<string, unknown> = {};
    
    // Filtre par business (optionnel mais recommandé)
    if (filters.businessId) {
      // Vérifier l'accès au business
      const accessResult = await checkBusinessAccess(filters.businessId, auth.userId);
      if (accessResult instanceof NextResponse) return accessResult;
      
      where.businessId = filters.businessId;
    } else {
      // Si pas de businessId, filtrer par les businesses de l'utilisateur
      const userBusinesses = await db?.business.findMany({
        where: { ownerId: auth.userId },
        select: { id: true },
      });
      
      if (!userBusinesses || userBusinesses.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: false,
          },
        });
      }
      
      where.businessId = { in: userBusinesses.map(b => b.id) };
    }
    
    // Filtres additionnels
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }
    
    // Recherche textuelle
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { sku: { contains: filters.search } },
        { barcode: { contains: filters.search } },
      ];
    }
    
    // Filtres de prix
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.priceGnf = {};
      if (filters.minPrice !== undefined) {
        (where.priceGnf as Record<string, unknown>).gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        (where.priceGnf as Record<string, unknown>).lte = filters.maxPrice;
      }
    }
    
    // Filtres de stock
    if (filters.minStock !== undefined || filters.maxStock !== undefined) {
      where.quantity = {};
      if (filters.minStock !== undefined) {
        (where.quantity as Record<string, unknown>).gte = filters.minStock;
      }
      if (filters.maxStock !== undefined) {
        (where.quantity as Record<string, unknown>).lte = filters.maxStock;
      }
    }
    
    // Exécuter les requêtes en parallèle
    const [products, total] = await Promise.all([
      db!.product.findMany({
        where,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        take: filters.limit,
        skip: filters.offset,
        include: {
          business: {
            select: { id: true, name: true, currency: true },
          },
          _count: {
            select: { stockMovements: true },
          },
        },
      }),
      db!.product.count({ where }),
    ]);
    
    // Enrichir avec l'alerte de stock bas
    const enrichedProducts = products.map(product => {
      const isLowStock = product.quantity <= product.minQuantity;
      const variants = product.variants ? JSON.parse(product.variants as string) : null;
      const tags = product.tags ? JSON.parse(product.tags as string) : [];
      const images = product.images ? JSON.parse(product.images as string) : [];
      
      return {
        ...product,
        variants,
        tags,
        images,
        isLowStock,
        stockStatus: isLowStock ? 'low' : product.quantity === 0 ? 'out' : 'normal',
      };
    });
    
    // Filtrer par stock bas si demandé
    const finalProducts = filters.lowStock 
      ? enrichedProducts.filter(p => p.isLowStock)
      : enrichedProducts;
    
    return NextResponse.json({
      success: true,
      data: finalProducts,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
      filters: {
        applied: filters,
        resultsCount: finalProducts.length,
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
// POST /api/products - Créer un produit
// =============================================================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour créer)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    // Parser et valider le corps de la requête
    const body = await request.json();
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
    
    // Vérifier l'accès au business
    const accessResult = await checkBusinessAccess(data.businessId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { business } = accessResult;
    
    // Générer le slug
    const slug = generateSlug(data.name);
    
    // Vérifier si le slug existe déjà pour ce business
    const existingProduct = await db!.product.findFirst({
      where: { businessId: data.businessId, slug },
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Un produit avec ce nom existe déjà dans ce business' },
        { status: 400 }
      );
    }
    
    // Vérifier si le SKU existe déjà (si fourni)
    if (data.sku) {
      const existingSku = await db!.product.findFirst({
        where: { businessId: data.businessId, sku: data.sku },
      });
      
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: 'Un produit avec ce SKU existe déjà' },
          { status: 400 }
        );
      }
    }
    
    // Créer le produit
    const product = await db!.product.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        slug: slug + '-' + nanoid(6), // Ajouter un suffixe unique
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category,
        subCategory: data.subCategory,
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        
        // Prix
        priceGnf: data.priceGnf,
        priceUsd: data.priceUsd,
        costPrice: data.costPrice,
        wholesalePrice: data.wholesalePrice,
        minWholesaleQty: data.minWholesaleQty,
        
        // Stock
        quantity: data.quantity,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        unit: data.unit,
        
        // Variantes
        hasVariants: data.hasVariants,
        variants: data.variants,
        
        // Images
        images: data.images ? JSON.stringify(data.images) : '[]',
        mainImage: data.mainImage,
        
        // SEO
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        
        // Statut
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        isOnSale: data.isOnSale,
        
        // Dates
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
        availableUntil: data.availableUntil ? new Date(data.availableUntil) : undefined,
      },
      include: {
        business: {
          select: { id: true, name: true, currency: true },
        },
      },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'product',
        entityId: product.id,
        metadata: JSON.stringify({
          name: product.name,
          businessId: data.businessId,
          businessName: business.name,
          price: product.priceGnf,
        }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json(
      {
        success: true,
        data: {
          ...product,
          tags: data.tags || [],
          images: data.images || [],
        },
        message: 'Produit créé avec succès',
      },
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
