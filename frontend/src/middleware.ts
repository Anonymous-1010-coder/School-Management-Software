import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const authApiPaths = ['/api/auth/login', '/api/auth/register'];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAuthApi = authApiPaths.some(p => pathname.startsWith(p));
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/favicon.ico';

  if (isStatic || isAuthApi) {
    return NextResponse.next();
  }

  if (!token && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      const role = decoded.role as string;

      if (isPublic) {
        const targetRoute = roleRoutes[role] || '/dashboard';
        return NextResponse.redirect(new URL(targetRoute, request.url));
      }

      if (pathname === '/') {
        const targetRoute = roleRoutes[role] || '/dashboard';
        return NextResponse.redirect(new URL(targetRoute, request.url));
      }
    } catch {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
