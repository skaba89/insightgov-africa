/**
 * InsightGov Africa - Invoice List Component
 * ===========================================
 * Composant d'affichage de l'historique des factures avec statuts et téléchargement.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  organizationId: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled' | 'refunded';
  items: InvoiceItem[];
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
  subscription?: {
    id: string;
    tier: string;
    billingCycle: string;
  } | null;
}

interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: {
    label: 'Payée',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  overdue: {
    label: 'En retard',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
  },
  canceled: {
    label: 'Annulée',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
  refunded: {
    label: 'Remboursée',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: RefreshCw,
  },
  draft: {
    label: 'Brouillon',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
  },
};

// =============================================================================
// COMPOSANTS AUXILIAIRES
// =============================================================================

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('flex items-center gap-1', config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onDownload: (invoice: Invoice) => void;
}

function InvoiceDetailModal({ invoice, open, onClose, onDownload }: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Facture {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Détails de la facture et lignes de facturation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Date d'émission</div>
                <div className="font-medium">{formatDate(invoice.issueDate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Date d'échéance</div>
                <div className="font-medium">{formatDate(invoice.dueDate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Statut</div>
                <StatusBadge status={invoice.status} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold text-lg">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lignes de facturation */}
          <div>
            <h4 className="font-medium mb-3">Lignes de facturation</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total || item.quantity * item.unitPrice, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totaux */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Remise</span>
                    <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">TVA ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => onDownload(invoice)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

interface InvoiceListProps {
  organizationId?: string;
  showStats?: boolean;
  limit?: number;
}

export function InvoiceList({ organizationId, showStats = true, limit = 10 }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Downloading
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Charger les factures
  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', ((page - 1) * limit).toString());
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/invoices?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des factures');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/invoices?stats=true');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    if (showStats) {
      loadStats();
    }
  }, [loadInvoices, loadStats, showStats]);

  // Télécharger une facture
  const handleDownload = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      
      const response = await fetch(`/api/invoices/${invoice.id}/download`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice.invoiceNumber}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement de la facture');
    } finally {
      setDownloadingId(null);
    }
  };

  // Voir les détails d'une facture
  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total facturé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue, 'EUR')}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(stats.pendingAmount, 'EUR')}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">En retard</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(stats.overdueAmount, 'EUR')}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Factures</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalInvoices}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Historique des factures</CardTitle>
              <CardDescription>
                {total} facture{total > 1 ? 's' : ''} au total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="canceled">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tableau des factures */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
              <Button variant="outline" className="mt-4" onClick={loadInvoices}>
                Réessayer
              </Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune facture trouvée</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(invoice.issueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(invoice)}
                            disabled={downloadingId === invoice.id}
                          >
                            {downloadingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedInvoice(null);
        }}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default InvoiceList;
