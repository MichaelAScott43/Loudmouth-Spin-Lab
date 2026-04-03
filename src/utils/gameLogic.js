/**
 * Core slot-machine game logic for Loudmouth Spin Lab.
 */

export const SYMBOLS = ['🍒', '🍋', '🍊', '⭐', '💎', '7️⃣'];

export const SYMBOL_VALUES = {
  '🍒': 5,
  '🍋': 10,
  '🍊': 15,
  '⭐': 25,
  '💎': 50,
  '7️⃣': 100,
};

export const SPIN_COST = 10;
export const STARTING_COINS = 100;
export const REEL_COUNT = 3;

/** Return a random symbol from the pool. */
function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

/**
 * Spin all reels and return the result.
 * @returns {{ reels: string[], payout: number, win: boolean }}
 */
export function spin() {
  const reels = Array.from({ length: REEL_COUNT }, randomSymbol);
  const payout = calculatePayout(reels);
  return { reels, payout, win: payout > 0 };
}

/**
 * Calculate the payout for a given set of reels.
 * - All three match:  symbol value × 10
 * - Two match:        symbol value × 2
 * - No match:         0
 */
export function calculatePayout(reels) {
  if (reels.length !== REEL_COUNT) return 0;

  const [a, b, c] = reels;

  if (a === b && b === c) {
    return SYMBOL_VALUES[a] * 10;
  }

  if (a === b || b === c || a === c) {
    const matchedSymbol = a === b ? a : a === c ? a : b;
    return SYMBOL_VALUES[matchedSymbol] * 2;
  }

  return 0;
}

/** Check whether the player can afford another spin. */
export function canSpin(coins) {
  return coins >= SPIN_COST;
}
