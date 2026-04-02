/**
 * InsightGov Africa - Invoice Detail API
 * =======================================
 * API endpoints pour la gestion d'une facture spécifique.
 * 
 * GET: Détails d'une facture
 * PUT: Mettre à jour une facture
 * DELETE: Supprimer une facture (soft delete - annulation)
 * 
 * Sécurisé avec authentification requireAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isValidUUID } from '@/lib/auth-middleware';
import { getInvoiceById, updateInvoiceStatus, cancelInvoice } from '@/services/invoice';
import { db } from '@/lib/db';

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

/**
 * Schema de validation pour la mise à jour d'une facture
 */
const updateInvoiceSchema = z.object({
  // Statut
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'canceled', 'refunded']).optional(),
  
  // Paiement
  paymentMethod: z.enum(['paystack', 'bank_transfer', 'check', 'cash', 'orange_money', 'mtn_money']).optional(),
  paymentReference: z.string().max(100).optional(),
  
  // Dates
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional().nullable(),
  
  // PDF
  pdfUrl: z.string().url().optional(),
  
  // Notes
  notes: z.string().max(1000).optional().nullable(),
  
  // Métadonnées
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Schema pour l'annulation
 */
const cancelInvoiceSchema = z.object({
  reason: z.string().min(1, 'La raison d\'annulation est requise').max(500),
});

// =============================================================================
// Helper: Vérifier l'accès à la facture
// =============================================================================

async function checkInvoiceAccess(
  invoiceId: string,
  userId: string
): Promise<{ success: true; invoice: any } | NextResponse> {
  if (!isValidUUID(invoiceId)) {
    return NextResponse.json(
      { success: false, error: 'ID facture invalide' },
      { status: 400 }
    );
  }
  
  const invoice = await db?.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      organization: {
        select: { id: true, name: true },
      },
      subscription: {
        select: { id: true, tier: true, status: true },
      },
    },
  });
  
  if (!invoice) {
    return NextResponse.json(
      { success: false, error: 'Facture non trouvée' },
      { status: 404 }
    );
  }
  
  // Vérifier que l'utilisateur est propriétaire ou admin de l'organisation
  if (invoice.userId !== userId) {
    // Vérifier si l'utilisateur est admin de l'organisation
    const user = await db?.user.findFirst({
      where: {
        id: userId,
        organizationId: invoice.organizationId,
        role: { in: ['owner', 'admin'] },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé - Vous n\'avez pas les droits pour cette facture' },
        { status: 403 }
      );
    }
  }
  
  return { success: true, invoice };
}

// =============================================================================
// GET /api/invoices/[id] - Détails d'une facture
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    // Vérifier l'accès
    const accessResult = await checkInvoiceAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { invoice } = accessResult;
    
    // Parser les items JSON
    const items = invoice.items ? JSON.parse(invoice.items) : [];
    
    // Calculer les totaux
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const isOverdue = invoice.status === 'pending' && new Date(invoice.dueDate) < new Date();
    
    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        items,
        subtotal,
        isOverdue,
        daysOverdue: isOverdue 
          ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/invoices/[id] - Mettre à jour une facture
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérification d'authentification (write pour modifier)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    // Vérifier l'accès
    const accessResult = await checkInvoiceAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { invoice } = accessResult;
    
    // Parser et valider le corps de la requête
    const body = await request.json();
    const validationResult = updateInvoiceSchema.safeParse(body);
    
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
    
    // Vérifier les transitions de statut valides
    const validTransitions: Record<string, string[]> = {
      draft: ['pending', 'canceled'],
      pending: ['paid', 'overdue', 'canceled'],
      paid: ['refunded'],
      overdue: ['paid', 'canceled'],
      canceled: [],
      refunded: [],
    };
    
    if (data.status && !validTransitions[invoice.status]?.includes(data.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Transition de statut invalide: ${invoice.status} → ${data.status}`,
          validTransitions: validTransitions[invoice.status] || [],
        },
        { status: 400 }
      );
    }
    
    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};
    
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.paymentReference !== undefined) updateData.paymentReference = data.paymentReference;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;
    if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    // Si le statut passe à 'paid', enregistrer la date de paiement
    if (data.status === 'paid' && !invoice.paidAt) {
      updateData.paidAt = new Date();
      updateData.pdfGeneratedAt = new Date();
    }
    
    // Mettre à jour la facture
    const updatedInvoice = await db!.invoice.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: invoice.organizationId,
        action: 'update',
        entityType: 'invoice',
        entityId: id,
        metadata: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          changes: Object.keys(updateData),
          previousStatus: invoice.status,
          newStatus: data.status || invoice.status,
        }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedInvoice,
        items: invoice.items ? JSON.parse(invoice.items) : [],
      },
      message: 'Facture mise à jour avec succès',
    });
  } catch (error) {
    console.error('[API] Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la facture' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/invoices/[id] - Supprimer une facture (soft delete = annuler)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérification d'authentification (delete pour supprimer)
  const authResult = await requireAuth(request, 'delete');
  if (authResult instanceof NextResponse) return authResult;
  
  const { auth } = authResult;
  const { id } = await params;
  
  try {
    // Vérifier l'accès
    const accessResult = await checkInvoiceAccess(id, auth.userId);
    if (accessResult instanceof NextResponse) return accessResult;
    
    const { invoice } = accessResult;
    
    // Vérifier que la facture peut être annulée
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Une facture payée ne peut pas être supprimée. Utilisez le statut "refunded" pour remboursement.' },
        { status: 400 }
      );
    }
    
    if (invoice.status === 'canceled') {
      return NextResponse.json(
        { success: false, error: 'Cette facture est déjà annulée' },
        { status: 400 }
      );
    }
    
    // Récupérer la raison d'annulation
    const body = await request.json().catch(() => ({}));
    const validationReason = cancelInvoiceSchema.safeParse(body);
    const reason = validationReason.success ? validationReason.data.reason : 'Annulation par l\'utilisateur';
    
    // Annuler la facture (soft delete)
    const canceledInvoice = await db!.invoice.update({
      where: { id },
      data: {
        status: 'canceled',
        notes: invoice.notes 
          ? `${invoice.notes}\n\nAnnulé: ${reason}`
          : `Annulé: ${reason}`,
      },
    });
    
    // Log de l'activité
    await db!.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: invoice.organizationId,
        action: 'delete',
        entityType: 'invoice',
        entityId: id,
        metadata: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          reason,
          previousStatus: invoice.status,
        }),
      },
    }).catch(err => console.error('[API] Failed to log activity:', err));
    
    return NextResponse.json({
      success: true,
      data: canceledInvoice,
      message: 'Facture annulée avec succès',
    });
  } catch (error) {
    console.error('[API] Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/invoices/[id] - Mise à jour partielle (rétrocompatibilité)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Déléguer à PUT
  return PUT(request, params);
}
