'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ProductTable, Product } from '@/components/products/product-table';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter((p) => p.isLowStock).length;
  const outOfStockProducts = products.filter((p) => p.quantity === 0).length;

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-green-600" />
            Produits
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue de produits
          </p>
        </div>
        
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Produit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {totalProducts}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Actifs</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {activeProducts}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-muted-foreground">Stock bas</span>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {lowStockProducts}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm text-muted-foreground">Rupture</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {outOfStockProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <ProductTable
        products={products}
        loading={loading}
      />
    </div>
  );
}
