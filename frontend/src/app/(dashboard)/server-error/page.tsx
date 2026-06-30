'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 border border-gray-200 dark:border-gray-800 p-8 sm:p-10 text-center transition-all duration-300 hover:shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-3">
            500
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Server Error
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Something went wrong on our end. Please try again later or contact
            support if the issue persists.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleRetry}
              className="w-full sm:w-auto gap-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full gap-2">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
