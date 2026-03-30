/**
 * InsightGov Africa - Invoices API
 * ==================================
 * API endpoints pour la gestion des factures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  listInvoices,
  createInvoice,
  generateInvoiceAfterPayment,
  getInvoiceStats,
  type InvoiceItem,
} from '@/services/invoice';
import { db } from '@/lib/db';

// =============================================================================
// GET /api/invoices - Liste des factures
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      // Mode démo - utiliser l'utilisateur démo
      const demoUser = await db.user.findFirst({
        where: { email: 'demo@insightgov.africa' },
      });

      if (!demoUser) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }

      // Récupérer les factures de l'utilisateur démo
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get('status') || undefined;
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const statsOnly = searchParams.get('stats') === 'true';

      if (statsOnly) {
        const stats = await getInvoiceStats(demoUser.organizationId || undefined);
        return NextResponse.json({ stats });
      }

      const result = await listInvoices({
        userId: demoUser.id,
        organizationId: demoUser.organizationId || undefined,
        status: status as 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded' | undefined,
        limit,
        offset,
      });

      return NextResponse.json(result);
    }

    // Récupérer les paramètres de filtrage
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statsOnly = searchParams.get('stats') === 'true';

    // Récupérer l'utilisateur complet
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, organizationId: true },
    });

    if (statsOnly) {
      const stats = await getInvoiceStats(user?.organizationId || undefined);
      return NextResponse.json({ stats });
    }

    const result = await listInvoices({
      userId: session.user.id,
      organizationId: user?.organizationId || undefined,
      status: status as 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded' | undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/invoices - Créer une nouvelle facture
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession();
    
    let userId: string;
    let organizationId: string | undefined;

    if (!session?.user?.id) {
      // Mode démo
      const demoUser = await db.user.findFirst({
        where: { email: 'demo@insightgov.africa' },
      });

      if (!demoUser) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }

      userId = demoUser.id;
      organizationId = demoUser.organizationId || undefined;
    } else {
      userId = session.user.id;
      
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, organizationId: true },
      });
      
      organizationId = user?.organizationId || undefined;
    }

    const body = await request.json();

    // Vérifier si c'est une génération automatique après paiement
    if (body.autoGenerate === true) {
      const invoice = await generateInvoiceAfterPayment({
        userId,
        organizationId: organizationId || '',
        subscriptionId: body.subscriptionId,
        planName: body.planName,
        planPrice: body.planPrice,
        billingCycle: body.billingCycle,
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
      });

      return NextResponse.json(invoice, { status: 201 });
    }

    // Création manuelle d'une facture
    const { items, currency, taxRate, discountAmount, dueInDays, notes, subscriptionId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Les lignes de facture sont requises' },
        { status: 400 }
      );
    }

    // Valider les items
    for (const item of items as InvoiceItem[]) {
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        return NextResponse.json(
          { error: 'Chaque ligne doit avoir une description, une quantité et un prix unitaire' },
          { status: 400 }
        );
      }
    }

    const invoice = await createInvoice({
      userId,
      organizationId: organizationId || '',
      subscriptionId,
      items: items as InvoiceItem[],
      currency,
      taxRate,
      discountAmount,
      dueInDays,
      notes,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
