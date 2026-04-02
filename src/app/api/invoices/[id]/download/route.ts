/**
 * InsightGov Africa - Invoice PDF Download API
 * =============================================
 * API endpoint pour télécharger une facture en PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getInvoiceById, updateInvoicePdfUrl } from '@/services/invoice';
import { generateInvoicePDF } from '@/lib/pdf/invoice-template';
import { db } from '@/lib/db';

// =============================================================================
// GET /api/invoices/[id]/download - Télécharger le PDF d'une facture
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
    }

    // Récupérer la facture
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Générer le PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Créer la réponse avec le PDF
    const response = new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}
