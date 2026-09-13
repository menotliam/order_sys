import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Route gate for the staff and admin areas.
 *
 * This is the first of two layers, not the only one: it keeps unauthenticated
 * browsers out of the pages. The Server Actions those pages call enforce their
 * own permissions in src/lib/auth.ts, because an action can be invoked without
 * ever loading its page.
 */
const STAFF_PREFIXES = ['/orders', '/menu-manage', '/tables'];
const ADMIN_PREFIXES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsStaff = STAFF_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() revalidates the token with Supabase rather than trusting the
  // cookie's contents, and refreshes it when needed. Must run on every
  // request or sessions expire mid-shift.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!needsStaff && !needsAdmin) return response;

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !profile.is_active || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/orders', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
