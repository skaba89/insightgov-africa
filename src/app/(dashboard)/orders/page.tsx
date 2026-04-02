'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
} from 'lucide-react';
import { OrderTable, Order } from '@/components/orders/order-table';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
        );
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            Commandes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les commandes de vos clients
          </p>
        </div>
        
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {totalOrders}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-muted-foreground">En attente</span>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {pendingOrders}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Livrées</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {deliveredOrders}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-muted-foreground">Annulées</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {cancelledOrders}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Revenus</span>
            </div>
            <div className="text-lg font-bold text-purple-600 mt-1">
              {new Intl.NumberFormat('fr-GN', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(totalRevenue)} GNF
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Table */}
      <OrderTable
        orders={orders}
        onMarkDelivered={handleMarkDelivered}
        loading={loading}
      />
    </div>
  );
}
