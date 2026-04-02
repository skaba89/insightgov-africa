'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  Eye,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  ShoppingCart,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Order {
  id: string;
  reference: string;
  businessId: string;
  customerId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  customerEmail?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  delivery: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: 'cash' | 'orange_money' | 'mtn_money' | 'card' | null;
  deliveryMethod?: 'pickup' | 'delivery' | 'shipping' | null;
  source: 'app' | 'web' | 'api' | 'pos';
  notes?: string | null;
  createdAt: string;
  business?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  _count?: {
    items: number;
  };
}

interface OrderTableProps {
  orders: Order[];
  onViewDetails?: (order: Order) => void;
  onMarkDelivered?: (orderId: string) => void;
  onSearch?: (search: string) => void;
  loading?: boolean;
}

const formatPrice = (price: number, currency: string = 'GNF') => {
  const formatter = new Intl.NumberFormat('fr-GN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (currency === 'USD') {
    return `$${formatter.format(price)}`;
  } else if (currency === 'EUR') {
    return `${formatter.format(price)} €`;
  }
  return `${formatter.format(price)} GNF`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-GN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: Order['status']) => {
  const statusConfig: Record<Order['status'], { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: 'En attente',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock className="h-3 w-3" />,
    },
    confirmed: {
      label: 'Confirmée',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    processing: {
      label: 'En préparation',
      className: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <ShoppingCart className="h-3 w-3" />,
    },
    shipped: {
      label: 'Expédiée',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: <Truck className="h-3 w-3" />,
    },
    delivered: {
      label: 'Livrée',
      className: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    cancelled: {
      label: 'Annulée',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
  const config: Record<Order['paymentStatus'], { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
    paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
    partial: { label: 'Partiel', className: 'bg-orange-100 text-orange-800' },
    refunded: { label: 'Remboursé', className: 'bg-gray-100 text-gray-800' },
  };

  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
};

const getPaymentMethodBadge = (method?: Order['paymentMethod']) => {
  if (!method) return null;

  const config: Record<string, { label: string; className: string }> = {
    cash: { label: 'Espèces', className: 'bg-green-50 text-green-700 border-green-200' },
    orange_money: { label: 'Orange Money', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    mtn_money: { label: 'MTN Money', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    card: { label: 'Carte', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  };

  const { label, className } = config[method] || { label: method, className: '' };
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

export function OrderTable({
  orders,
  onViewDetails,
  onMarkDelivered,
  loading = false,
}: OrderTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Filter orders locally
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !search ||
      order.reference.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search) ||
      order.customerName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            Commandes ({filteredOrders.length})
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Référence, téléphone, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="processing">En préparation</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="partial">Partiel</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ShoppingCart className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucune commande trouvée
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Les commandes apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent">
                      Référence
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium">{order.reference}</p>
                        <p className="text-xs text-muted-foreground">
                          {order._count?.items || 0} article(s)
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName || 'Client'}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total, order.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getPaymentStatusBadge(order.paymentStatus)}
                        {getPaymentMethodBadge(order.paymentMethod)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewDetails && (
                            <DropdownMenuItem onClick={() => onViewDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                          )}
                          {onMarkDelivered && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onMarkDelivered(order.id)}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marquer comme livrée
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderTable;
