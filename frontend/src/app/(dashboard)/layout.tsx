'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

const roleRoutes: Record<string, string> = {
  SUPER_ADMIN: '/dashboard',
  SCHOOL_OWNER: '/dashboard',
  PRINCIPAL: '/dashboard',
  VICE_PRINCIPAL: '/dashboard',
  TEACHER: '/dashboard',
  CLASS_TEACHER: '/dashboard',
  STUDENT: '/dashboard',
  PARENT: '/dashboard',
  ACCOUNTANT: '/finance',
  LIBRARIAN: '/library',
  HOSTEL_MANAGER: '/hostel',
  NURSE: '/clinic',
  RECEPTIONIST: '/students',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    if (!loading && user) {
      const target = roleRoutes[user.role];
      if (target && window.location.pathname === '/dashboard') {
        router.push(target);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
