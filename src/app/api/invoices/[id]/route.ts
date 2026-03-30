/**
 * InsightGov Africa - Invoice Detail API
 * =======================================
 * API endpoint pour récupérer une facture spécifique.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getInvoiceById, updateInvoiceStatus, cancelInvoice } from '@/services/invoice';
import { db } from '@/lib/db';

// =============================================================================
// GET /api/invoices/[id] - Récupérer une facture
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      // Mode démo - vérifier si l'utilisateur démo existe
      const demoUser = await db.user.findFirst({
        where: { email: 'demo@insightgov.africa' },
      });

      if (!demoUser) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
    }

    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/invoices/[id] - Mettre à jour une facture
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      const demoUser = await db.user.findFirst({
        where: { email: 'demo@insightgov.africa' },
      });

      if (!demoUser) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { status, paymentMethod, paymentReference, pdfUrl } = body;

    // Vérifier que la facture existe
    const existingInvoice = await getInvoiceById(id);
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Si le statut est 'canceled', utiliser la fonction dédiée
    if (status === 'canceled') {
      const invoice = await cancelInvoice(id, body.reason);
      return NextResponse.json(invoice);
    }

    // Sinon, mettre à jour le statut normalement
    const invoice = await updateInvoiceStatus(id, status, {
      paymentMethod,
      paymentReference,
      pdfUrl,
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/invoices/[id] - Annuler une facture
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      const demoUser = await db.user.findFirst({
        where: { email: 'demo@insightgov.africa' },
      });

      if (!demoUser) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
    }

    // Vérifier que la facture existe
    const existingInvoice = await getInvoiceById(id);
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Annuler la facture
    const invoice = await cancelInvoice(id);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
