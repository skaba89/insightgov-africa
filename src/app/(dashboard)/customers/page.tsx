'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Eye,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  User,
  Loader2,
} from 'lucide-react';

interface Customer {
  id: string;
  businessId: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  address?: string | null;
  region?: string | null;
  prefecture?: string | null;
  segment: 'new' | 'regular' | 'vip' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  createdAt: string;
  business?: {
    id: string;
    name: string;
  };
  _count?: {
    orders: number;
  };
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-GN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' GNF';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-GN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getSegmentBadge = (segment: Customer['segment']) => {
  const config: Record<Customer['segment'], { label: string; className: string }> = {
    new: { 
      label: 'Nouveau', 
      className: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    regular: { 
      label: 'Régulier', 
      className: 'bg-green-100 text-green-800 border-green-200' 
    },
    vip: { 
      label: 'VIP', 
      className: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
    inactive: { 
      label: 'Inactif', 
      className: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
  };

  const { label, className } = config[segment];
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers?limit=100');
      const data = await res.json();
      
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => c.segment === 'new').length;
  const regularCustomers = customers.filter((c) => c.segment === 'regular').length;
  const vipCustomers = customers.filter((c) => c.segment === 'vip').length;

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = !search ||
      customer.name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search) ||
      customer.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;
    
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-green-600" />
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre base de clients
          </p>
        </div>
        
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {totalCustomers}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Nouveaux</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {newCustomers}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Réguliers</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {regularCustomers}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-muted-foreground">VIP</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {vipCustomers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Liste des clients ({filteredCustomers.length})
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, téléphone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Segment Filter */}
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="new">Nouveaux</SelectItem>
                  <SelectItem value="regular">Réguliers</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">
                Aucun client trouvé
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || segmentFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Les clients apparaîtront ici'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-center">Commandes</TableHead>
                    <TableHead className="text-right">Total acheté</TableHead>
                    <TableHead>Dernière commande</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold">
                            {(customer.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name || 'Client'}</p>
                            {customer.region && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {customer.region}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </p>
                          {customer.email && (
                            <p className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                      <TableCell className="text-center font-medium">
                        {customer._count?.orders || customer.totalOrders || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatPrice(customer.totalSpent)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.lastOrderAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(customer.lastOrderAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir profil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Envoyer SMS
                            </DropdownMenuItem>
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
    </div>
  );
}
