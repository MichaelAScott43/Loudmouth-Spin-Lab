/**
 * POST /api/verify-purchase
 *
 * Verifies a Facebook Instant Games IAP receipt against the Graph API
 * and returns the number of coins to grant.
 *
 * Expected request body (JSON):
 *   { purchaseToken: string, productID: string, playerID: string }
 *
 * Response (JSON):
 *   { valid: boolean, coins: number }
 *   or { valid: false, error: string }
 */

const COIN_GRANTS = {
  'coins_100':  100,
  'coins_500':  500,
  'coins_1000': 1000,
  'coins_5000': 5000,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { purchaseToken, productID, playerID } = req.body || {};

  if (!purchaseToken || !productID) {
    return res.status(400).json({ valid: false, error: 'Missing required fields' });
  }

  const appID = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;

  if (!appID || !appSecret) {
    console.error('[verify-purchase] FB_APP_ID / FB_APP_SECRET not configured');
    return res.status(500).json({ valid: false, error: 'Server misconfiguration' });
  }

  try {
    // App-access token is formed as "appID|appSecret".
    const appToken = `${appID}|${appSecret}`;
    const verifyUrl =
      `https://graph.facebook.com/v18.0/${encodeURIComponent(purchaseToken)}` +
      `?access_token=${encodeURIComponent(appToken)}`;

    const fbResponse = await fetch(verifyUrl);
    const data = await fbResponse.json();

    if (data.error || !data.id) {
      console.warn('[verify-purchase] FB rejected token:', data.error);
      return res.status(400).json({ valid: false, error: 'Invalid purchase token' });
    }

    // Token is valid – look up coin grant for this product.
    const coins = COIN_GRANTS[productID] ?? 0;

    console.info(`[verify-purchase] playerID=${playerID} productID=${productID} coins=${coins}`);
    return res.status(200).json({ valid: true, coins });
  } catch (err) {
    console.error('[verify-purchase] Unexpected error:', err);
    return res.status(500).json({ valid: false, error: 'Verification failed' });
  }
}
