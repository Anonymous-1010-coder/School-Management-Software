'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 border border-gray-200 dark:border-gray-800 p-8 sm:p-10 text-center transition-all duration-300 hover:shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
            <SearchX className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-3">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist within the dashboard.
            It may have been removed or the link might be broken.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto gap-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
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
