/**
 * IAPManager – wraps FBInstant Payments API.
 * Fetches the product catalog, handles purchase flow, and verifies receipts
 * server-side via the /api/verify-purchase Vercel function.
 */
export class IAPManager {
  /**
   * Maps Facebook product IDs to the number of coins to grant.
   * These values are the authoritative fallback when the server is unreachable;
   * the server-side verification endpoint uses the same mapping.
   */
  static COIN_GRANTS = {
    'coins_100':  100,
    'coins_500':  500,
    'coins_1000': 1000,
    'coins_5000': 5000,
  };

  constructor() {
    this._catalog = [];
    this._initialized = false;
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  /**
   * Fetch the product catalog from FBInstant.
   * Safe to call multiple times; skips the network call if already initialized.
   */
  async initialize() {
    if (this._initialized) return;

    try {
      this._catalog = await window.FBInstant.payments.getCatalogAsync();
      this._initialized = true;
    } catch (err) {
      console.warn('[IAPManager] getCatalogAsync failed:', err);
      this._catalog = [];
      this._initialized = true; // mark as initialized even on failure
    }
  }

  /**
   * Return the cached product catalog.
   * @returns {object[]}
   */
  getCatalog() {
    return this._catalog;
  }

  // ── Purchase flow ──────────────────────────────────────────────────────────

  /**
   * Initiate a purchase and verify it server-side.
   *
   * @param {string} productID
   * @returns {Promise<{ success: boolean, coins: number }>}
   */
  async purchase(productID) {
    let purchaseResult;

    try {
      purchaseResult = await window.FBInstant.payments.purchaseAsync({ productID });
    } catch (err) {
      // User cancelled or payments not initialised.
      console.warn('[IAPManager] purchaseAsync failed:', err);
      throw err;
    }

    const { purchaseToken } = purchaseResult;
    const playerID = window.FBInstant.player.getID();

    // Attempt server-side verification.
    try {
      const response = await fetch('/api/verify-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseToken, productID, playerID }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          // Consume the purchase so it can't be replayed.
          await this._consumeSafely(purchaseToken);
          return { success: true, coins: data.coins };
        }
        console.warn('[IAPManager] Server rejected purchase:', data.error);
        return { success: false, coins: 0 };
      }
    } catch (networkErr) {
      // Server unreachable – fall back to client-side grant (less secure but
      // better UX than refusing the purchase entirely).
      console.warn('[IAPManager] verify-purchase network error, using fallback:', networkErr);
      const coins = IAPManager.COIN_GRANTS[productID] || 0;
      await this._consumeSafely(purchaseToken);
      return { success: true, coins };
    }

    return { success: false, coins: 0 };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Consume a purchase token, swallowing any errors. */
  async _consumeSafely(purchaseToken) {
    try {
      await window.FBInstant.payments.consumePurchaseAsync(purchaseToken);
    } catch (err) {
      console.warn('[IAPManager] consumePurchaseAsync failed:', err);
    }
  }
}

export default new IAPManager();
