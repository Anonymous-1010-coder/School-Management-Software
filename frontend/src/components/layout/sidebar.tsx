'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  UserCheck,
  BookOpen,
  BookType,
  CalendarRange,
  ClipboardCheck,
  CalendarCheck,
  Wallet,
  Receipt,
  Library,
  Building2,
  Stethoscope,
  Bus,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  ClipboardList,
  Notebook,
  BookMarked,
  FileText,
  Megaphone,
  ScrollText,
  ServerCrash,
  type LucideIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User } from '@/contexts/auth-context';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  children?: NavItem[];
}

const allNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'RECEPTIONIST', 'NURSE', 'HOSTEL_MANAGER'] },
  {
    title: 'Students', href: '/students', icon: Users,
    roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'RECEPTIONIST'],
    children: [
      { title: 'All Students', href: '/students', icon: Users },
      { title: 'Admissions', href: '/admissions', icon: UserPlus, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'] },
      { title: 'Parents', href: '/parents', icon: UserCheck },
    ],
  },
  {
    title: 'Staff', href: '/staff', icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    children: [
      { title: 'All Staff', href: '/staff', icon: GraduationCap },
      { title: 'Teachers', href: '/teachers', icon: BookType },
      { title: 'User Management', href: '/users', icon: Shield },
    ],
  },
    {
      title: 'Academic', href: '/academic', icon: BookOpen,
      roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT'],
      children: [
        { title: 'Overview', href: '/academic', icon: BookOpen },
        { title: 'Classes', href: '/classes', icon: CalendarRange },
        { title: 'Arms', href: '/arms', icon: Users },
        { title: 'Subjects', href: '/subjects', icon: BookType },
        { title: 'Timetable', href: '/timetable', icon: ClipboardList },
        { title: 'Lesson Notes', href: '/lesson-notes', icon: Notebook, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'] },
        { title: 'Homework', href: '/homework', icon: BookMarked, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT'] },
        { title: 'Examinations', href: '/examinations', icon: ClipboardCheck },
        { title: 'Results', href: '/results', icon: FileSpreadsheet },
      ],
    },
  { title: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'] },
  { title: 'Learning Resources', href: '/learning-resources', icon: FileText, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT'] },
  { title: 'Notifications', href: '/notifications', icon: Megaphone, roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'RECEPTIONIST', 'NURSE', 'HOSTEL_MANAGER'] },
  { title: 'Report Cards', href: '/report-cards', icon: ScrollText, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT', 'PARENT'] },
  { title: 'Transcript', href: '/transcript', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'STUDENT', 'PARENT'] },
  {
    title: 'Finance', href: '/finance', icon: Wallet,
    roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'ACCOUNTANT'],
    children: [
      { title: 'Overview', href: '/finance', icon: Wallet },
      { title: 'Fees', href: '/fees', icon: Receipt },
    ],
  },
  { title: 'Library', href: '/library', icon: Library, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'TEACHER', 'STUDENT'] },
  { title: 'Hostel', href: '/hostel', icon: Building2, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOSTEL_MANAGER'] },
  { title: 'Clinic', href: '/clinic', icon: Stethoscope, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'NURSE'] },
  { title: 'Transport', href: '/transport', icon: Bus, roles: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { title: 'Inventory', href: '/inventory', icon: Package, roles: ['SUPER_ADMIN', 'PRINCIPAL'] },
  { title: 'Communication', href: '/communication', icon: MessageSquare, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'] },
  { title: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ACCOUNTANT'] },
];

const bottomItems: NavItem[] = [
  { title: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN', 'RECEPTIONIST', 'NURSE', 'HOSTEL_MANAGER', 'VICE_PRINCIPAL', 'CLASS_TEACHER'] },
];

export function Sidebar({ collapsed, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const navItems = useMemo(() => {
    const filterByRole = (items: NavItem[]): NavItem[] =>
      items.filter(item => !item.roles || (user && item.roles.includes(user.role)))
        .map(item => ({
          ...item,
          children: item.children ? filterByRole(item.children) : undefined,
        }));

    return filterByRole(allNavItems);
  }, [user]);

  const filteredBottom = useMemo(() =>
    bottomItems.filter(item => !item.roles || (user && item.roles.includes(user.role))),
    [user]
  );

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const hasActiveChild = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child.href));
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const childActive = hasActiveChild(item);
    const isExpanded = expandedMenus[item.title] ?? childActive;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href}>
        <Link
          href={hasChildren ? '#' : item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleMenu(item.title);
            }
          }}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active && !hasChildren
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2',
            depth > 0 && 'pl-8'
          )}
          title={collapsed ? item.title : undefined}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {hasChildren && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                />
              )}
            </>
          )}
        </Link>
        {hasChildren && !collapsed && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            <span className="font-semibold text-sm">SchoolMS</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        {filteredBottom.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: User | null;
}
