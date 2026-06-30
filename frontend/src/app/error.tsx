'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="relative w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 sm:p-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-3">500</h1>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Internal Server Error</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Something went wrong on our end. Please try again or contact support if the issue persists.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" onClick={() => reset()} className="w-full sm:w-auto gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button className="w-full gap-2"><Home className="h-4 w-4" /> Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
