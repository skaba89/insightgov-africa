'use client';

// =============================================================================
// InsightGov Africa - Payment Form Component
// Formulaire de paiement Mobile Money
// =============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  CreditCard,
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface PaymentFormProps {
  type: 'deposit' | 'withdraw' | 'transfer';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reference: string) => void;
  defaultAmount?: number;
  defaultPhone?: string;
}

// Format phone number for display
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

// Validate Guinea phone number
function isValidGuineaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Guinea numbers: 6XX, 6XX (Orange: 62X, 66X; MTN: 64X, 65X, 66X)
  return cleaned.length === 9 && /^[6-7]\d{8}$/.test(cleaned);
}

// Detect provider from phone number
function detectProvider(phone: string): 'orange' | 'mtn' | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 3) return null;

  const prefix = cleaned.slice(0, 3);
  
  // Orange prefixes in Guinea
  if (['620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '660', '661', '662', '663', '664'].includes(prefix)) {
    return 'orange';
  }
  
  // MTN prefixes in Guinea
  if (['640', '641', '642', '643', '644', '645', '646', '647', '648', '649', '665', '666', '667', '668', '669'].includes(prefix)) {
    return 'mtn';
  }
  
  return null;
}

export function PaymentForm({ type, isOpen, onClose, onSuccess, defaultAmount, defaultPhone }: PaymentFormProps) {
  const [amount, setAmount] = useState(defaultAmount?.toString() || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [provider, setProvider] = useState<'orange' | 'mtn'>('orange');
  const [currency, setCurrency] = useState<'GNF' | 'USD' | 'EUR'>('GNF');
  const [description, setDescription] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Auto-detect provider from phone
  const detectedProvider = detectProvider(phone);
  const currentProvider = detectedProvider || provider;

  // Reset form when opening
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setStep('form');
        setError('');
        setReference('');
        setAmount(defaultAmount?.toString() || '');
        setPhone(defaultPhone || '');
        setPinCode('');
      }, 300);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (type !== 'deposit' && !isValidGuineaPhone(phone)) {
      setError('Numéro de téléphone inval. Format: 6XX XXX XXX');
      return;
    }

    if ((type === 'withdraw' || type === 'transfer') && !pinCode) {
      setError('Veuillez entrer votre code PIN');
      return;
    }

    try {
      setLoading(true);
      setStep('processing');

      const endpoint = type === 'deposit' ? '/api/payments/deposit' : 
                       type === 'withdraw' ? '/api/payments/withdraw' : 
                       '/api/payments/transfer';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          phone: phone.replace(/\D/g, ''),
          provider: currentProvider,
          description,
          pinCode: type !== 'deposit' ? pinCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'opération');
      }

      setReference(data.reference);
      setStep('success');
      onSuccess?.(data.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // Get title and description based on type
  const titles = {
    deposit: 'Dépôt d\'argent',
    withdraw: 'Retrait d\'argent',
    transfer: 'Transfert d\'argent',
  };

  const descriptions = {
    deposit: 'Approvisionnez votre portefeuille via Mobile Money',
    withdraw: 'Retirez de l\'argent vers votre compte Mobile Money',
    transfer: 'Envoyez de l\'argent à un autre utilisateur',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {titles[type]}
          </DialogTitle>
          <DialogDescription>{descriptions[type]}</DialogDescription>
        </DialogHeader>

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-4 py-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-14 pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="outline">{currency}</Badge>
                </div>
              </div>
              
              {/* Quick amounts */}
              <div className="flex gap-2 mt-2">
                {[50000, 100000, 250000, 500000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {quickAmount.toLocaleString('fr-GN')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Devise</Label>
              <RadioGroup
                value={currency}
                onValueChange={(v) => setCurrency(v as 'GNF' | 'USD' | 'EUR')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GNF" id="gnf" />
                  <Label htmlFor="gnf" className="font-normal">GNF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USD" id="usd" />
                  <Label htmlFor="usd" className="font-normal">USD</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EUR" id="eur" />
                  <Label htmlFor="eur" className="font-normal">EUR</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Phone Number (for withdraw/transfer) */}
            {type !== 'deposit' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="h-12"
                />
                {detectedProvider && (
                  <p className="text-sm text-muted-foreground">
                    Opérateur détecté: {detectedProvider === 'orange' ? '🟠 Orange Money' : '🟡 MTN Money'}
                  </p>
                )}
              </div>
            )}

            {/* Provider Selection (for deposit) */}
            {type === 'deposit' && (
              <div className="space-y-2">
                <Label>Opérateur Mobile Money</Label>
                <Tabs value={provider} onValueChange={(v) => setProvider(v as 'orange' | 'mtn')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orange" className="gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      Orange Money
                    </TabsTrigger>
                    <TabsTrigger value="mtn" className="gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      MTN Money
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* PIN Code (for withdraw/transfer) */}
            {(type === 'withdraw' || type === 'transfer') && (
              <div className="space-y-2">
                <Label htmlFor="pin">Code PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-12 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Entrez votre code PIN à 4-6 chiffres pour confirmer
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                placeholder="Ex: Paiement facture électricité"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Save recipient option */}
            {type === 'transfer' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="save"
                  checked={saveRecipient}
                  onCheckedChange={setSaveRecipient}
                />
                <Label htmlFor="save" className="font-normal text-sm">
                  Sauvegarder ce bénéficiaire
                </Label>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {type === 'deposit' && 'Le montant sera crédité instantanément sur votre portefeuille après confirmation.'}
                {type === 'withdraw' && 'Les retraits sont traités en moins de 5 minutes.'}
                {type === 'transfer' && 'Les transferts internes sont gratuits et instantanés.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-lg font-medium">Traitement en cours...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Veuillez confirmer sur votre téléphone
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xl font-semibold text-green-600">
              Opération réussie!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Référence: {reference}
            </p>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-xl font-semibold text-red-600">
              Échec de l&apos;opération
            </p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {(step === 'success' || step === 'error') && (
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentForm;
