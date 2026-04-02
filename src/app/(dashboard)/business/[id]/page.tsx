'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CreditCard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ProductTable, Product } from '@/components/products/product-table';
import { OrderTable, Order } from '@/components/orders/order-table';
import { BusinessForm, BusinessFormData } from '@/components/business/business-form';

interface BusinessDetail {
  id: string;
  name: string;
  slug: string;
  type: 'shop' | 'restaurant' | 'service' | 'wholesale' | 'manufacturer';
  phone: string;
  phone2?: string | null;
  email?: string | null;
  website?: string | null;
  region?: string | null;
  prefecture?: string | null;
  address?: string | null;
  category?: string | null;
  nif?: string | null;
  rccm?: string | null;
  isActive: boolean;
  currency: string;
  acceptMobileMoney: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  isOpen24h: boolean;
  totalSales?: number;
  totalOrders?: number;
  totalCustomers?: number;
  createdAt: string;
  _count?: {
    products: number;
    orders: number;
    customers: number;
  };
}

interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
  pendingOrders: number;
  recentOrders: Order[];
  topProducts: Product[];
}

const businessTypeLabels: Record<string, string> = {
  shop: 'Boutique',
  restaurant: 'Restaurant',
  service: 'Services',
  wholesale: 'Grossiste',
  manufacturer: 'Fabricant',
};

const formatPrice = (price: number, currency: string = 'GNF') => {
  const formatter = new Intl.NumberFormat('fr-GN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  if (currency === 'USD') return `$${formatter.format(price)}`;
  if (currency === 'EUR') return `${formatter.format(price)} €`;
  return `${formatter.format(price)} GNF`;
};

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchBusinessDetails();
  }, [resolvedParams.id]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch business details
      const businessRes = await fetch(`/api/business/${resolvedParams.id}`);
      const businessData = await businessRes.json();
      
      if (businessData.success) {
        setBusiness(businessData.data);
      }

      // Fetch stats
      const statsRes = await fetch(`/api/business/${resolvedParams.id}/stats`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch products
      const productsRes = await fetch(`/api/products?businessId=${resolvedParams.id}&limit=10`);
      const productsData = await productsRes.json();
      
      if (productsData.success) {
        setProducts(productsData.data);
      }

      // Fetch orders
      const ordersRes = await fetch(`/api/orders?businessId=${resolvedParams.id}&limit=10`);
      const ordersData = await ordersRes.json();
      
      if (ordersData.success) {
        setOrders(ordersData.data);
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBusiness = async (formData: BusinessFormData) => {
    try {
      const res = await fetch(`/api/business/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        setBusiness(data.data);
        setShowEditForm(false);
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  };

  const handleDeleteBusiness = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce business ?')) return;
    
    try {
      const res = await fetch(`/api/business/${resolvedParams.id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        window.location.href = '/business';
      }
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  };

  const handleMarkOrderDelivered = async (orderId: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Business non trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Le business demandé n&apos;existe pas ou vous n&apos;avez pas accès.
            </p>
            <Button asChild>
              <Link href="/business">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux business
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/business">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold">
                {business.name.charAt(0).toUpperCase()}
              </div>
              {business.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {businessTypeLabels[business.type]}
              </Badge>
              {business.category && (
                <Badge variant="secondary">{business.category}</Badge>
              )}
              {!business.isActive && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  Inactif
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditForm(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="destructive" onClick={handleDeleteBusiness}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Ventes totales</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatPrice(stats?.totalRevenue || business.totalSales || 0, business.currency)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Commandes</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {stats?.totalOrders || business._count?.orders || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-muted-foreground">Produits</span>
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {stats?.totalProducts || business._count?.products || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">Clients</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {stats?.totalCustomers || business._count?.customers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      {business.address || 'Non renseignée'}
                    </p>
                    {business.region && (
                      <p className="text-sm text-muted-foreground">
                        {business.region}{business.prefecture ? `, ${business.prefecture}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">{business.phone}</p>
                    {business.phone2 && (
                      <p className="text-sm text-muted-foreground">{business.phone2}</p>
                    )}
                  </div>
                </div>

                {business.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{business.email}</p>
                    </div>
                  </div>
                )}

                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Site web</p>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Horaires</span>
                  </div>
                  <Badge variant={business.isOpen24h ? 'default' : 'secondary'}>
                    {business.isOpen24h ? '24h/24' : 'Horaires fixes'}
                  </Badge>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>Moyens de paiement</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.acceptCash && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Espèces
                      </Badge>
                    )}
                    {business.acceptMobileMoney && (
                      <>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Orange Money
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          MTN Money
                        </Badge>
                      </>
                    )}
                    {business.acceptCard && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Carte bancaire
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span>Informations légales</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {business.nif && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">NIF:</span>
                        <span className="font-mono">{business.nif}</span>
                      </div>
                    )}
                    {business.rccm && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RCCM:</span>
                        <span className="font-mono">{business.rccm}</span>
                      </div>
                    )}
                    {!business.nif && !business.rccm && (
                      <p className="text-muted-foreground">Non renseignées</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <ProductTable
            products={products}
            loading={false}
          />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <OrderTable
            orders={orders}
            onMarkDelivered={handleMarkOrderDelivered}
            loading={false}
          />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertes</CardTitle>
                <CardDescription>Points d&apos;attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.lowStockProducts && stats.lowStockProducts > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Package className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">Stock bas</p>
                      <p className="text-sm text-amber-700">
                        {stats.lowStockProducts} produit(s) nécessitent un réapprovisionnement
                      </p>
                    </div>
                  </div>
                ) : null}
                
                {stats?.pendingOrders && stats.pendingOrders > 0 ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Commandes en attente</p>
                      <p className="text-sm text-blue-700">
                        {stats.pendingOrders} commande(s) à traiter
                      </p>
                    </div>
                  </div>
                ) : null}

                {!stats?.lowStockProducts && !stats?.pendingOrders && (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune alerte pour le moment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
                <CardDescription>Statistiques de vente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ventes totales</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(stats?.totalRevenue || 0, business.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Commandes</span>
                    <span className="text-xl font-bold">{stats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Panier moyen</span>
                    <span className="text-xl font-bold">
                      {formatPrice(
                        (stats?.totalRevenue || 0) / Math.max(stats?.totalOrders || 1, 1),
                        business.currency
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Form */}
      <BusinessForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditBusiness}
        initialData={business ? {
          ...business,
          phone2: business.phone2 ?? undefined,
          email: business.email ?? undefined,
          website: business.website ?? undefined,
          region: business.region ?? undefined,
          prefecture: business.prefecture ?? undefined,
          address: business.address ?? undefined,
          category: business.category ?? undefined,
          nif: business.nif ?? undefined,
          rccm: business.rccm ?? undefined,
        } as Partial<BusinessFormData> : undefined}
        mode="edit"
      />
    </div>
  );
}
