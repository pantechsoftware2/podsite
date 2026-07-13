// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get('host') || 'localhost:3000';
    const isSeoMetadataFile = pathname === '/sitemap.xml' || pathname === '/robots.txt';

    // 1. Domain Routing Logic
    const rootDomain = hostname.split(':')[0];
    const isMainApp =
        rootDomain === 'localhost' ||
        rootDomain === '127.0.0.1' ||
        rootDomain === '[::1]' ||
        hostname === process.env.NEXT_PUBLIC_APP_DOMAIN ||
        hostname === 'app.podsitekiller.com' ||
        hostname === 'makemypodcastsite.com' ||
        hostname === 'www.makemypodcastsite.com' ||
        hostname.includes('vercel.app');

    const isMainAppAssetOrApi =
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        (pathname.includes('.') && !isSeoMetadataFile);

    // Supabase falls back to the configured Site URL when a requested redirect
    // URL is not allow-listed. Preserve confirmation/recovery codes that land
    // at the app root and send them through the normal PKCE callback handler.
    if (isMainApp && pathname === '/' && request.nextUrl.searchParams.has('code')) {
        const callbackUrl = request.nextUrl.clone();
        callbackUrl.pathname = '/auth/callback';
        if (!callbackUrl.searchParams.has('next')) {
            callbackUrl.searchParams.set('next', '/dashboard');
        }
        return NextResponse.redirect(callbackUrl);
    }

    // If it's a custom domain, rewrite ALL non-asset traffic to the dynamic /[subdomain] route
    if (!isMainApp && !isMainAppAssetOrApi) {
        const cleanHostname = hostname.replace('www.', '');
        console.log(`Middleware - Rewriting custom domain: ${cleanHostname} -> /[subdomain]${pathname}`);
        return NextResponse.rewrite(new URL(`/${cleanHostname}${pathname === '/' ? '' : pathname}`, request.url));
    }

    // Skip static assets and internal requests for the rest of the logic
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        (pathname.includes('.') && !isSeoMetadataFile)
    ) {
        return NextResponse.next();
    }

    // Auth middleware temporarily disabled: allow the app and dashboard to open directly.
    // const isAppRoot = pathname === '/';
    // const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/podcasts');
    // const supabaseConfig = getPublicSupabaseConfigStatus();
    //
    // if (!supabaseConfig.ok) {
    //     logSupabaseConfigIssues('middleware.ts');
    //
    //     if (isAppRoot || isDashboard) {
    //         const message = `Supabase is not configured. Missing: ${supabaseConfig.missing.join(', ')}`;
    //         return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
    //     }
    //
    //     return NextResponse.next();
    // }
    //
    // const pendingCookies: { name: string; value: string; options?: { path?: string; maxAge?: number } & Record<string, unknown> }[] = [];
    // let response = NextResponse.next({
    //     request: {
    //         headers: request.headers,
    //     },
    // });
    //
    // const supabase = createServerClient(
    //     supabaseConfig.url!,
    //     supabaseConfig.anonKey!,
    //     {
    //         cookies: {
    //             getAll() {
    //                 return request.cookies.getAll();
    //             },
    //             setAll(cookiesToSet) {
    //                 pendingCookies.push(...cookiesToSet);
    //                 cookiesToSet.forEach(({ name, value }) => {
    //                     request.cookies.set(name, value);
    //                 });
    //                 const cookieString = request.cookies.getAll()
    //                     .map(c => `${c.name}=${c.value}`)
    //                     .join('; ');
    //
    //                 const newRequestHeaders = new Headers(request.headers);
    //                 newRequestHeaders.set('Cookie', cookieString);
    //
    //                 response = NextResponse.next({
    //                     request: {
    //                         headers: newRequestHeaders,
    //                     },
    //                 });
    //             },
    //         },
    //     },
    // );
    //
    // const { data: { user } } = await supabase.auth.getUser();
    //
    // if (pendingCookies.length > 0) {
    //     pendingCookies.forEach(({ name, value, options }) => {
    //         const cookieStr = [
    //             `${name}=${value}`,
    //             `Path=${options?.path ?? '/'}`,
    //             'SameSite=Lax',
    //             `Max-Age=${options?.maxAge ?? 3600}`,
    //             process.env.NODE_ENV === 'production' ? 'Secure' : '',
    //         ].filter(Boolean).join('; ');
    //         response.headers.append('Set-Cookie', cookieStr);
    //     });
    // }
    //
    // if (user) {
    //     if (isAppRoot || pathname === '/login') {
    //         return NextResponse.redirect(new URL('/dashboard', request.url));
    //     }
    // } else {
    //     if (isAppRoot || isDashboard) {
    //         return NextResponse.redirect(new URL('/login', request.url));
    //     }
    // }
    //
    // return response;

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
