'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton - hidden on mobile */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex-1 space-y-1 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
          <div className="pt-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="mb-1 h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar skeleton */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Skeleton className="h-8 w-8 rounded-md md:hidden" />
          <div className="hidden flex-1 md:block" />
          <Skeleton className="hidden h-9 w-64 rounded-md md:block" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>

        {/* Content area */}
        <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart and recent activity */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Chart skeleton */}
            <div className="rounded-lg border bg-card p-6 shadow-sm lg:col-span-4">
              <Skeleton className="mb-4 h-5 w-32" />
              <Skeleton className="h-64 w-full rounded-md" />
            </div>

            {/* Recent activity skeleton */}
            <div className="rounded-lg border bg-card p-6 shadow-sm lg:col-span-3">
              <Skeleton className="mb-4 h-5 w-36" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex gap-4 border-b pb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                  ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 py-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
