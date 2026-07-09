export function isProductsEnabled() {
  return process.env.ENABLE_PRODUCTS === 'true' && Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isCustomDomainsEnabled() {
  return (
    process.env.ENABLE_CUSTOM_DOMAINS === 'true' &&
    Boolean(process.env.VERCEL_PROJECT_ID) &&
    Boolean(process.env.VERCEL_TOKEN)
  );
}

export function isVideoSyncEnabled() {
  return process.env.ENABLE_VIDEO_SYNC === 'true';
}

export function isDemoSeedEnabled() {
  return process.env.ENABLE_DEMO_SEED === 'true';
}
