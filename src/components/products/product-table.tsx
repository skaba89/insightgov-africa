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
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  category?: string | null;
  priceGnf: number;
  priceUsd?: number | null;
  costPrice?: number | null;
  quantity: number;
  minQuantity: number;
  unit?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  mainImage?: string | null;
  business?: {
    id: string;
    name: string;
    currency: string;
  };
  stockStatus?: 'normal' | 'low' | 'out';
  isLowStock?: boolean;
  createdAt: string;
}

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onSearch?: (search: string) => void;
  onFilter?: (filters: ProductFilters) => void;
  loading?: boolean;
}

export interface ProductFilters {
  category?: string;
  stockStatus?: 'all' | 'low' | 'out';
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
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

const getStockBadge = (product: Product) => {
  if (product.quantity === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Rupture
      </Badge>
    );
  }
  if (product.quantity <= product.minQuantity) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700 bg-amber-50">
        <AlertTriangle className="h-3 w-3" />
        Stock bas
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
      En stock
    </Badge>
  );
};

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onSearch,
  loading = false,
}: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Extract unique categories
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filter products locally
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.quantity > 0 && product.quantity <= product.minQuantity) ||
      (stockFilter === 'out' && product.quantity === 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Produits ({filteredProducts.length})
          </CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat as string}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="low">Stock bas</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Package className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">
              Aucun produit trouvé
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter un produit'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">
                    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium hover:bg-transparent">
                      Produit
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.mainImage ? (
                            <img
                              src={product.mainImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground font-mono">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        {product.category || 'Non catégorisé'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(product.priceGnf, product.business?.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">
                          {product.quantity} {product.unit || 'unités'}
                        </span>
                        {getStockBadge(product)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(product.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
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

export default ProductTable;
