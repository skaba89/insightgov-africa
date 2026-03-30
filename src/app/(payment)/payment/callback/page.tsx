// ============================================
// InsightGov Africa - Page Callback Paiement
// ============================================

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const status = searchParams.get('status');

  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setPaymentStatus('failed');
        setMessage('Référence de paiement manquante');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await response.json();

        if (data.success && data.data?.status === 'success') {
          setPaymentStatus('success');
          setMessage('Votre abonnement a été activé avec succès !');

          // Redirection automatique après 3 secondes
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else if (data.data?.status === 'pending') {
          setPaymentStatus('pending');
          setMessage('Paiement en cours de vérification...');
        } else {
          setPaymentStatus('failed');
          setMessage(data.error || 'Le paiement a échoué');
        }
      } catch (error) {
        setPaymentStatus('failed');
        setMessage('Erreur lors de la vérification du paiement');
      } finally {
        setIsLoading(false);
      }
    };

    // Si le statut est déjà dans l'URL (retour Paystack)
    if (status === 'success') {
      setPaymentStatus('success');
      setMessage('Paiement réussi !');
      setIsLoading(false);
      setTimeout(() => router.push('/'), 3000);
    } else if (status === 'failed' || status === 'cancelled') {
      setPaymentStatus('failed');
      setMessage('Le paiement a été annulé ou a échoué');
      setIsLoading(false);
    } else {
      verifyPayment();
    }
  }, [reference, status, router]);

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-emerald-600" />,
          title: 'Paiement réussi !',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-12 h-12 text-red-600" />,
          title: 'Paiement échoué',
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
        };
      case 'pending':
        return {
          icon: <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />,
          title: 'Vérification en cours...',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-600',
        };
      default:
        return {
          icon: <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />,
          title: 'Chargement...',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-400',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">IG</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">InsightGov</h1>
          <p className="text-sm text-emerald-600 font-medium">Africa</p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl text-center">
          <CardHeader>
            <div className={`w-20 h-20 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {isLoading ? <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /> : config.icon}
            </div>
            <CardTitle className="text-xl">{isLoading ? 'Vérification...' : config.title}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {reference && (
              <p className="text-sm text-gray-500">
                Référence : <span className="font-mono">{reference}</span>
              </p>
            )}

            {paymentStatus === 'success' && (
              <p className="text-sm text-gray-500">
                Redirection automatique dans quelques secondes...
              </p>
            )}

            {!isLoading && (
              <div className="flex gap-3">
                {paymentStatus === 'success' ? (
                  <Button
                    asChild
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <a href="/">
                      Accéder à mon espace
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                ) : paymentStatus === 'failed' ? (
                  <>
                    <Button asChild variant="outline" className="flex-1">
                      <a href="/pricing">Réessayer</a>
                    </Button>
                    <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <a href="/">Retour</a>
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Rafraîchir
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Support */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-500">
          Problème avec votre paiement ?{' '}
          <a href="mailto:support@insightgov.africa" className="text-emerald-600 hover:underline">
            Contactez le support
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
