/**
 * InsightGov Africa - Order by ID API
 * =====================================
 * API endpoints pour une commande spécifique.
 * GET: Détails d'une commande
 * PUT: Mettre à jour le statut
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'failed', 'refunded']).optional(),
  paymentMethod: z.enum(['cash', 'orange_money', 'mtn_money', 'card']).optional(),
  paymentRef: z.string().max(100).optional(),
  paymentAmount: z.number().min(0).optional(),
  
  deliveryMethod: z.enum(['pickup', 'delivery', 'shipping']).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryNotes: z.string().max(500).optional(),
  estimatedDelivery: z.string().datetime().optional(),
  
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
});

// =============================================================================
// Helper: Vérifier l'accès à la commande
// =============================================================================

async function checkOrderAccess(
  orderId: string,
  userId: string
): Promise<{ success: true; order: any; business: any } | NextResponse> {
  if (!isValidUUID(orderId)) {
    return NextResponse.json(
      { success: false, error: 'ID commande invalide' },
      { status: 400 }
    );
  }
  
  const order = await db?.order.findUnique({
    where: { id: orderId },
    include: {
      business: {
        select: { id: true, ownerId: true, name: true, currency: true },
      },
      customer: { select: { id: true, name: true, phone: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, mainImage: true, priceGnf: true } },
        },
      },
    },
  });
  
  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Commande non trouvée' },
      { status: 404 }
    );
  }
  
  if (order.business.ownerId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé' },
      { status: 403 }
    );
  }
  
  return { success: true, order, business: order.business };
}

// =============================================================================
// GET /api/orders/[id] - Détails d'une commande
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
    const accessResult = await checkOrderAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    return NextResponse.json({
      success: true,
      data: accessResult.order,
    });
  } catch (error) {
    console.error('[API] Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/orders/[id] - Mettre à jour une commande
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
    const accessResult = await checkOrderAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { order, business } = accessResult;
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = updateOrderSchema.safeParse(body);
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
    
    // Gestion du statut
    if (data.status !== undefined) {
      // Vérifier les transitions valides
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
      };
      
      if (!validTransitions[order.status]?.includes(data.status)) {
        return NextResponse.json(
          { success: false, error: `Transition de statut invalide: ${order.status} -> ${data.status}` },
          { status: 400 }
        );
      }
      
      updateData.status = data.status;
      
      // Si livré, enregistrer la date
      if (data.status === 'delivered') {
        updateData.deliveredAt = new Date();
      }
    }
    
    // Gestion du paiement
    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus;
      
      if (data.paymentStatus === 'paid') {
        updateData.paidAt = new Date();
        updateData.paymentAmount = data.paymentAmount || order.total;
      }
    }
    
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.paymentRef !== undefined) updateData.paymentRef = data.paymentRef;
    if (data.paymentAmount !== undefined) updateData.paymentAmount = data.paymentAmount;
    
    // Livraison
    if (data.deliveryMethod !== undefined) updateData.deliveryMethod = data.deliveryMethod;
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
    if (data.deliveryNotes !== undefined) updateData.deliveryNotes = data.deliveryNotes;
    if (data.estimatedDelivery !== undefined) updateData.estimatedDelivery = new Date(data.estimatedDelivery);
    
    // Notes
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
    
    // Si annulation, restaurer le stock
    if (data.status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await db!.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        
        await db!.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'return',
            quantity: item.quantity,
            previousStock: (await db!.product.findUnique({ where: { id: item.productId } }))!.quantity - item.quantity,
            newStock: (await db!.product.findUnique({ where: { id: item.productId } }))!.quantity,
            reason: `Annulation commande ${order.reference}`,
            reference: order.id,
            createdBy: auth.userId,
          },
        });
      }
      
      // Mettre à jour les stats du business
      await db!.business.update({
        where: { id: business.id },
        data: {
          totalSales: { decrement: order.total },
          totalOrders: { decrement: 1 },
        },
      });
    }
    
    // Mettre à jour la commande
    const updatedOrder = await db!.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, mainImage: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'update',
        entityType: 'order',
        entityId: id,
        metadata: JSON.stringify({ reference: order.reference, changes: Object.keys(updateData) }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[API] Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    );
  }
}
