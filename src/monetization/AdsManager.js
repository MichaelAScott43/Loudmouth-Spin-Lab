/**
 * AdsManager – wraps FBInstant rewarded & interstitial ad APIs.
 * Handles preloading, showing, and graceful error recovery.
 */
export class AdsManager {
  static REWARDED_PLACEMENT_ID = 'YOUR_REWARDED_AD_PLACEMENT_ID';
  static INTERSTITIAL_PLACEMENT_ID = 'YOUR_INTERSTITIAL_AD_PLACEMENT_ID';

  constructor() {
    this._rewardedAd = null;
    this._interstitialAd = null;
    this._rewardedLoading = false;
    this._interstitialLoading = false;
  }

  // ── Rewarded ads ────────────────────────────────────────────────────────────

  /**
   * Pre-fetch a rewarded ad instance in the background.
   * Safe to call multiple times; no-ops if already loading.
   */
  async preloadRewardedAd() {
    if (this._rewardedLoading || this._rewardedAd) return;
    this._rewardedLoading = true;

    try {
      const ad = await window.FBInstant.getRewardedVideoAsync(AdsManager.REWARDED_PLACEMENT_ID);
      await ad.loadAsync();
      this._rewardedAd = ad;
    } catch (err) {
      console.warn('[AdsManager] Rewarded ad preload failed:', err);
      this._rewardedAd = null;
    } finally {
      this._rewardedLoading = false;
    }
  }

  /**
   * Show the rewarded video ad.
   * @returns {Promise<{ rewarded: boolean }>}
   */
  async showRewardedAd() {
    // If no preloaded ad, try loading one now (blocks until ready or fails).
    if (!this._rewardedAd) {
      await this.preloadRewardedAd();
    }

    if (!this._rewardedAd) {
      console.warn('[AdsManager] No rewarded ad available.');
      return { rewarded: false };
    }

    const ad = this._rewardedAd;
    this._rewardedAd = null; // consume

    try {
      await ad.showAsync();
      // Pre-load the next ad after a short delay.
      setTimeout(() => this.preloadRewardedAd(), 2000);
      return { rewarded: true };
    } catch (err) {
      console.warn('[AdsManager] Rewarded ad show failed:', err);
      setTimeout(() => this.preloadRewardedAd(), 2000);
      return { rewarded: false };
    }
  }

  // ── Interstitial ads ────────────────────────────────────────────────────────

  /**
   * Pre-fetch an interstitial ad in the background.
   */
  async preloadInterstitialAd() {
    if (this._interstitialLoading || this._interstitialAd) return;
    this._interstitialLoading = true;

    try {
      const ad = await window.FBInstant.getInterstitialAdAsync(AdsManager.INTERSTITIAL_PLACEMENT_ID);
      await ad.loadAsync();
      this._interstitialAd = ad;
    } catch (err) {
      console.warn('[AdsManager] Interstitial ad preload failed:', err);
      this._interstitialAd = null;
    } finally {
      this._interstitialLoading = false;
    }
  }

  /**
   * Show an interstitial ad.  Errors are swallowed so gameplay isn't disrupted.
   */
  async showInterstitialAd() {
    if (!this._interstitialAd) {
      await this.preloadInterstitialAd();
    }

    if (!this._interstitialAd) return;

    const ad = this._interstitialAd;
    this._interstitialAd = null;

    try {
      await ad.showAsync();
    } catch (err) {
      console.warn('[AdsManager] Interstitial ad show failed:', err);
    } finally {
      setTimeout(() => this.preloadInterstitialAd(), 3000);
    }
  }
}

export default new AdsManager();
