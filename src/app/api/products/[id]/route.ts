/**
 * InsightGov Africa - Product by ID API
 * ======================================
 * API endpoints pour un produit spécifique.
 * GET: Détails d'un produit
 * PUT: Mettre à jour un produit
 * DELETE: Supprimer un produit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  subCategory: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  
  // Prix
  priceGnf: z.number().positive().optional(),
  priceUsd: z.number().positive().optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  minWholesaleQty: z.number().int().positive().optional().nullable(),
  
  // Stock
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxQuantity: z.number().int().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  
  // Variantes
  hasVariants: z.boolean().optional(),
  variants: z.record(z.string(), z.any()).optional().nullable(),
  
  // Images
  images: z.array(z.string().url()).optional(),
  mainImage: z.string().url().optional().nullable(),
  
  // SEO
  metaTitle: z.string().max(100).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  
  // Statut
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  
  // Dates
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
});

const stockAdjustmentSchema = z.object({
  adjustment: z.number().int(),
  reason: z.string().min(1).max(200),
});

// =============================================================================
// Helper: Vérifier l'accès au produit
// =============================================================================

async function checkProductAccess(
  productId: string,
  userId: string
): Promise<{ success: true; product: any; business: any } | NextResponse> {
  if (!isValidUUID(productId)) {
    return NextResponse.json(
      { success: false, error: 'ID produit invalide' },
      { status: 400 }
    );
  }
  
  const product = await db?.product.findUnique({
    where: { id: productId },
    include: {
      business: {
        select: { id: true, ownerId: true, name: true, currency: true },
      },
      stockMovements: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Produit non trouvé' },
      { status: 404 }
    );
  }
  
  if (product.business.ownerId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé' },
      { status: 403 }
    );
  }
  
  return { success: true, product, business: product.business };
}

// =============================================================================
// GET /api/products/[id] - Détails d'un produit
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
    const accessResult = await checkProductAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { product } = accessResult;
    
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        lowStockAlert: product.quantity <= product.minQuantity,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/products/[id] - Mettre à jour un produit
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
    const accessResult = await checkProductAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { product, business } = accessResult;
    const body = await request.json();
    
    // Vérifier si c'est un ajustement de stock
    if (body.stockAdjustment) {
      const validationResult = stockAdjustmentSchema.safeParse(body.stockAdjustment);
      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Ajustement de stock invalide' },
          { status: 400 }
        );
      }
      
      const { adjustment, reason } = validationResult.data;
      const newQuantity = product.quantity + adjustment;
      
      if (newQuantity < 0) {
        return NextResponse.json(
          { success: false, error: 'Stock insuffisant pour cet ajustement' },
          { status: 400 }
        );
      }
      
      // Mettre à jour le stock
      const updatedProduct = await db!.product.update({
        where: { id },
        data: { quantity: newQuantity },
      });
      
      // Créer le mouvement de stock
      await db!.stockMovement.create({
        data: {
          productId: id,
          type: adjustment > 0 ? 'in' : 'out',
          quantity: Math.abs(adjustment),
          previousStock: product.quantity,
          newStock: newQuantity,
          reason,
          createdBy: auth.userId,
        },
      });
      
      return NextResponse.json({
        success: true,
        data: updatedProduct,
        message: 'Stock mis à jour',
      });
    }
    
    // Validation avec Zod pour les autres mises à jour
    const validationResult = updateProductSchema.safeParse(body);
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
    
    // Vérifier si le SKU existe déjà pour ce business (si modifié)
    if (data.sku && data.sku !== product.sku) {
      const existingProduct = await db!.product.findFirst({
        where: { businessId: business.id, sku: data.sku, id: { not: id } },
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Un produit avec ce SKU existe déjà' },
          { status: 400 }
        );
      }
    }
    
    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subCategory !== undefined) updateData.subCategory = data.subCategory;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.priceGnf !== undefined) updateData.priceGnf = data.priceGnf;
    if (data.priceUsd !== undefined) updateData.priceUsd = data.priceUsd;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.wholesalePrice !== undefined) updateData.wholesalePrice = data.wholesalePrice;
    if (data.minWholesaleQty !== undefined) updateData.minWholesaleQty = data.minWholesaleQty;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
    if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.hasVariants !== undefined) updateData.hasVariants = data.hasVariants;
    if (data.variants !== undefined) updateData.variants = data.variants;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.mainImage !== undefined) updateData.mainImage = data.mainImage;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isNew !== undefined) updateData.isNew = data.isNew;
    if (data.isOnSale !== undefined) updateData.isOnSale = data.isOnSale;
    if (data.availableFrom !== undefined) updateData.availableFrom = data.availableFrom ? new Date(data.availableFrom) : null;
    if (data.availableUntil !== undefined) updateData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;
    
    // Mettre à jour le produit
    const updatedProduct = await db!.product.update({
      where: { id },
      data: updateData,
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'update',
        entityType: 'product',
        entityId: id,
        metadata: JSON.stringify({ name: product.name, changes: Object.keys(updateData) }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error('[API] Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/products/[id] - Supprimer un produit
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
    const accessResult = await checkProductAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { product } = accessResult;
    
    // Vérifier s'il y a des commandes liées
    const orderItemsCount = await db!.orderItem.count({
      where: { productId: id },
    });
    
    if (orderItemsCount > 0) {
      // Désactiver plutôt que supprimer
      await db!.product.update({
        where: { id },
        data: { isActive: false },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Produit désactivé (des commandes y sont liées)',
        deactivated: true,
      });
    }
    
    // Supprimer le produit
    await db!.product.delete({
      where: { id },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'delete',
        entityType: 'product',
        entityId: id,
        metadata: JSON.stringify({ name: product.name }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès',
    });
  } catch (error) {
    console.error('[API] Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    );
  }
}
