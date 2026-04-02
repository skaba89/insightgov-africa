/**
 * InsightGov Africa - Auth Callback
 * ==================================
 * Page de redirection après authentification.
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get redirect URL or default to dashboard
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    // Redirect immediately
    router.push(redirectTo);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-gray-600 dark:text-gray-400">
        Redirection en cours...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Chargement...
          </p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
