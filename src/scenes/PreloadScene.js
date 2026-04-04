import Phaser from 'phaser';

/**
 * PreloadScene – generates all procedural textures and drives the FB
 * loading-progress bar from 10 → 100.  No external asset files are
 * required; every texture is drawn with Phaser Graphics / RenderTexture.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  // ─── Loading bar ────────────────────────────────────────────────────────────

  preload() {
    const { width, height } = this.scale;

    // Progress bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRect(width / 2 - 150, height / 2 - 20, 300, 40);

    // Progress bar fill
    const barFill = this.add.graphics();

    // Loading label
    const label = this.add
      .text(width / 2, height / 2 - 50, 'Loading…', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (pct) => {
      barFill.clear();
      barFill.fillStyle(0xf0c040, 1);
      barFill.fillRect(width / 2 - 148, height / 2 - 18, 296 * pct, 36);

      // Drive FB Instant Games loading indicator (10–90 % range)
      window.FBInstant.setLoadingProgress(10 + pct * 80);
    });

    this.load.on('complete', () => {
      label.setText('Ready!');
    });

    // No real files to load – textures are generated in create().
    // Add a tiny placeholder so the 'progress' event fires at least once.
    this.load.image('__placeholder__', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
  }

  // ─── Texture generation ─────────────────────────────────────────────────────

  create() {
    this._generateTextures();

    window.FBInstant.setLoadingProgress(90);

    window.FBInstant.startGameAsync().then(() => {
      window.FBInstant.setLoadingProgress(100);
      this.scene.start('Game');
      this.scene.launch('HUD');
    });
  }

  _generateTextures() {
    this._makeSymbol('sym-seven',      0xee1111, '7',   '#ffffff');
    this._makeSymbol('sym-bar',        0xd4a017, 'BAR', '#1a0a2e');
    this._makeSymbol('sym-cherry',     0xdd2244, '🍒',  '#ffffff');
    this._makeSymbol('sym-bell',       0xffdd00, '🔔',  '#1a0a2e');
    this._makeSymbol('sym-lemon',      0xffee00, '🍋',  '#333333');
    this._makeSymbol('sym-orange',     0xff8800, '🍊',  '#ffffff');
    this._makeSymbol('sym-watermelon', 0x33bb44, '🍉',  '#ffffff');
    this._makeSymbol('sym-wild',       0xaa44ff, '★',   '#ffee00');

    this._makeReelBg();
    this._makeSpinButton();
    this._makeCoinIcon();
  }

  /**
   * Creates a 96×96 symbol texture: rounded rect background + centred label.
   */
  _makeSymbol(key, bgColor, label, textColor) {
    const SIZE = 96;
    const rt = this.add.renderTexture(0, 0, SIZE, SIZE).setVisible(false);

    const g = this.add.graphics().setVisible(false);
    // Background with rounded corners
    g.fillStyle(bgColor, 1);
    g.fillRoundedRect(4, 4, SIZE - 8, SIZE - 8, 14);
    // Inner highlight
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(8, 8, SIZE - 16, (SIZE - 16) / 2, 10);
    // Border
    g.lineStyle(3, 0xffffff, 0.6);
    g.strokeRoundedRect(4, 4, SIZE - 8, SIZE - 8, 14);

    rt.draw(g, 0, 0);
    g.destroy();

    const txt = this.add
      .text(SIZE / 2, SIZE / 2, label, {
        fontFamily: 'Arial',
        fontSize: label.length === 1 ? '44px' : '28px',
        color: textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(false);

    rt.draw(txt, 0, 0);
    txt.destroy();

    rt.saveTexture(key);
    rt.destroy();
  }

  /** Dark reel background strip. */
  _makeReelBg() {
    const W = 110;
    const H = 320;
    const rt = this.add.renderTexture(0, 0, W, H).setVisible(false);
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0x0d0020, 1);
    g.fillRoundedRect(0, 0, W, H, 10);
    g.lineStyle(2, 0x6633cc, 0.8);
    g.strokeRoundedRect(0, 0, W, H, 10);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture('reel-bg');
    rt.destroy();
  }

  /** Circular spin button. */
  _makeSpinButton() {
    const R = 64;
    const SIZE = R * 2;
    const rt = this.add.renderTexture(0, 0, SIZE, SIZE).setVisible(false);
    const g = this.add.graphics().setVisible(false);

    // Outer glow ring
    g.fillStyle(0xff6600, 0.3);
    g.fillCircle(R, R, R);
    // Main button face
    g.fillStyle(0xff4400, 1);
    g.fillCircle(R, R, R - 6);
    // Highlight
    g.fillStyle(0xff8844, 0.7);
    g.fillCircle(R - 4, R - 10, R / 2.5);

    rt.draw(g, 0, 0);
    g.destroy();

    const txt = this.add
      .text(R, R + 2, 'SPIN', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(false);

    rt.draw(txt, 0, 0);
    txt.destroy();
    rt.saveTexture('spin-btn');
    rt.destroy();
  }

  /** Small gold coin icon. */
  _makeCoinIcon() {
    const SIZE = 32;
    const rt = this.add.renderTexture(0, 0, SIZE, SIZE).setVisible(false);
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 2);
    g.fillStyle(0xb8860b, 1);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 6);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(SIZE / 2, SIZE / 2, SIZE / 2 - 9);
    rt.draw(g, 0, 0);
    g.destroy();
    rt.saveTexture('coin-icon');
    rt.destroy();
  }
}
