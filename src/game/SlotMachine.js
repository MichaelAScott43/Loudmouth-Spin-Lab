import Phaser from 'phaser';
import payTable from './PayTable.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const REEL_COUNT = 3;
const VISIBLE_ROWS = 3; // top / middle / bottom visible per reel
const SYMBOL_H = 100;   // height of each symbol cell (px)
const REEL_W = 110;     // width of each reel strip
const REEL_GAP = 8;     // gap between reels
const SPIN_DURATION_BASE = 1200; // ms for first reel to stop
const REEL_STAGGER = 300;        // ms between successive reel stops

/**
 * Weighted reel strip.  Higher weight = more frequent appearance.
 * Repeating entries in the array achieves the desired distribution.
 */
const WEIGHTED_SYMBOLS = [
  ...Array(8).fill('lemon'),
  ...Array(7).fill('orange'),
  ...Array(6).fill('watermelon'),
  ...Array(5).fill('cherry'),
  ...Array(4).fill('bell'),
  ...Array(3).fill('bar'),
  ...Array(2).fill('seven'),
  ...Array(1).fill('wild'),
];

/** Pick a random symbol honouring the weight table. */
function randomSymbol() {
  return WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)];
}

// ── SlotMachine class ─────────────────────────────────────────────────────────

/**
 * SlotMachine – Phaser game object group that renders three animated reels.
 *
 * Usage:
 *   const machine = new SlotMachine(scene, centreX, centreY);
 *   machine.spin(bet).then(({ results, payout }) => { ... });
 */
export class SlotMachine {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Horizontal centre of the machine
   * @param {number} y - Vertical centre of the machine
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isSpinning = false;

    // Containers for each reel's symbol sprites.
    this._reels = [];
    // Current symbols shown on the middle (payline) row per reel.
    this._currentSymbols = ['lemon', 'lemon', 'lemon'];

