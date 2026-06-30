'use client';

import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-gray-100/[0.02]" />

      <div className="relative w-full max-w-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 border border-gray-200 dark:border-gray-800 p-8 sm:p-10 text-center transition-all duration-300 hover:shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
            <Wrench className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-3">
            Under Maintenance
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            We&apos;re working on improving the system
          </p>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            We apologize for the inconvenience. Our team is hard at work making
            things better. Please check back soon.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expected completion: Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
