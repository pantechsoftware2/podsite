import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 });
    }

    try {
        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID;
        const token = process.env.VERCEL_TOKEN;

        // Fail closed when the domain integration is not configured.
        if (!projectId || !token) {
            console.warn('Vercel credentials missing. Domain verification is disabled.');
            return NextResponse.json({
                verified: false,
                error: 'Domain verification is not configured on this deployment.',
            }, { status: 503 });
        }

        const fetchUrl = teamId
            ? `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`
            : `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;

        const res = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ verified: false, error: 'Failed to verify domain with Vercel' });
        }

        const data = await res.json();
        
        // Vercel returns verified: true when DNS is configured correctly
        if (data.verified) {
            return NextResponse.json({ verified: true });
        } else {
            return NextResponse.json({ verified: false });
        }
    } catch (e: unknown) {
        console.error('Domain Verification Error:', e);
        return NextResponse.json({
            verified: false,
            error: e instanceof Error ? e.message : 'Domain verification failed',
        });
    }
}
