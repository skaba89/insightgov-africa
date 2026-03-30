/**
 * InsightGov Africa - Invoice Service
 * =====================================
 * Service de gestion des factures pour la plateforme SaaS.
 * Génère des numéros de facture séquentiels, calcule les taxes et totaux,
 * et gère le cycle de vie des factures.
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
  metadata?: Record<string, unknown>;
}

export interface InvoiceCreateInput {
  userId: string;
  organizationId: string;
  subscriptionId?: string;
  items: InvoiceItem[];
  currency?: string;
  taxRate?: number;
  discountAmount?: number;
  dueInDays?: number;
  notes?: string;
}

export interface InvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface InvoiceWithRelations {
  id: string;
  invoiceNumber: string;
  userId: string;
  organizationId: string;
  subscriptionId: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  items: InvoiceItem[];
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  pdfUrl: string | null;
  pdfGeneratedAt: Date | null;
  notes: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    organization?: {
      id: string;
      name: string;
      type: string;
      country: string | null;
      city: string | null;
    } | null;
  };
  organization?: {
    id: string;
    name: string;
    type: string;
    country: string | null;
    city: string | null;
  };
  subscription?: {
    id: string;
    tier: string;
    status: string;
    billingCycle: string;
  } | null;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const INVOICE_PREFIX = 'INV';
const DEFAULT_TAX_RATE = 18; // 18% TVA pour certains pays africains
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_DUE_DAYS = 30; // 30 jours pour le paiement

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Génère un numéro de facture séquentiel au format INV-YYYY-NNNN
 * Exemple: INV-2024-0001
 */
