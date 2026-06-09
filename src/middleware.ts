import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/profile'];
// Routes that require admin role
const adminRoutes = ['/admin'];
// Routes only accessible when NOT logged in
const authRoutes = ['/auth'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Get the JWT token from the request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;
    const userRole = (token?.role as string) || 'customer';

    // --- Auth routes: redirect to /profile if already logged in ---
    if (authRoutes.some(route => pathname.startsWith(route))) {
        if (isAuthenticated) {
            const url = request.nextUrl.clone();
            url.pathname = '/profile';
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // --- Protected routes: redirect to /auth if not logged in ---
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // --- Admin routes: check auth + admin role ---
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }

        if (userRole !== 'admin') {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
