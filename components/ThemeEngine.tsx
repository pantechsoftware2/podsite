// components/ThemeEngine.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';

export interface ThemeConfig {
    [key: string]: unknown;
    primaryColor?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    accentColor?: string;
    borderColor?: string;
    fontHeading?: string;
    fontBody?: string;
    cornerRadius?: string; // '0px', '8px', '16px'
    layout?: 'netflix' | 'substack' | 'genz' | 'minimal';
    imageUrl?: string;
    customFontUrl?: string;
    tagline?: string;
    playerMode?: 'auto' | 'audio' | 'video';
    stickyPlayer?: boolean;
    showTimestamps?: boolean;
    hiddenBlocks?: string[];
    // Platform Links
    applePodcastsUrl?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
    twitterUrl?: string;
    linkedInUrl?: string;
    rssUrlOverride?: string;
    brandReferenceUrl?: string;
    brandNotes?: string;
    brandAudience?: string;
    brandMood?: string;
    brandEnergy?: string;
    brandStructure?: string;
    brandContentFocus?: string;
    brandMustAvoid?: string;
    generatedRationale?: string;
    generatedNav?: string[];
    generatedSections?: string[];
    generatedReferencePages?: Array<{ title: string; url: string }>;
    websiteSeo?: {
        siteTitle: string;
        siteDescription: string;
        keywords: string[];
        ogImage: string;
        robotsDirectives: string;
        structuredData: {
            '@type': 'PodcastSeries';
            name: string;
            description: string;
            webFeed?: string;
            author?: { '@type': 'Person'; name: string };
        };
        generatedAt?: string;
        model?: string;
    };
    blueprintArchetype?: string;
    generatedPages?: Array<{
        slug: string;
        title: string;
        navLabel: string;
        intent?: string;
        seoTitle?: string;
        seoDescription?: string;
        sections: Array<{
            title: string;
            body: string;
            ctaLabel?: string;
            ctaHref?: string;
        }>;
    }>;
}

export default function ThemeEngine({ 
    config: initialConfig, 
    scope,
    onConfigChange 
}: { 
    config: ThemeConfig, 
    scope?: string,
    onConfigChange?: (config: ThemeConfig) => void 
}) {
    const [config, setConfig] = useState(initialConfig);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);

    useEffect(() => {
        // Listen for real-time updates from parent (SplitScreenEditor)
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'UPDATE_THEME') {
                const newConfig = { ...config, ...event.data.payload };
                setConfig(newConfig);
                if (onConfigChange) onConfigChange(newConfig);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [config, onConfigChange]);

    const cssVariables = useMemo(() => {
        const vars: Record<string, string> = {};

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };

        if (config.primaryColor) {
            vars['--primary'] = config.primaryColor;
            const rgb = hexToRgb(config.primaryColor);
            if (rgb) vars['--primary-rgb'] = rgb;
        }
        if (config.backgroundColor) {
            vars['--background'] = config.backgroundColor;
            const rgb = hexToRgb(config.backgroundColor);
            if (rgb) vars['--background-rgb'] = rgb;
        }
        if (config.accentColor) {
            vars['--accent'] = config.accentColor;
            const rgb = hexToRgb(config.accentColor);
            if (rgb) vars['--accent-rgb'] = rgb;
        }
        if (config.borderColor) vars['--border'] = config.borderColor;

        if (config.fontHeading) vars['--font-heading'] = config.fontHeading;
        if (config.fontBody) vars['--font-body'] = config.fontBody;

        if (config.cornerRadius) {
            vars['--radius-lg'] = config.cornerRadius;
            const radiusNum = parseInt(config.cornerRadius);
            if (!isNaN(radiusNum)) {
                vars['--radius-md'] = `${Math.max(0, radiusNum - 4)}px`;
                vars['--radius-sm'] = `${Math.max(0, radiusNum - 8)}px`;
            }
        }

        return Object.entries(vars)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
    }, [config]);

    const fontImports = useMemo(() => {
        const fontsToImport = new Set<string>();

        // Handle custom Google Font URL (Phase 3 3.1)
        if (config.customFontUrl) {
            return `@import url('${config.customFontUrl}');`;
        }

        if (config.fontHeading) {
            fontsToImport.add(config.fontHeading);
        }
        if (config.fontBody && config.fontBody !== config.fontHeading) {
            fontsToImport.add(config.fontBody);
        }

        if (fontsToImport.size === 0) {
            return `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');`;
        }

        const googleFontBaseUrl = 'https://fonts.googleapis.com/css2?';
        const fontParams = Array.from(fontsToImport)
            .map(font => `family=${encodeURIComponent(font.replace(/ /g, '+'))}:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900`)
            .join('&');

        return `@import url('${googleFontBaseUrl}${fontParams}&display=swap');`;
    }, [config.fontHeading, config.fontBody, config.customFontUrl]);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        ${fontImports}
        
        ${scope || ':root'} {
          ${cssVariables}
        }
      `
            }} />
        </>
    );
}
