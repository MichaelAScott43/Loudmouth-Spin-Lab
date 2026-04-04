/**
 * FBInstant Mock SDK for local development.
 * Mirrors the FB Instant Games 8.0 API surface so the game runs
 * without a real Facebook context.
 */

const mockAd = {
  loadAsync: () => Promise.resolve(),
  showAsync: () => Promise.resolve(),
};

const FBInstantMock = {
  // ── Core lifecycle ─────────────────────────────────────────────────────────
  initializeAsync() {
    return new Promise((resolve) => setTimeout(resolve, 500));
  },

  setLoadingProgress(_pct) {
    // no-op in mock
  },

  startGameAsync() {
    return Promise.resolve();
  },

  quit() {
    // no-op
  },

  // ── Player ─────────────────────────────────────────────────────────────────
  player: {
    getName() {
      return 'Player One';
    },

    getID() {
      return 'mock-player-id';
    },

    getPhoto() {
      return null;
    },

    getDataAsync(_keys) {
      return Promise.resolve({});
    },

    setDataAsync(_data) {
      return Promise.resolve();
    },

    flushDataAsync() {
      return Promise.resolve();
    },
  },

  // ── Context ────────────────────────────────────────────────────────────────
  context: {
    getID() {
      return 'mock-context';
    },

    getType() {
      return 'SOLO';
    },
  },

  // ── Leaderboards ───────────────────────────────────────────────────────────
  getLeaderboardAsync(_name) {
    const mockLeaderboard = {
      getConnectedPlayerEntriesAsync() {
        return Promise.resolve([]);
      },
      getPlayerEntryAsync() {
        return Promise.resolve(null);
      },
      setScoreAsync(_score) {
        return Promise.resolve();
      },
    };
    return Promise.resolve(mockLeaderboard);
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  shareAsync(_payload) {
    return Promise.resolve();
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  payments: {
    getCatalogAsync() {
      return Promise.resolve([]);
    },

    purchaseAsync(_config) {
      return Promise.reject({ code: 'PAYMENTS_NOT_INITIALIZED' });
    },

    consumePurchaseAsync(_purchaseToken) {
      return Promise.resolve();
    },

    getPurchasesAsync() {
      return Promise.resolve([]);
    },
  },

  // ── Ads ────────────────────────────────────────────────────────────────────
  getRewardedVideoAsync(_placementId) {
    return Promise.resolve({ ...mockAd });
  },

  getInterstitialAdAsync(_placementId) {
    return Promise.resolve({ ...mockAd });
  },
};

export default FBInstantMock;
