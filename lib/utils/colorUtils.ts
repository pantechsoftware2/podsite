// lib/utils/colorUtils.ts
import { FastAverageColor } from 'fast-average-color';

export interface ThemeColors {
    primary: string;
    background: string;
    foreground: string;
    accent: string;
    border: string;
}

/**
 * Extracts colors from an image URL and returns a theme configuration.
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ThemeColors> {
    if (typeof Image === 'undefined') {
        return fallbackColors();
    }

    const fac = new FastAverageColor();
    try {
        const color = await fac.getColorAsync(imageUrl);
        const dominantHex = color.hex;
        const isDark = color.isDark;

        // Basic logic to derive colors
        const background = isDark ? '#0a0a0a' : '#ffffff';
        const foreground = isDark ? '#ededed' : '#171717';

        // Ensure primary has enough contrast against background
        let primary = dominantHex;
        if (!hasEnoughContrast(primary, background)) {
            primary = adjustBrightness(primary, isDark ? 20 : -20);
        }

        return {
            primary,
            background,
            foreground,
            accent: adjustBrightness(primary, 15),
            border: isDark ? '#334155' : '#e2e8f0',
        };
    } catch (error) {
        console.error('Error extracting colors:', error);
        return fallbackColors();
    }
}

function fallbackColors(): ThemeColors {
    return {
        primary: '#0ea5e9',
        background: '#ffffff',
        foreground: '#171717',
        accent: '#f59e0b',
        border: '#e2e8f0',
    };
}

/**
 * Checks if a color has enough contrast against a background based on WCAG AA (4.5:1).
 * Simplified implementation using luminance.
 */
function hasEnoughContrast(hex1: string, hex2: string): boolean {
    const L1 = getLuminance(hex1);
    const L2 = getLuminance(hex2);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return ratio >= 4.5;
}

function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = rgb.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
        ]
        : null;
}

function adjustBrightness(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const [r, g, b] = rgb.map((c) => {
        c = Math.round(Math.min(255, Math.max(0, c + (255 * percent) / 100)));
        return c;
    });
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
