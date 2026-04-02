'use client';

import { useState } from 'react';
import { WalletDashboard } from '@/components/wallet/wallet-dashboard';
import { PaymentForm } from '@/components/wallet/payment-form';
import { PaymentFormProps } from '@/components/wallet/payment-form';

export default function WalletPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');

  const handleDeposit = () => {
    setPaymentType('deposit');
    setShowPaymentForm(true);
  };

  const handleWithdraw = () => {
    setPaymentType('withdraw');
    setShowPaymentForm(true);
  };

  const handleTransfer = () => {
    setPaymentType('transfer');
    setShowPaymentForm(true);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Portefeuille</h1>
        <p className="text-muted-foreground">
          Gérez votre solde et effectuez des transactions Mobile Money
        </p>
      </div>

      <WalletDashboard
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onTransfer={handleTransfer}
      />

      <PaymentForm
        type={paymentType}
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        onSuccess={(reference) => {
          console.log('Transaction successful:', reference);
          // Could refresh wallet data here
        }}
      />
    </div>
  );
}
