'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  ShoppingCart,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: 'shop' | 'restaurant' | 'service' | 'wholesale' | 'manufacturer';
  phone: string;
  phone2?: string | null;
  email?: string | null;
  region?: string | null;
  prefecture?: string | null;
  address?: string | null;
  category?: string | null;
  isActive: boolean;
  currency: string;
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

interface BusinessCardProps {
  business: Business;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const businessTypeLabels: Record<string, string> = {
  shop: 'Boutique',
  restaurant: 'Restaurant',
  service: 'Services',
  wholesale: 'Grossiste',
  manufacturer: 'Fabricant',
};

const businessTypeColors: Record<string, string> = {
  shop: 'bg-amber-100 text-amber-800 border-amber-200',
  restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
  service: 'bg-blue-100 text-blue-800 border-blue-200',
  wholesale: 'bg-purple-100 text-purple-800 border-purple-200',
  manufacturer: 'bg-green-100 text-green-800 border-green-200',
};

export function BusinessCard({ business, onEdit, onDelete }: BusinessCardProps) {
  const stats = [
    {
      label: 'Produits',
      value: business._count?.products || 0,
      icon: Package,
      color: 'text-green-600',
    },
    {
      label: 'Commandes',
      value: business._count?.orders || 0,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      label: 'Clients',
      value: business._count?.customers || 0,
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-green-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg">
              {business.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{business.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={businessTypeColors[business.type]}>
                  {businessTypeLabels[business.type]}
                </Badge>
                {!business.isActive && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Inactif
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/business/${business.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir les détails
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(business.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(business.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {business.region && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">
                {business.region}{business.prefecture ? `, ${business.prefecture}` : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{business.phone}</span>
          </div>
          {business.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="line-clamp-1">{business.email}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/50">
              <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
              <div className="text-lg font-semibold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default BusinessCard;