export async function generateInvoiceNumber(year?: number): Promise<string> {
  const targetYear = year || new Date().getFullYear();
  
  // Trouver le dernier numéro de facture pour l'année
  const lastInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `${INVOICE_PREFIX}-${targetYear}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;
  
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Formater le numéro avec zéros
  const formattedNumber = String(nextNumber).padStart(4, '0');
  return `${INVOICE_PREFIX}-${targetYear}-${formattedNumber}`;
}

/**
 * Calcule les totaux d'une facture à partir des lignes
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  options: {
    taxRate?: number;
    discountAmount?: number;
  } = {}
): InvoiceCalculation {
  const { taxRate = 0, discountAmount = 0 } = options;

  // Calcul du sous-total
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.total || (item.quantity * item.unitPrice);
    return sum + itemTotal;
  }, 0);

  // Calcul de la taxe
  const taxAmount = subtotal * (taxRate / 100);

  // Total final
  const totalAmount = subtotal + taxAmount - discountAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Formate un montant avec la devise
 */
export function formatAmount(amount: number, currency: string = 'EUR'): string {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Calcule la date d'échéance
 */
export function calculateDueDate(issueDate: Date, dueInDays: number = DEFAULT_DUE_DAYS): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueInDays);
  return dueDate;
}

/**
 * Vérifie si une facture est en retard
 */
export function isInvoiceOverdue(dueDate: Date, status: InvoiceStatus): boolean {
  if (status === 'paid' || status === 'canceled' || status === 'refunded') {
    return false;
  }
  return new Date() > dueDate;
}

// =============================================================================
// OPÉRATIONS CRUD
// =============================================================================

/**
 * Crée une nouvelle facture
 */
export async function createInvoice(input: InvoiceCreateInput): Promise<InvoiceWithRelations> {
  const {
    userId,
    organizationId,
    subscriptionId,
    items,
    currency = DEFAULT_CURRENCY,
    taxRate = DEFAULT_TAX_RATE,
    discountAmount = 0,
    dueInDays = DEFAULT_DUE_DAYS,
    notes,
  } = input;

  // Calculer les totaux
  const calculations = calculateInvoiceTotals(items, { taxRate, discountAmount });

  // Générer le numéro de facture
  const invoiceNumber = await generateInvoiceNumber();

  // Calculer la date d'échéance
  const issueDate = new Date();
  const dueDate = calculateDueDate(issueDate, dueInDays);

  // Créer la facture
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      userId,
      organizationId,
      subscriptionId,
      subtotal: calculations.subtotal,
      taxRate,
      taxAmount: calculations.taxAmount,
      discountAmount: calculations.discountAmount,
      totalAmount: calculations.totalAmount,
      currency,
      status: 'pending',
      items: JSON.stringify(items),
      issueDate,
      dueDate,
      notes,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              country: true,
              city: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      subscription: {
        select: {
          id: true,
          tier: true,
          status: true,
          billingCycle: true,
        },
      },
    },
  });

  return {
    ...invoice,
    items: JSON.parse(invoice.items as string || '[]'),
  };
}

/**
 * Récupère une facture par son ID
 */
export async function getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              country: true,
              city: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      subscription: {
        select: {
          id: true,
          tier: true,
          status: true,
          billingCycle: true,
        },
      },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    items: JSON.parse(invoice.items as string || '[]'),
  };
}

/**
 * Récupère une facture par son numéro
 */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceWithRelations | null> {
  const invoice = await db.invoice.findUnique({
    where: { invoiceNumber },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              country: true,
              city: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      subscription: {
        select: {
          id: true,
          tier: true,
          status: true,
          billingCycle: true,
        },
      },
    },
  });

  if (!invoice) return null;

  return {
    ...invoice,
    items: JSON.parse(invoice.items as string || '[]'),
  };
}

/**
 * Liste les factures avec filtres et pagination
 */
export async function listInvoices(options: {
  userId?: string;
  organizationId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} = {}): Promise<{ invoices: InvoiceWithRelations[]; total: number }> {
  const {
    userId,
    organizationId,
    status,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  } = options;

  const where: Prisma.InvoiceWhereInput = {};

  if (userId) where.userId = userId;
  if (organizationId) where.organizationId = organizationId;
  if (status) where.status = status;
  
  if (startDate || endDate) {
    where.issueDate = {};
    if (startDate) where.issueDate.gte = startDate;
    if (endDate) where.issueDate.lte = endDate;
  }

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
                country: true,
                city: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            country: true,
            city: true,
          },
        },
        subscription: {
          select: {
            id: true,
            tier: true,
            status: true,
            billingCycle: true,
          },
        },
      },
    }),
    db.invoice.count({ where }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      items: JSON.parse(inv.items as string || '[]'),
    })),
    total,
  };
}

/**
 * Met à jour le statut d'une facture
 */
export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  options: {
    paidAt?: Date;
    paymentMethod?: string;
    paymentReference?: string;
    pdfUrl?: string;
  } = {}
): Promise<InvoiceWithRelations> {
  const updateData: Prisma.InvoiceUpdateInput = {
    status,
    ...(options.paidAt && { paidAt: options.paidAt }),
    ...(options.paymentMethod && { paymentMethod: options.paymentMethod }),
    ...(options.paymentReference && { paymentReference: options.paymentReference }),
    ...(options.pdfUrl && { pdfUrl: options.pdfUrl, pdfGeneratedAt: new Date() }),
  };

  const invoice = await db.invoice.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              country: true,
              city: true,
            },
          },
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      subscription: {
        select: {
          id: true,
          tier: true,
          status: true,
          billingCycle: true,
        },
      },
    },
  });

  return {
    ...invoice,
    items: JSON.parse(invoice.items as string || '[]'),
  };
}

/**
 * Met à jour l'URL du PDF d'une facture
 */
export async function updateInvoicePdfUrl(
  id: string,
  pdfUrl: string
): Promise<void> {
  await db.invoice.update({
    where: { id },
    data: {
      pdfUrl,
      pdfGeneratedAt: new Date(),
    },
  });
}

/**
 * Marque une facture comme payée
 */
export async function markInvoiceAsPaid(
  id: string,
  paymentDetails: {
    paymentMethod: string;
    paymentReference: string;
  }
): Promise<InvoiceWithRelations> {
  return updateInvoiceStatus(id, 'paid', {
    paidAt: new Date(),
    ...paymentDetails,
  });
}

/**
 * Annule une facture
 */
export async function cancelInvoice(id: string, reason?: string): Promise<InvoiceWithRelations> {
  const invoice = await db.invoice.update({
    where: { id },
    data: {
      status: 'canceled',
      notes: reason,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          country: true,
          city: true,
        },
      },
      subscription: {
        select: {
          id: true,
          tier: true,
          status: true,
          billingCycle: true,
        },
      },
    },
  });

  return {
    ...invoice,
    items: JSON.parse(invoice.items as string || '[]'),
  };
}

/**
 * Génère automatiquement une facture après un paiement réussi
 */
export async function generateInvoiceAfterPayment(input: {
  userId: string;
  organizationId: string;
  subscriptionId?: string;
  planName: string;
  planPrice: number;
  billingCycle: 'monthly' | 'yearly';
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
}): Promise<InvoiceWithRelations> {
  const {
    userId,
    organizationId,
    subscriptionId,
    planName,
    planPrice,
    billingCycle,
    currency = DEFAULT_CURRENCY,
    paymentMethod,
    paymentReference,
  } = input;

  // Créer les lignes de facture
  const items: InvoiceItem[] = [
    {
      description: `Abonnement ${planName} - ${billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}`,
      quantity: 1,
      unitPrice: planPrice,
      total: planPrice,
    },
  ];

  // Appliquer une remise de 20% pour les abonnements annuels
  const discountAmount = billingCycle === 'yearly' ? planPrice * 0.2 : 0;

  // Créer la facture
  const invoice = await createInvoice({
    userId,
    organizationId,
    subscriptionId,
    items,
    currency,
    taxRate: DEFAULT_TAX_RATE,
    discountAmount,
    dueInDays: 0, // Paiement immédiat
  });

  // Marquer comme payée si les détails de paiement sont fournis
  if (paymentMethod && paymentReference) {
    return markInvoiceAsPaid(invoice.id, {
      paymentMethod,
      paymentReference,
    });
  }

  return invoice;
}

/**
 * Vérifie et met à jour les factures en retard
 */
export async function updateOverdueInvoices(): Promise<number> {
  const now = new Date();
  
  // Trouver les factures en retard
  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: now },
    },
  });

  // Mettre à jour le statut
  if (overdueInvoices.length > 0) {
    await db.invoice.updateMany({
      where: {
        id: { in: overdueInvoices.map((inv) => inv.id) },
      },
      data: {
        status: 'overdue',
      },
    });
  }

  return overdueInvoices.length;
}

/**
 * Récupère les statistiques des factures
 */
export async function getInvoiceStats(organizationId?: string): Promise<{
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
}> {
  const where = organizationId ? { organizationId } : {};

  const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, revenueAgg] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.count({ where: { ...where, status: 'paid' } }),
    db.invoice.count({ where: { ...where, status: 'pending' } }),
    db.invoice.count({ where: { ...where, status: 'overdue' } }),
    db.invoice.aggregate({
      where: { ...where, status: 'paid' },
      _sum: { totalAmount: true },
    }),
  ]);

  const [pendingAgg, overdueAgg] = await Promise.all([
    db.invoice.aggregate({
      where: { ...where, status: 'pending' },
      _sum: { totalAmount: true },
    }),
    db.invoice.aggregate({
      where: { ...where, status: 'overdue' },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    totalRevenue: revenueAgg._sum.totalAmount || 0,
    pendingAmount: pendingAgg._sum.totalAmount || 0,
    overdueAmount: overdueAgg._sum.totalAmount || 0,
  };
}

// Export par défaut
const invoiceService = {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  formatAmount,
  calculateDueDate,
  isInvoiceOverdue,
  createInvoice,
  getInvoiceById,
  getInvoiceByNumber,
  listInvoices,
  updateInvoiceStatus,
  updateInvoicePdfUrl,
  markInvoiceAsPaid,
  cancelInvoice,
  generateInvoiceAfterPayment,
  updateOverdueInvoices,
  getInvoiceStats,
};

export default invoiceService;
