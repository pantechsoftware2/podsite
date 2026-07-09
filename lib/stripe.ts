/**
 * Mock Stripe functions for development without real API keys
 */

export async function createStripeProduct(title: string, description: string) {
  console.log('[MOCK STRIPE] Creating product:', title);
  return {
    productId: `mock_prod_${Math.random().toString(36).substring(7)}`,
    priceId: `mock_price_${Math.random().toString(36).substring(7)}`
  };
}

export async function createStripeCheckout(productId: string, podcastId: string, returnUrl: string) {
  console.log('[MOCK STRIPE] Creating checkout for:', productId);
  // Return a mock checkout URL pointing to our internal checkout page
  return {
    url: `/checkout/${productId}?podcastId=${podcastId}&returnUrl=${encodeURIComponent(returnUrl)}`
  };
}
