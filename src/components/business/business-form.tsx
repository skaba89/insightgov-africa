'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2 } from 'lucide-react';

export interface BusinessFormData {
  name: string;
  type: 'shop' | 'restaurant' | 'service' | 'wholesale' | 'manufacturer';
  phone: string;
  phone2?: string;
  email?: string;
  website?: string;
  region?: string;
  prefecture?: string;
  address?: string;
  category?: string;
  nif?: string;
  rccm?: string;
  currency: string;
  acceptMobileMoney: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  isOpen24h: boolean;
}

interface BusinessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BusinessFormData) => Promise<void>;
  initialData?: Partial<BusinessFormData>;
  mode: 'create' | 'edit';
}

const businessTypes = [
  { value: 'shop', label: 'Boutique' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'service', label: 'Services' },
  { value: 'wholesale', label: 'Grossiste' },
  { value: 'manufacturer', label: 'Fabricant' },
];

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

const currencies = [
  { value: 'GNF', label: 'Franc Guinéen (GNF)' },
  { value: 'USD', label: 'Dollar US (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

export function BusinessForm({ isOpen, onClose, onSubmit, initialData, mode }: BusinessFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'shop',
    phone: initialData?.phone || '',
    phone2: initialData?.phone2 || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    region: initialData?.region || '',
    prefecture: initialData?.prefecture || '',
    address: initialData?.address || '',
    category: initialData?.category || '',
    nif: initialData?.nif || '',
    rccm: initialData?.rccm || '',
    currency: initialData?.currency || 'GNF',
    acceptMobileMoney: initialData?.acceptMobileMoney ?? true,
    acceptCash: initialData?.acceptCash ?? true,
    acceptCard: initialData?.acceptCard ?? false,
    isOpen24h: initialData?.isOpen24h ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof BusinessFormData>(field: K, value: BusinessFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            {mode === 'create' ? 'Créer un nouveau business' : 'Modifier le business'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Remplissez les informations pour créer votre business'
              : 'Modifiez les informations de votre business'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Informations générales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du business *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Ma Boutique"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type de business *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField('type', value as BusinessFormData['type'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="Ex: Alimentation, Électronique..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => updateField('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone principal *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="Ex: 624 00 00 00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone2">Téléphone secondaire</Label>
                <Input
                  id="phone2"
                  value={formData.phone2}
                  onChange={(e) => updateField('phone2', e.target.value)}
                  placeholder="Ex: 664 00 00 00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contact@business.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://www.business.com"
                />
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Localisation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => updateField('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {guineaRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prefecture">Préfecture</Label>
                <Input
                  id="prefecture"
                  value={formData.prefecture}
                  onChange={(e) => updateField('prefecture', e.target.value)}
                  placeholder="Ex: Dixinn"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Adresse complète"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Informations légales */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Informations légales (optionnel)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nif">NIF (Numéro d'Identification Fiscale)</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) => updateField('nif', e.target.value)}
                  placeholder="Ex: NIF123456789"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rccm">RCCM</Label>
                <Input
                  id="rccm"
                  value={formData.rccm}
                  onChange={(e) => updateField('rccm', e.target.value)}
                  placeholder="Ex: RCCM123456789"
                />
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Configuration
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="acceptMobileMoney" className="font-medium">
                    Mobile Money
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accepter Orange/MTN Money
                  </p>
                </div>
                <Switch
                  id="acceptMobileMoney"
                  checked={formData.acceptMobileMoney}
                  onCheckedChange={(checked) => updateField('acceptMobileMoney', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="acceptCash" className="font-medium">
                    Espèces
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accepter les paiements en espèces
                  </p>
                </div>
                <Switch
                  id="acceptCash"
                  checked={formData.acceptCash}
                  onCheckedChange={(checked) => updateField('acceptCash', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="acceptCard" className="font-medium">
                    Carte bancaire
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Accepter les cartes
                  </p>
                </div>
                <Switch
                  id="acceptCard"
                  checked={formData.acceptCard}
                  onCheckedChange={(checked) => updateField('acceptCard', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="isOpen24h" className="font-medium">
                    Ouvert 24h/24
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Service continu
                  </p>
                </div>
                <Switch
                  id="isOpen24h"
                  checked={formData.isOpen24h}
                  onCheckedChange={(checked) => updateField('isOpen24h', checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Créer le business' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BusinessForm;
