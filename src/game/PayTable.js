/**
 * PayTable – defines symbol payouts and win evaluation for the slot machine.
 */
export class PayTable {
  constructor() {
    /** Canonical symbol names in descending rarity / value order. */
    this.SYMBOLS = [
      'wild',
      'seven',
      'bar',
      'bell',
      'cherry',
      'watermelon',
      'orange',
      'lemon',
    ];

    /**
     * Payout multiplier table keyed by comma-joined symbol triplets.
     * '*' is a wildcard that matches any symbol.
     * All three-of-a-kind entries include wild-substitution rows for clarity;
     * the evaluate() method handles wild substitution dynamically too.
     */
    this.PAYOUTS = {
      'wild,wild,wild':             500,
      'seven,seven,seven':          200,
      'bar,bar,bar':                100,
      'bell,bell,bell':              50,
      'cherry,cherry,cherry':        30,
      'watermelon,watermelon,watermelon': 20,
      'orange,orange,orange':        15,
      'lemon,lemon,lemon':           10,
      // Partial cherry lines
      'cherry,cherry,*':              5,
      'cherry,*,*':                   2,
    };
  }

  /**
   * Evaluate the outcome of a single spin.
   *
   * @param {string} s1 - Symbol on reel 1 (centre row)
   * @param {string} s2 - Symbol on reel 2 (centre row)
   * @param {string} s3 - Symbol on reel 3 (centre row)
   * @param {number} bet - Coins wagered this spin
   * @returns {{ win: boolean, multiplier: number, payout: number, line: string }}
   */
  evaluate(s1, s2, s3, bet) {
    // Substitute wilds for the dominant non-wild symbol so three-of-a-kind
    // detection works naturally.
    const effective = this._applyWilds(s1, s2, s3);
    const key = effective.join(',');

    // Check exact three-of-a-kind match first.
    if (this.PAYOUTS[key] !== undefined) {
      const multiplier = this.PAYOUTS[key];
      return {
        win: true,
        multiplier,
        payout: bet * multiplier,
        line: key,
      };
    }

    // Check wildcard pattern matches (e.g. 'cherry,cherry,*').
    for (const [pattern, multiplier] of Object.entries(this.PAYOUTS)) {
      if (pattern.includes('*') && this._matchesPattern(effective, pattern.split(','))) {
        return {
          win: true,
          multiplier,
          payout: bet * multiplier,
          line: pattern,
        };
      }
    }

    return { win: false, multiplier: 0, payout: 0, line: key };
  }

  /**
   * Replace wilds with the most common non-wild symbol in the triplet so
   * that three-of-a-kind payouts work when one or more reels land on wild.
   */
  _applyWilds(s1, s2, s3) {
    const symbols = [s1, s2, s3];
    const nonWild = symbols.filter((s) => s !== 'wild');

    if (nonWild.length === 0) return symbols; // all wild → stays 'wild,wild,wild'

    // Find most frequent non-wild symbol.
    const freq = {};
    for (const s of nonWild) freq[s] = (freq[s] || 0) + 1;
    const dominant = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];

    return symbols.map((s) => (s === 'wild' ? dominant : s));
  }

  /**
   * Check whether an effective symbol triplet matches a pattern array that
   * may contain '*' wildcards.
   */
  _matchesPattern(effective, pattern) {
    return pattern.every((p, i) => p === '*' || p === effective[i]);
  }
}

export default new PayTable();
