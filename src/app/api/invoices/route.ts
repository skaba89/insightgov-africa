/**
 * InsightGov Africa - Invoices API
 * ==================================
 * API endpoints pour la gestion des factures.
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listInvoices,
  createInvoice,
  generateInvoiceAfterPayment,
  getInvoiceStats,
  type InvoiceItem,
} from '@/services/invoice';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// =============================================================================
// GET /api/invoices - Liste des factures
// =============================================================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getInvoiceStats(auth.organizationId || undefined);
      return NextResponse.json({ success: true, stats });
    }

    const result = await listInvoices({
      userId: auth.userId,
      organizationId: auth.organizationId || undefined,
      status: status as 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded' | undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/invoices - Créer une nouvelle facture
// =============================================================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write pour créer)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();

    // Vérifier si c'est une génération automatique après paiement
    if (body.autoGenerate === true) {
      if (!auth.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Aucune organisation associée.' },
          { status: 400 }
        );
      }

      const invoice = await generateInvoiceAfterPayment({
        userId: auth.userId,
        organizationId: auth.organizationId,
        subscriptionId: body.subscriptionId,
        planName: body.planName,
        planPrice: body.planPrice,
        billingCycle: body.billingCycle,
        currency: body.currency,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference,
      });

      return NextResponse.json({ success: true, invoice }, { status: 201 });
    }

    // Création manuelle d'une facture (admin seulement)
    if (auth.role !== 'owner' && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent créer des factures manuelles.' },
        { status: 403 }
      );
    }

    const { items, currency, taxRate, discountAmount, dueInDays, notes, subscriptionId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Les lignes de facture sont requises' },
        { status: 400 }
      );
    }

    // Valider les items
    for (const item of items as InvoiceItem[]) {
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Chaque ligne doit avoir une description, une quantité et un prix unitaire' },
          { status: 400 }
        );
      }
    }

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    const invoice = await createInvoice({
      userId: auth.userId,
      organizationId: auth.organizationId,
      subscriptionId,
      items: items as InvoiceItem[],
      currency,
      taxRate,
      discountAmount,
      dueInDays,
      notes,
    });

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'create',
        entityType: 'invoice',
        entityId: (invoice as any).invoice?.id,
        metadata: JSON.stringify({ invoiceNumber: (invoice as any).invoice?.invoiceNumber }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({ success: true, ...invoice }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
