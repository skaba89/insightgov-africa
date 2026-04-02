'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { BusinessCard, Business } from '@/components/business/business-card';
import { BusinessForm, BusinessFormData } from '@/components/business/business-form';

const guineaRegions = [
  'Conakry',
  'Nzérékoré',
  'Kankan',
  'Kindia',
  'Labé',
  'Faranah',
  'Boké',
  'Mamou',
];

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (regionFilter !== 'all') params.append('region', regionFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/business?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setBusinesses(data.data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (formData: BusinessFormData) => {
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        setBusinesses((prev) => [data.data, ...prev]);
        setShowForm(false);
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce business ?')) return;
    
    try {
      const res = await fetch(`/api/business/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  };

  // Filter locally for instant feedback
  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = !search || 
      business.name.toLowerCase().includes(search.toLowerCase()) ||
      business.category?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || business.type === typeFilter;
    const matchesRegion = regionFilter === 'all' || business.region === regionFilter;
    return matchesSearch && matchesType && matchesRegion;
  });

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-green-600" />
            Mes Business
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos commerces et boutiques
          </p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Business
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {businesses.length}
            </div>
            <p className="text-sm text-muted-foreground">Total business</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {businesses.filter((b) => b.isActive).length}
            </div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 border-amber-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">
              {businesses.reduce((acc, b) => acc + (b._count?.products || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Produits</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 border-purple-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {businesses.reduce((acc, b) => acc + (b._count?.orders || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Commandes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="shop">Boutique</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="service">Services</SelectItem>
                <SelectItem value="wholesale">Grossiste</SelectItem>
                <SelectItem value="manufacturer">Fabricant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {guineaRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun business trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== 'all' || regionFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par créer votre premier business'}
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onDelete={handleDeleteBusiness}
            />
          ))}
        </div>
      )}

      {/* Create Business Form */}
      <BusinessForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateBusiness}
        mode="create"
      />
    </div>
  );
}