    this._buildMachine();
  }

  // ── Construction ──────────────────────────────────────────────────────────

  _buildMachine() {
    const totalW = REEL_COUNT * REEL_W + (REEL_COUNT - 1) * REEL_GAP;
    const startX = this.x - totalW / 2;
    const reelH = VISIBLE_ROWS * SYMBOL_H;
    const startY = this.y - reelH / 2;

    // Outer frame / backdrop
    const frame = this.scene.add.graphics();
    frame.fillStyle(0x0d0020, 0.95);
    frame.fillRoundedRect(startX - 16, startY - 16, totalW + 32, reelH + 32, 18);
    frame.lineStyle(4, 0x9933ff, 1);
    frame.strokeRoundedRect(startX - 16, startY - 16, totalW + 32, reelH + 32, 18);

    // Payline indicator (centre row)
    const paylineY = this.y;
    const paylineG = this.scene.add.graphics();
    paylineG.lineStyle(3, 0xffdd00, 0.9);
    paylineG.lineBetween(startX - 14, paylineY, startX + totalW + 14, paylineY);

    // Corner decorations
    this._addCornerDecoration(startX - 16, startY - 16);
    this._addCornerDecoration(startX + totalW + 16, startY - 16, true);

    for (let i = 0; i < REEL_COUNT; i++) {
      const reelX = startX + i * (REEL_W + REEL_GAP);
      this._buildReel(i, reelX, startY, reelH);
    }
  }

  /** Small decorative star at reel frame corners. */
  _addCornerDecoration(x, y, flipX = false) {
    const star = this.scene.add
      .text(x, y, '✦', { fontSize: '18px', color: '#ffdd00' })
      .setOrigin(flipX ? 1 : 0, 0);
    return star;
  }

  /**
   * Build a single reel column: background + (VISIBLE_ROWS + 2) symbol sprites
   * to allow seamless scroll wrapping.
   */
  _buildReel(index, x, y, reelH) {
    // Reel background
    const bg = this.scene.add.image(x + REEL_W / 2, y + reelH / 2, 'reel-bg');
    bg.setDisplaySize(REEL_W, reelH);

    // Mask so symbols don't bleed outside the reel area.
    const maskShape = this.scene.make.graphics({ add: false });
    maskShape.fillRect(x, y, REEL_W, reelH);
    const mask = maskShape.createGeometryMask();

    const container = this.scene.add.container(x, y);
    container.setMask(mask);

    // Pre-populate the reel strip with VISIBLE_ROWS + 2 symbols (one above,
    // one below the visible window) so we can tween the strip downward.
    const sprites = [];
    for (let row = 0; row < VISIBLE_ROWS + 2; row++) {
      const sym = randomSymbol();
      const sprite = this.scene.add.image(
        REEL_W / 2,
        (row - 1) * SYMBOL_H + SYMBOL_H / 2,
        `sym-${sym}`
      );
      sprite.setDisplaySize(SYMBOL_H - 8, SYMBOL_H - 8);
      sprite.setData('symbol', sym);
      container.add(sprite);
      sprites.push(sprite);
    }

    this._reels.push({ container, sprites, mask, maskShape, baseY: y });
  }

  // ── Spin ──────────────────────────────────────────────────────────────────

  /**
   * Spin all three reels and resolve with the outcome.
   * @param {number} bet
   * @returns {Promise<{ results: string[], payout: number, win: boolean, multiplier: number, line: string }>}
   */
  spin(bet) {
    if (this.isSpinning) return Promise.resolve({ results: this._currentSymbols, payout: 0, win: false, multiplier: 0, line: '' });

    this.isSpinning = true;

    // Determine final symbols before animation starts so the reel can
    // land precisely on them.
    const results = [randomSymbol(), randomSymbol(), randomSymbol()];
    const outcome = payTable.evaluate(results[0], results[1], results[2], bet);

    return new Promise((resolve) => {
      let stoppedCount = 0;

      for (let i = 0; i < REEL_COUNT; i++) {
        const stopDelay = SPIN_DURATION_BASE + i * REEL_STAGGER;
        this._spinReel(i, results[i], stopDelay, () => {
          stoppedCount++;
          if (stoppedCount === REEL_COUNT) {
            this._currentSymbols = results;
            this.isSpinning = false;

            if (outcome.win) {
              this._playWinAnimation(outcome.multiplier);
            }

            resolve({ results, ...outcome });
          }
        });
      }
    });
  }

  /**
   * Animate a single reel: fast scroll phase → decelerate → snap to final symbol.
   *
   * @param {number} reelIndex
   * @param {string} finalSymbol - The symbol that must land on the payline.
   * @param {number} duration    - Total ms before stopping.
   * @param {Function} onStop    - Called when the reel has finished.
   */
  _spinReel(reelIndex, finalSymbol, duration, onStop) {
    const reel = this._reels[reelIndex];
    const sprites = reel.sprites;

    // Fast-scroll by repeatedly moving the strip down one cell (SYMBOL_H px)
    // and wrapping the top sprite to the bottom.
    const scrollInterval = 60; // ms between each symbol-advance
    let elapsed = 0;

    const scrollTimer = this.scene.time.addEvent({
      delay: scrollInterval,
      repeat: -1,
      callback: () => {
        elapsed += scrollInterval;

        // Advance each sprite one row downward.
        for (const sprite of sprites) {
          sprite.y += SYMBOL_H;
        }

        // Wrap: if the topmost sprite has scrolled off the bottom, move it above.
        sprites.sort((a, b) => a.y - b.y);
        const bottom = sprites[sprites.length - 1];
        if (bottom.y > (VISIBLE_ROWS + 1) * SYMBOL_H) {
          const newSym = elapsed < duration - 200 ? randomSymbol() : finalSymbol;
          bottom.y = sprites[0].y - SYMBOL_H;
          bottom.setTexture(`sym-${newSym}`);
          bottom.setData('symbol', newSym);
          // Re-sort so the top sprite is always index 0.
          sprites.sort((a, b) => a.y - b.y);
        }

        if (elapsed >= duration) {
          scrollTimer.remove();
          // Snap every sprite to its correct grid position.
          this._snapReel(reelIndex, finalSymbol);
          onStop();
        }
      },
    });
  }

  /**
   * Snap all sprites in a reel to the nearest grid row and ensure the
   * payline row shows the intended final symbol.
   */
  _snapReel(reelIndex, finalSymbol) {
    const reel = this._reels[reelIndex];
    const sprites = reel.sprites;

    sprites.sort((a, b) => a.y - b.y);

    // Align each sprite to the grid.
    sprites.forEach((sprite, idx) => {
      sprite.y = (idx - 1) * SYMBOL_H + SYMBOL_H / 2;
    });

    // The middle visible row is index 1 (0-based inside the strip is idx=1
    // when we have one hidden row above).  Force it to the correct symbol.
    const paylineSprite = sprites[1];
    paylineSprite.setTexture(`sym-${finalSymbol}`);
    paylineSprite.setData('symbol', finalSymbol);

    // Fill neighbouring rows with random symbols so the reel looks natural.
    sprites[0].setTexture(`sym-${randomSymbol()}`);
    sprites[2].setTexture(`sym-${randomSymbol()}`);
  }

  // ── Win animation ─────────────────────────────────────────────────────────

  /**
   * Flash the payline symbols with a golden glow tween proportional to win size.
   */
  _playWinAnimation(multiplier) {
    const flashCount = multiplier >= 50 ? 6 : multiplier >= 10 ? 4 : 2;

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = this._reels[i];
      const paylineSprite = reel.sprites.sort((a, b) => a.y - b.y)[1];

      this.scene.tweens.add({
        targets: paylineSprite,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 0.5,
        yoyo: true,
        repeat: flashCount,
        duration: 150,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          paylineSprite.setScale(1);
          paylineSprite.setAlpha(1);
        },
      });

      // Tint cycling: gold → white → gold
      this.scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 150 * (flashCount * 2),
        repeat: 0,
        onUpdate: (tween) => {
          const v = tween.getValue();
          const color = v < 50
            ? Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 215, b: 0 }, { r: 255, g: 255, b: 255 }, 100, v * 2
              )
            : Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 255, g: 255, b: 255 }, { r: 255, g: 215, b: 0 }, 100, (v - 50) * 2
              );
          paylineSprite.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
        },
        onComplete: () => paylineSprite.clearTint(),
      });
    }
  }

  // ── Public helpers ────────────────────────────────────────────────────────

  /** Return the y-coordinate just below the reel area (for UI positioning). */
  get bottomY() {
    return this.y + (VISIBLE_ROWS * SYMBOL_H) / 2 + 16;
  }

  /** Return the y-coordinate just above the reel area. */
  get topY() {
    return this.y - (VISIBLE_ROWS * SYMBOL_H) / 2 - 16;
  }
}

export default SlotMachine;
