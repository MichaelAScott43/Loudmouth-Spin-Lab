/**
 * Unit tests for the core slot-machine game logic.
 */

import {
  spin,
  calculatePayout,
  canSpin,
  SYMBOLS,
  SYMBOL_VALUES,
  SPIN_COST,
  REEL_COUNT,
} from '../utils/gameLogic';

describe('calculatePayout', () => {
  test('returns max payout when all three reels match', () => {
    expect(calculatePayout(['💎', '💎', '💎'])).toBe(SYMBOL_VALUES['💎'] * 10);
    expect(calculatePayout(['7️⃣', '7️⃣', '7️⃣'])).toBe(SYMBOL_VALUES['7️⃣'] * 10);
    expect(calculatePayout(['🍒', '🍒', '🍒'])).toBe(SYMBOL_VALUES['🍒'] * 10);
  });

  test('returns partial payout when exactly two reels match', () => {
    expect(calculatePayout(['🍋', '🍋', '🍊'])).toBe(SYMBOL_VALUES['🍋'] * 2);
    expect(calculatePayout(['⭐', '🍒', '⭐'])).toBe(SYMBOL_VALUES['⭐'] * 2);
    expect(calculatePayout(['🍊', '7️⃣', '7️⃣'])).toBe(SYMBOL_VALUES['7️⃣'] * 2);
  });

  test('returns 0 when all reels are different', () => {
    expect(calculatePayout(['🍒', '🍋', '🍊'])).toBe(0);
    expect(calculatePayout(['⭐', '💎', '7️⃣'])).toBe(0);
  });

  test('returns 0 for wrong reel count', () => {
    expect(calculatePayout(['🍒', '🍒'])).toBe(0);
    expect(calculatePayout([])).toBe(0);
  });
});

describe('spin', () => {
  test('always returns exactly REEL_COUNT symbols', () => {
    for (let i = 0; i < 20; i++) {
      const { reels } = spin();
      expect(reels).toHaveLength(REEL_COUNT);
    }
  });

  test('every reel symbol is in the SYMBOLS list', () => {
    for (let i = 0; i < 20; i++) {
      const { reels } = spin();
      reels.forEach((symbol) => expect(SYMBOLS).toContain(symbol));
    }
  });

  test('payout is non-negative', () => {
    for (let i = 0; i < 20; i++) {
      const { payout } = spin();
      expect(payout).toBeGreaterThanOrEqual(0);
    }
  });

  test('win flag matches whether payout is > 0', () => {
    for (let i = 0; i < 30; i++) {
      const { payout, win } = spin();
      expect(win).toBe(payout > 0);
    }
  });
});

describe('canSpin', () => {
  test('returns true when coins >= SPIN_COST', () => {
    expect(canSpin(SPIN_COST)).toBe(true);
    expect(canSpin(SPIN_COST + 50)).toBe(true);
  });

  test('returns false when coins < SPIN_COST', () => {
    expect(canSpin(0)).toBe(false);
    expect(canSpin(SPIN_COST - 1)).toBe(false);
  });
});
