'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchX, ArrowLeft, Home, LogIn, Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const availablePages = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Students', href: '/students' },
  { label: 'Teachers', href: '/teachers' },
  { label: 'Staff', href: '/staff' },
  { label: 'Parents', href: '/parents' },
  { label: 'Classes', href: '/classes' },
  { label: 'Subjects', href: '/subjects' },
  { label: 'Timetable', href: '/timetable' },
  { label: 'Attendance', href: '/attendance' },
  { label: 'Examinations', href: '/examinations' },
  { label: 'Results', href: '/results' },
  { label: 'Fees', href: '/fees' },
  { label: 'Finance', href: '/finance' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Library', href: '/library' },
  { label: 'Transport', href: '/transport' },
  { label: 'Hostel', href: '/hostel' },
  { label: 'Clinic', href: '/clinic' },
  { label: 'Communication', href: '/communication' },
  { label: 'Reports', href: '/reports' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Settings', href: '/settings' },
];

export default function NotFoundPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredPages = useMemo(
    () =>
      searchQuery
        ? availablePages.filter((p) =>
            p.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [],
    [searchQuery]
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="absolute inset-0 bg-grid-gray-900/[0.02] dark:bg-grid-gray-100/[0.02]" />

      <div className="relative w-full max-w-lg">
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
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search available pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && filteredPages.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredPages.slice(0, 6).map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {page.label}
                  </Link>
                ))}
                {filteredPages.length > 6 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground border-t border-gray-100 dark:border-gray-800">
                    +{filteredPages.length - 6} more results
                  </div>
                )}
              </div>
            )}
            {searchQuery && filteredPages.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 text-sm text-muted-foreground text-center">
                No pages found
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto gap-2 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>

            {!loading && user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  Return to Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
