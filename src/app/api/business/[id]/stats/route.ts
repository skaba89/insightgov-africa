/**
 * InsightGov Africa - Business Stats API
 * ========================================
 * API endpoint pour les statistiques d'un business.
 * GET: Statistiques du business (ventes, commandes, clients)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// Helper: Vérifier l'accès au business
// =============================================================================

async function checkBusinessAccess(
  businessId: string,
  userId: string
): Promise<{ success: true; business: any } | NextResponse> {
  if (!isValidUUID(businessId)) {
    return NextResponse.json(
      { success: false, error: 'ID invalide' },
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
// GET /api/business/[id]/stats - Statistiques du business
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
    const accessResult = await checkBusinessAccess(businessId, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // day, week, month, year, all
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Calculer les dates selon la période
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = new Date(now);
    
    if (startDate && endDate) {
      periodStart = new Date(startDate);
      periodEnd = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          periodStart = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          periodStart = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          periodStart = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          periodStart = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          periodStart = new Date(0); // All time
      }
    }
    
    // Exécuter les requêtes en parallèle
    const [
      totalOrders,
      totalSales,
      ordersByStatus,
      ordersByPaymentStatus,
      topProducts,
      salesByDay,
      newCustomers,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      previousPeriodStats,
    ] = await Promise.all([
      // Total des commandes
      db!.order.count({
        where: {
          businessId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // Total des ventes
      db!.order.aggregate({
        where: {
          businessId,
          createdAt: { gte: periodStart, lte: periodEnd },
          status: { not: 'cancelled' },
        },
        _sum: { total: true },
      }),
      
      // Commandes par statut
      db!.order.groupBy({
        by: ['status'],
        where: {
          businessId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _count: true,
      }),
      
      // Commandes par statut de paiement
      db!.order.groupBy({
        by: ['paymentStatus'],
        where: {
          businessId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _count: true,
      }),
      
      // Top produits vendus
      db!.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: {
            businessId,
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { not: 'cancelled' },
          },
        },
        _sum: { quantity: true, total: true },
        _count: { id: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      
      // Ventes par jour (pour graphique)
      getSalesByDay(businessId, periodStart, periodEnd),
      
      // Nouveaux clients
      db!.customer.count({
        where: {
          businessId,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // Total clients
      db!.customer.count({
        where: { businessId },
      }),
      
      // Total produits
      db!.product.count({
        where: { businessId, isActive: true },
      }),
      
      // Produits en stock bas
      db!.product.count({
        where: {
          businessId,
          isActive: true,
          quantity: { lte: db!.$queryRaw`min_quantity` },
        },
      }),
      
      // Stats période précédente (pour comparaison)
      getPreviousPeriodStats(businessId, periodStart, period),
    ]);
    
    // Calculer les tendances
    const salesTrend = previousPeriodStats.totalSales > 0
      ? ((totalSales._sum.total || 0) - previousPeriodStats.totalSales) / previousPeriodStats.totalSales * 100
      : 0;
    
    const ordersTrend = previousPeriodStats.totalOrders > 0
      ? ((totalOrders - previousPeriodStats.totalOrders) / previousPeriodStats.totalOrders) * 100
      : 0;
    
    const customersTrend = previousPeriodStats.newCustomers > 0
      ? ((newCustomers - previousPeriodStats.newCustomers) / previousPeriodStats.newCustomers) * 100
      : 0;
    
    // Construire la réponse
    const stats = {
      period: {
        start: periodStart,
        end: periodEnd,
        type: period,
      },
      
      // Vue d'ensemble
      overview: {
        totalOrders,
        totalSales: totalSales._sum.total || 0,
        newCustomers,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        averageOrderValue: totalOrders > 0 ? (totalSales._sum.total || 0) / totalOrders : 0,
      },
      
      // Tendances
      trends: {
        sales: {
          value: salesTrend,
          direction: salesTrend > 0 ? 'up' : salesTrend < 0 ? 'down' : 'stable',
        },
        orders: {
          value: ordersTrend,
          direction: ordersTrend > 0 ? 'up' : ordersTrend < 0 ? 'down' : 'stable',
        },
        customers: {
          value: customersTrend,
          direction: customersTrend > 0 ? 'up' : customersTrend < 0 ? 'down' : 'stable',
        },
      },
      
      // Commandes par statut
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      
      // Commandes par statut de paiement
      ordersByPaymentStatus: ordersByPaymentStatus.reduce((acc, item) => {
        acc[item.paymentStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      
      // Top produits
      topProducts: topProducts.map((item, index) => ({
        rank: index + 1,
        productId: item.productId,
        productName: item.productName,
        quantitySold: item._sum.quantity || 0,
        revenue: item._sum.total || 0,
        orderCount: item._count.id,
      })),
      
      // Ventes par jour
      salesByDay,
      
      // Segments clients
      customerSegments: await getCustomerSegments(businessId),
    };
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[API] Error fetching business stats:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function getSalesByDay(businessId: string, start: Date, end: Date) {
  const orders = await db!.order.findMany({
    where: {
      businessId,
      createdAt: { gte: start, lte: end },
      status: { not: 'cancelled' },
    },
    select: {
      createdAt: true,
      total: true,
    },
  });
  
  // Grouper par jour
  const salesByDay: Record<string, { date: string; total: number; count: number }> = {};
  
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    
    if (!salesByDay[dateKey]) {
      salesByDay[dateKey] = { date: dateKey, total: 0, count: 0 };
    }
    
    salesByDay[dateKey].total += order.total;
    salesByDay[dateKey].count += 1;
  }
  
  return Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date));
}

async function getPreviousPeriodStats(businessId: string, currentStart: Date, period: string) {
  const periodLength = currentStart.getTime();
  let previousStart: Date;
  let previousEnd: Date = new Date(currentStart);
  
  switch (period) {
    case 'day':
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(currentStart);
      break;
    case 'week':
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      break;
    case 'month':
      previousStart = new Date(currentStart);
      previousStart.setMonth(previousStart.getMonth() - 1);
      break;
    case 'year':
      previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      break;
    default:
      // Pour 'all', pas de comparaison
      return { totalSales: 0, totalOrders: 0, newCustomers: 0 };
  }
  
  const [orders, sales, customers] = await Promise.all([
    db!.order.count({
      where: {
        businessId,
        createdAt: { gte: previousStart, lte: previousEnd },
        status: { not: 'cancelled' },
      },
    }),
    db!.order.aggregate({
      where: {
        businessId,
        createdAt: { gte: previousStart, lte: previousEnd },
        status: { not: 'cancelled' },
      },
      _sum: { total: true },
    }),
    db!.customer.count({
      where: {
        businessId,
        createdAt: { gte: previousStart, lte: previousEnd },
      },
    }),
  ]);
  
  return {
    totalOrders: orders,
    totalSales: sales._sum.total || 0,
    newCustomers: customers,
  };
}

async function getCustomerSegments(businessId: string) {
  const segments = await db!.customer.groupBy({
    by: ['segment'],
    where: { businessId },
    _count: true,
  });
  
  return segments.reduce((acc, item) => {
    acc[item.segment] = item._count;
    return acc;
  }, {} as Record<string, number>);
}
