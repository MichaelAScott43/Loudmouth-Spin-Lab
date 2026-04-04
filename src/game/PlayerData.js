/**
 * PlayerData – persistent player state backed by FBInstant player storage.
 */
export class PlayerData {
  static STARTING_COINS = 1000;
  static DAILY_BONUS_COINS = 100;

  constructor() {
    this.coins = PlayerData.STARTING_COINS;
    this.totalSpins = 0;
    this.biggestWin = 0;
    this.dailySpinLastDate = null;
    this.playerName = 'Player';
    this.playerPhoto = null;
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  /**
   * Load persisted data from FBInstant and populate instance fields.
   * Also fetches the player's display name and photo URL.
   */
  async load() {
    const fb = window.FBInstant;

    // Fetch stored game data.
    const data = await fb.player.getDataAsync([
      'coins',
      'totalSpins',
      'biggestWin',
      'dailySpinLastDate',
    ]);

    this.coins =
      typeof data.coins === 'number' ? data.coins : PlayerData.STARTING_COINS;
    this.totalSpins = data.totalSpins || 0;
    this.biggestWin = data.biggestWin || 0;
    this.dailySpinLastDate = data.dailySpinLastDate || null;

    // Player identity
    this.playerName = fb.player.getName() || 'Player';
    this.playerPhoto = fb.player.getPhoto() || null;
  }

  /**
   * Persist current state to FBInstant (fire-and-forget, errors are swallowed).
   */
  async save() {
    const fb = window.FBInstant;
    try {
      await fb.player.setDataAsync({
        coins: this.coins,
        totalSpins: this.totalSpins,
        biggestWin: this.biggestWin,
        dailySpinLastDate: this.dailySpinLastDate,
      });
      await fb.player.flushDataAsync();
    } catch (err) {
      console.warn('[PlayerData] save failed:', err);
    }
  }

  // ─── Daily bonus ────────────────────────────────────────────────────────────

  /**
   * Award a daily login bonus if the player hasn't claimed one today.
   * @returns {Promise<boolean>} true if bonus was awarded, false otherwise.
   */
  async claimDailyBonus() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (this.dailySpinLastDate === today) return false;

    this.dailySpinLastDate = today;
    this.coins += PlayerData.DAILY_BONUS_COINS;
    await this.save();
    return true;
  }

  // ─── Coin management ────────────────────────────────────────────────────────

  /**
   * Add coins and persist.
   * @param {number} amount
   */
  addCoins(amount) {
    this.coins += amount;
    if (amount > this.biggestWin) this.biggestWin = amount;
    this.save();
  }

  /**
   * Deduct coins if the player can afford it.
   * @param {number} amount
   * @returns {boolean} true if deduction succeeded.
   */
  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.coins -= amount;
    this.totalSpins += 1;
    this.save();
    return true;
  }
}

export default new PlayerData();
