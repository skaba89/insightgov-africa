'use client';

// =============================================================================
// InsightGov Africa - Wallet Dashboard Component
// Tableau de bord du portefeuille électronique
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  CreditCard,
  Smartphone,
  RefreshCw,
  DollarSign,
  Euro,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface WalletBalance {
  gnf: number;
  usd: number;
  eur: number;
}

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  fee: number;
  total: number;
  type: string;
  status: string;
  description?: string;
  recipientPhone?: string;
  recipientName?: string;
  provider?: string;
  createdAt: string;
  processedAt?: string;
}

interface WalletDashboardProps {
  userId?: string;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
}

// Format number with thousand separators
function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('fr-GN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(amount);

  switch (currency) {
    case 'GNF':
      return `${formatted} GNF`;
    case 'USD':
      return `$${formatter.format(amount)}`;
    case 'EUR':
      return `${formatted} €`;
    default:
      return formatted;
  }
}

// Get transaction icon
function getTransactionIcon(type: string) {
  switch (type) {
    case 'deposit':
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    case 'withdraw':
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case 'transfer':
      return <Send className="h-4 w-4 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    case 'airtime':
      return <Smartphone className="h-4 w-4 text-orange-500" />;
    case 'refund':
      return <RefreshCw className="h-4 w-4 text-teal-500" />;
    default:
      return <Wallet className="h-4 w-4 text-gray-500" />;
  }
}

// Get status badge
function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Succès</Badge>;
    case 'pending':
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    case 'processing':
      return <Badge variant="outline"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Traitement</Badge>;
    case 'failed':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échec</Badge>;
    case 'cancelled':
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Annulé</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Get provider badge
function getProviderBadge(provider?: string) {
  switch (provider) {
    case 'orange':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Orange Money</Badge>;
    case 'mtn':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">MTN Money</Badge>;
    case 'bank':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Banque</Badge>;
    case 'cash':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Espèces</Badge>;
    default:
      return null;
  }
}

export function WalletDashboard({ onDeposit, onWithdraw, onTransfer }: WalletDashboardProps) {
  const [balance, setBalance] = useState<WalletBalance>({ gnf: 1500000, usd: 165, eur: 150 });
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      reference: 'DEP-1704067200000-a1b2c3d4',
      amount: 500000,
      currency: 'GNF',
      fee: 0,
      total: 500000,
      type: 'deposit',
      status: 'success',
      description: 'Dépôt Orange Money',
      provider: 'orange',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      reference: 'TRF-1703980800000-e5f6g7h8',
      amount: 75000,
      currency: 'GNF',
      fee: 375,
      total: 75375,
      type: 'transfer',
      status: 'success',
      description: 'Transfert vers 624 00 00 00',
      recipientPhone: '+224 624 00 00 00',
      provider: 'orange',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      reference: 'WTD-1703894400000-i9j0k1l2',
      amount: 100000,
      currency: 'GNF',
      fee: 1000,
      total: 101000,
      type: 'withdraw',
      status: 'pending',
      description: 'Retrait MTN Money',
      provider: 'mtn',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [limits] = useState({ daily: 1000000, monthly: 10000000, currentDaily: 175000, currentMonthly: 675000 });

  // Fetch wallet data
  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/wallet');
      if (res.ok) {
        const data = await res.json();
        if (data.balance) setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate usage percentage
  const dailyUsagePercent = (limits.currentDaily / limits.daily) * 100;
  const monthlyUsagePercent = (limits.currentMonthly / limits.monthly) * 100;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GNF Balance */}
        <Card className="relative overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-500" />
              Franc Guinéen (GNF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatAmount(balance.gnf, 'GNF')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solde principal
            </p>
          </CardContent>
        </Card>

        {/* USD Balance */}
        <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Dollar US (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatAmount(balance.usd, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ~{(balance.usd * 9090.91).toLocaleString('fr-GN')} GNF
            </p>
          </CardContent>
        </Card>

        {/* EUR Balance */}
        <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Euro className="h-4 w-4 text-purple-500" />
              Euro (EUR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatAmount(balance.eur, 'EUR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ~{(balance.eur * 10000).toLocaleString('fr-GN')} GNF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
            <CardDescription>Gérez votre portefeuille</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                onClick={onDeposit}
              >
                <ArrowDownLeft className="h-6 w-6 text-green-500" />
                <span className="text-sm font-medium">Dépôt</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 hover:bg-red-50 hover:border-red-300"
                onClick={onWithdraw}
              >
                <ArrowUpRight className="h-6 w-6 text-red-500" />
                <span className="text-sm font-medium">Retrait</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={onTransfer}
              >
                <Send className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-medium">Transfert</span>
              </Button>
            </div>

            {/* Mobile Money Options */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Paiement Mobile Money</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3 hover:bg-orange-50 hover:border-orange-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">OM</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Orange Money</p>
                      <p className="text-xs text-muted-foreground">Dépôt instantané</p>
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 hover:bg-yellow-50 hover:border-yellow-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MTN</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">MTN Money</p>
                      <p className="text-xs text-muted-foreground">Dépôt instantané</p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Limites d&apos;utilisation</CardTitle>
            <CardDescription>Plafonds journaliers et mensuels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limite journalière</span>
                <span className="font-medium">
                  {formatAmount(limits.currentDaily, 'GNF')} / {formatAmount(limits.daily, 'GNF')}
                </span>
              </div>
              <Progress value={dailyUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Reste: {formatAmount(limits.daily - limits.currentDaily, 'GNF')}
              </p>
            </div>

            {/* Monthly Limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Limite mensuelle</span>
                <span className="font-medium">
                  {formatAmount(limits.currentMonthly, 'GNF')} / {formatAmount(limits.monthly, 'GNF')}
                </span>
              </div>
              <Progress value={monthlyUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Reste: {formatAmount(limits.monthly - limits.currentMonthly, 'GNF')}
              </p>
            </div>

            {/* KYC Level */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Niveau KYC</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Basique</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Augmentez vos limites en vérifiant votre identité
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                Vérifier mon identité →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Historique des transactions</CardTitle>
              <CardDescription>Vos dernières opérations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchWalletData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">Aucune transaction</p>
              <p className="text-sm text-muted-foreground mt-1">
                Effectuez votre première opération pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-muted">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(tx.createdAt).toLocaleDateString('fr-GN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline font-mono text-xs">{tx.reference.slice(0, 20)}...</span>
                        {tx.provider && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            {getProviderBadge(tx.provider)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Frais: {formatAmount(tx.fee, tx.currency)}
                      </p>
                    )}
                    <div className="mt-1">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
              ))}

              {transactions.length >= 10 && (
                <Button variant="outline" className="w-full mt-4">
                  Voir toutes les transactions
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletDashboard;
