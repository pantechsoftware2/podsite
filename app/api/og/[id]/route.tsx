// app/api/og/[id]/route.tsx
import { ImageResponse } from 'next/og';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'edge';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const episodeTitle = searchParams.get('title');

    const supabase = await createSupabaseServerClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const { data: podcast } = await supabase
        .from('podcasts')
        .select('title, theme_config')
        .or(isUuid ? `id.eq.${id},custom_domain.eq.${id}` : `custom_domain.eq.${id}`)
        .maybeSingle();

    if (!podcast) {
        return new Response('Podcast not found', { status: 404 });
    }

    // Extract image from theme_config
    const themeConfig = (podcast.theme_config as any) || {};
    const podcastImage = themeConfig.imageUrl || null;
    const guestImage = searchParams.get('guestImage'); // Optional guest image

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#050505',
                    backgroundImage: 'radial-gradient(circle at 0% 0%, #38bdf8 0%, transparent 50%), radial-gradient(circle at 100% 100%, #0ea5e9 0%, transparent 50%), radial-gradient(circle at 50% 50%, #1e293b 0%, transparent 100%)',
                    padding: '60px',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative Grid Overlay */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div style={{ display: 'flex', gap: '60px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', position: 'relative' }}>
                        {podcastImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={podcastImage}
                                alt={podcast.title}
                                style={{
                                    width: '340px',
                                    height: '340px',
                                    borderRadius: '40px',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                                    border: '4px solid rgba(255,255,255,0.1)',
                                }}
                            />
                        )}
                        {guestImage && (
                            <img
                                src={guestImage}
                                alt="Guest"
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '100px',
                                    position: 'absolute',
                                    bottom: '-30px',
                                    right: '-30px',
                                    border: '8px solid #050505',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                }}
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '600px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
                            <div style={{ width: '40px', height: '4px', backgroundColor: '#0ea5e9', borderRadius: '2px' }} />
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '6px' }}>
                                New Episode
                            </div>
                        </div>

                        <div style={{
                            fontSize: '72px',
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: '1.05',
                            marginBottom: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            letterSpacing: '-2px',
                        }}>
                            {episodeTitle || podcast.title}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#64748b' }}>
                                {podcast.title}
                            </div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#475569' }} />
                            <div style={{ fontSize: '24px', color: '#475569', fontWeight: 'bold' }}>
                                podsite.studio
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Bottom Watermark */}
                <div style={{ position: 'absolute', bottom: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Built with PodSite Studio
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
