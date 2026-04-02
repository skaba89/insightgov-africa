'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Erreur critique</CardTitle>
            <CardDescription>
              Une erreur inattendue s'est produite. Notre équipe a été notifiée.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg overflow-auto">
                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={reset} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}
