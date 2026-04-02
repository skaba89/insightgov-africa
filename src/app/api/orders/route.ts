/**
 * InsightGov Africa - Orders API
 * ===============================
 * API endpoints pour la gestion des commandes.
 * GET: Lister les commandes
 * POST: Créer une commande
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().positive('Le prix unitaire doit être positif').optional(),
  discount: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

const createOrderSchema = z.object({
  businessId: z.string(),
  
  // Client
  customerId: z.string().optional(),
  customerPhone: z.string().min(8, 'Numéro de téléphone invalide'),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().max(500).optional(),
  
  // Détails
  items: z.array(orderItemSchema).min(1, 'Au moins un article est requis'),
  discount: z.number().min(0).default(0),
  delivery: z.number().min(0).default(0),
  
  // Paiement
  paymentMethod: z.enum(['cash', 'orange_money', 'mtn_money', 'card']).optional(),
  
  // Livraison
  deliveryMethod: z.enum(['pickup', 'delivery', 'shipping']).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryNotes: z.string().max(500).optional(),
  
  // Notes
  notes: z.string().max(1000).optional(),
  
  // Source
  source: z.enum(['app', 'web', 'api', 'pos']).default('app'),
});

// =============================================================================
// Helper: Générer une référence unique
// =============================================================================

async function generateOrderReference(): Promise<string> {
  const prefix = 'ORD';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Compter les commandes du jour
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await db!.order.count({
    where: { createdAt: { gte: today } },
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${date}-${sequence}`;
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
      { success: false, error: 'Accès refusé' },
      { status: 403 }
    );
  }
  
  return { success: true, business };
}

// =============================================================================
// GET /api/orders - Liste des commandes
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
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || undefined;
    
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
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(customerId && { customerId }),
      ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate) } }),
      ...(search && {
        OR: [
          { reference: { contains: search } },
          { customerPhone: { contains: search } },
          { customerName: { contains: search } },
        ],
      }),
    };
    
    const [orders, total] = await Promise.all([
      db!.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true, currency: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, mainImage: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      db!.order.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/orders - Créer une commande
// =============================================================================

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  
  try {
    const body = await request.json();
    
    // Validation avec Zod
    const validationResult = createOrderSchema.safeParse(body);
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
    
    // Vérifier et récupérer les produits
    const productIds = data.items.map(item => item.productId);
    const products = await db!.product.findMany({
      where: { id: { in: productIds }, businessId: data.businessId, isActive: true },
    });
    
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { success: false, error: `Produits non trouvés ou inactifs: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }
    
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Calculer les totaux
    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice || product.priceGnf;
      const discount = item.discount || 0;
      const total = unitPrice * item.quantity - discount;
      
      subtotal += total;
      
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        discount,
        total,
        notes: item.notes,
      };
    });
    
    const tax = 0; // Pas de taxe par défaut
    const total = subtotal + tax + data.delivery - data.discount;
    
    // Générer la référence
    const reference = await generateOrderReference();
    
    // Créer la commande avec les items
    const order = await db!.order.create({
      data: {
        reference,
        businessId: data.businessId,
        customerId: data.customerId || null,
        customerPhone: data.customerPhone,
        customerName: data.customerName || null,
        customerEmail: data.customerEmail || null,
        customerAddress: data.customerAddress || null,
        subtotal,
        discount: data.discount,
        tax,
        delivery: data.delivery,
        total,
        currency: business.currency,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: data.paymentMethod || null,
        deliveryMethod: data.deliveryMethod || null,
        deliveryAddress: data.deliveryAddress || null,
        deliveryNotes: data.deliveryNotes || null,
        notes: data.notes || null,
        source: data.source,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, mainImage: true } },
          },
        },
      },
    });
    
    // Mettre à jour les stocks
    for (const item of data.items) {
      await db!.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      
      // Créer le mouvement de stock
      const product = productMap.get(item.productId)!;
      await db!.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          previousStock: product.quantity,
          newStock: product.quantity - item.quantity,
          reason: `Commande ${reference}`,
          reference: order.id,
          createdBy: auth.userId,
        },
      });
    }
    
    // Mettre à jour les statistiques du business
    await db!.business.update({
      where: { id: data.businessId },
      data: {
        totalSales: { increment: total },
        totalOrders: { increment: 1 },
      },
    });
    
    // Mettre à jour le client si fourni
    if (data.customerId) {
      await db!.customer.update({
        where: { id: data.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
          lastOrderAt: new Date(),
        },
      });
    }
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'order',
        entityId: order.id,
        metadata: JSON.stringify({ reference, total }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    );
  }
}
