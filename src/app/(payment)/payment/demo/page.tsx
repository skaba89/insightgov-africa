// ============================================
// InsightGov Africa - Page Démo Paiement
// ============================================

'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function DemoPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Simuler un délai de traitement
    const timer = setTimeout(() => {
      router.push('/payment/callback?reference=' + (ref || 'demo') + '&status=success');
    }, 2000);

    return () => clearTimeout(timer);
  }, [ref, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">IG</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">InsightGov</h1>
          <p className="text-sm text-amber-600 font-medium">Africa (Démo)</p>
        </div>
      </motion.div>

      {/* Demo Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl text-center">
          <CardHeader>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Mode Démonstration</CardTitle>
            <CardDescription>
              Paiement simulé - Aucune transaction réelle ne sera effectuée
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-2">⚡ Mode Test Actif</p>
              <p>
                En production, cette page redirigerait vers Paystack pour un paiement réel.
                Pour activer les paiements réels, configurez vos clés Paystack dans le fichier .env
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Traitement du paiement simulé en cours...
            </p>

            <Button
              asChild
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              <a href={`/payment/callback?reference=${ref || 'demo'}&status=success`}>
                Simuler le succès
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-500 max-w-md">
          Pour configurer les paiements réels avec Paystack :
        </p>
        <code className="text-xs bg-gray-100 px-3 py-1 rounded mt-2 inline-block">
          PAYSTACK_SECRET_KEY=sk_live_... <br/>
          PAYSTACK_PUBLIC_KEY=pk_live_...
        </code>
      </motion.div>
    </div>
  );
}

export default function DemoPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    }>
      <DemoPaymentContent />
    </Suspense>
  );
}
