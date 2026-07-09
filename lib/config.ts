const PLACEHOLDER_MARKERS = [
  'dev-placeholder',
  'placeholder',
  'your-',
  'example',
  'dummy',
];

type ConfigIssue = {
  key: string;
  reason: string;
  readFrom: string;
  readBy: string;
};

export class MissingConfigError extends Error {
  constructor(
    public readonly keys: string[],
    message = `Missing or placeholder environment configuration: ${keys.join(', ')}`,
  ) {
    super(message);
    this.name = 'MissingConfigError';
  }
}

function getMissingOrPlaceholderReason(value: string | undefined): string | null {
  if (!value?.trim()) return 'value is missing or empty';
  const normalized = value.trim().toLowerCase();
  const marker = PLACEHOLDER_MARKERS.find(item => normalized.includes(item));
  return marker ? `value contains placeholder marker "${marker}"` : null;
}

function isMissingOrPlaceholder(value: string | undefined): boolean {
  return getMissingOrPlaceholderReason(value) !== null;
}

function getSupabaseUrlIssue(value: string | undefined): string | null {
  const placeholderReason = getMissingOrPlaceholderReason(value);
  if (placeholderReason) return placeholderReason;

  try {
    const url = new URL(value ?? '');
    if (url.hostname === '127.0.0.1' && url.port === '54321') {
      return 'value points to the default local Supabase URL, but local Supabase is not running/configured for this project';
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'value must be an http(s) URL';
    }

    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname && pathname !== '/rest/v1') {
      return 'value must be the Supabase project URL, not a nested API path';
    }

    return null;
  } catch {
    return 'value is not a valid URL';
  }
}

function normalizeSupabaseProjectUrl(value: string): string {
  const url = new URL(value.trim());
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export function getPublicSupabaseConfigStatus() {
  const issues: ConfigIssue[] = [];
  const readBy = 'lib/config.ts:getPublicSupabaseConfigStatus';

  const urlIssue = getSupabaseUrlIssue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (urlIssue) {
    issues.push({
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      reason: urlIssue,
      readFrom: 'process.env.NEXT_PUBLIC_SUPABASE_URL',
      readBy,
    });
  }

  const anonKeyIssue = getMissingOrPlaceholderReason(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (anonKeyIssue) {
    issues.push({
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      reason: anonKeyIssue,
      readFrom: 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY',
      readBy,
    });
  }

  return {
    ok: issues.length === 0,
    missing: issues.map(issue => issue.key),
    issues,
    url: issues.some(issue => issue.key === 'NEXT_PUBLIC_SUPABASE_URL')
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : normalizeSupabaseProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function logSupabaseConfigIssues(caller: string) {
  const status = getPublicSupabaseConfigStatus();
  if (status.ok) return;

  for (const issue of status.issues) {
    console.error(
      `[Supabase config] ${caller}: ${issue.key} is not usable (${issue.reason}). Read from ${issue.readFrom} by ${issue.readBy}.`,
    );
  }
}

export function getRequiredSupabaseConfig() {
  const status = getPublicSupabaseConfigStatus();
  if (!status.ok) {
    logSupabaseConfigIssues('getRequiredSupabaseConfig');
    throw new MissingConfigError(status.missing, 'Supabase is not configured. Add your project URL and anon key to .env.local.');
  }

  return {
    url: status.url!,
    anonKey: status.anonKey!,
  };
}

export function getRequiredSupabaseServiceRoleConfig() {
  const publicConfig = getRequiredSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isMissingOrPlaceholder(serviceRoleKey)) {
    throw new MissingConfigError(
      ['SUPABASE_SERVICE_ROLE_KEY'],
      'Supabase service role key is required for trusted server-side jobs such as Stripe webhooks.',
    );
  }

  return {
    ...publicConfig,
    serviceRoleKey: serviceRoleKey!,
  };
}

export function getMissingServerConfig(keys: string[]) {
  return keys.filter(key => isMissingOrPlaceholder(process.env[key]));
}

export function jsonConfigError(error: unknown) {
  if (error instanceof MissingConfigError) {
    return {
      error: error.message,
      missing: error.keys,
    };
  }

  return {
    error: error instanceof Error ? error.message : 'Server configuration error',
  };
}
