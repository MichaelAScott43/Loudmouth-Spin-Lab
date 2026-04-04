import Phaser from 'phaser';
import playerData from '../game/PlayerData.js';
import SlotMachine from '../game/SlotMachine.js';
import adsManager from '../monetization/AdsManager.js';
import leaderboard from '../social/Leaderboard.js';
import share from '../social/Share.js';

const BET_OPTIONS = [10, 25, 50, 100, 250];
const BIG_WIN_MULTIPLIER = 10; // spins returning >= bet * 10 trigger share prompt

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
    this._betIndex = 0;
    this._spinning = false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const { width, height } = this.scale;

    this._buildBackground(width, height);

    // Centre the slot machine vertically with room for controls at the bottom.
    const machineY = height * 0.42;
    this._slotMachine = new SlotMachine(this, width / 2, machineY);

    this._buildControls(width, height);

    // Load player data, then update UI and check daily bonus.
    playerData.load().then(() => {
      this._updateCoinDisplay();
      this._checkDailyBonus();
    });

    // Pre-load an interstitial so it's ready after several spins.
    adsManager.preloadInterstitialAd();
  }

  // ── Background ─────────────────────────────────────────────────────────────

  _buildBackground(width, height) {
    // Gradient-like layered rectangles for a dark purple atmosphere.
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Radial-ish highlight around the centre.
    bg.fillStyle(0x2d1055, 0.5);
    bg.fillEllipse(width / 2, height * 0.4, width * 1.2, height * 0.7);

    // Subtle star particles at the top.
    for (let i = 0; i < 40; i++) {
      const sx = Phaser.Math.Between(0, width);
      const sy = Phaser.Math.Between(0, height * 0.25);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      bg.fillStyle(0xffffff, alpha);
      bg.fillRect(sx, sy, 2, 2);
    }

    // Title banner
    this.add
      .text(width / 2, 36, '🎰 LOUDMOUTH SPIN LAB', {
        fontFamily: 'Arial Black, Arial',
        fontSize: '22px',
        color: '#ffdd00',
        stroke: '#6600cc',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0);
  }

  // ── Controls ───────────────────────────────────────────────────────────────

  _buildControls(width, height) {
    const controlY = height * 0.82;

    // ── Bet selector ──
    const betLabelY = controlY - 60;
    this.add.text(width / 2, betLabelY - 18, 'BET', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaaff',
    }).setOrigin(0.5);

    // Decrease bet
    const btnMinus = this._makeTextButton(width / 2 - 80, betLabelY + 4, '◀', () => {
      this._betIndex = Math.max(0, this._betIndex - 1);
      this._updateBetDisplay();
    });

    // Bet amount display
    this._betText = this.add.text(width / 2, betLabelY + 4, `${BET_OPTIONS[this._betIndex]}`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Increase bet
    const btnPlus = this._makeTextButton(width / 2 + 80, betLabelY + 4, '▶', () => {
      this._betIndex = Math.min(BET_OPTIONS.length - 1, this._betIndex + 1);
      this._updateBetDisplay();
    });

    // ── Spin button ──
    this._spinBtn = this.add.image(width / 2, controlY, 'spin-btn')
      .setDisplaySize(128, 128)
      .setInteractive({ useHandCursor: true });

    this._spinBtn.on('pointerdown', () => this._onSpinPressed());
    this._spinBtn.on('pointerover', () => this._spinBtn.setScale(1.06));
    this._spinBtn.on('pointerout', () => this._spinBtn.setScale(1));

    // Pulse animation on the spin button when idle.
    this._idleTween = this.tweens.add({
      targets: this._spinBtn,
      scaleX: 1.04,
      scaleY: 1.04,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    // ── Win label ──
    this._winLabel = this.add.text(width / 2, controlY - 110, '', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ffdd00',
      stroke: '#aa5500',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
  }

  // ── Spin logic ─────────────────────────────────────────────────────────────

  _onSpinPressed() {
    if (this._spinning) return;

    const bet = BET_OPTIONS[this._betIndex];

    if (!playerData.spendCoins(bet)) {
      this._showOutOfCoins();
      return;
    }

    this._spinning = true;
    this._spinBtn.disableInteractive();
    this._idleTween.pause();
    this._winLabel.setAlpha(0);
    this._updateCoinDisplay();

    this._slotMachine.spin(bet).then(({ results, win, payout, multiplier, line }) => {
      this._spinning = false;
      this._spinBtn.setInteractive({ useHandCursor: true });
      this._idleTween.resume();

      if (win && payout > 0) {
        playerData.addCoins(payout);
        this._updateCoinDisplay();
        this._showWinLabel(payout);

        // Update leaderboard when this win sets a new personal best.
        if (payout > playerData.biggestWin) {
          leaderboard.updateScore(payout);
        }

        // Trigger share for huge wins.
        if (multiplier >= BIG_WIN_MULTIPLIER) {
          this._showBigWinCelebration(payout);
          share.shareBigWin(payout);
        }
      }

      // Show interstitial every 20 spins.
      if (playerData.totalSpins % 20 === 0) {
        adsManager.showInterstitialAd();
      }

      // No coins left?
      if (playerData.coins <= 0) {
        this._showOutOfCoins();
      }

      // Broadcast coin update to HUD.
      this.events.emit('coinsUpdated', playerData.coins);
    });
  }

  // ── Daily bonus ────────────────────────────────────────────────────────────

  _checkDailyBonus() {
    playerData.claimDailyBonus().then((claimed) => {
      if (!claimed) return;

      const { width, height } = this.scale;
      const panel = this.add.graphics();
      panel.fillStyle(0x1a0a2e, 0.92);
      panel.fillRoundedRect(width / 2 - 160, height / 2 - 80, 320, 160, 16);
      panel.lineStyle(3, 0xffdd00, 1);
      panel.strokeRoundedRect(width / 2 - 160, height / 2 - 80, 320, 160, 16);

      const msg = this.add.text(width / 2, height / 2 - 30,
        `🎁 Daily Bonus!\n+${playerData.DAILY_BONUS_COINS} coins`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '22px',
          color: '#ffdd00',
          align: 'center',
        }).setOrigin(0.5);

      const closeBtn = this._makeTextButton(width / 2, height / 2 + 48, '  Collect!  ', () => {
        this.tweens.add({
          targets: [panel, msg, closeBtn],
          alpha: 0,
          duration: 300,
          onComplete: () => { panel.destroy(); msg.destroy(); closeBtn.destroy(); },
        });
        this._updateCoinDisplay();
        this.events.emit('coinsUpdated', playerData.coins);
      }, { fontSize: '18px', color: '#1a0a2e', backgroundColor: '#ffdd00', padding: { x: 16, y: 8 } });
    });
  }

  // ── Out-of-coins panel ────────────────────────────────────────────────────

  _showOutOfCoins() {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 1);
    panel.fillRoundedRect(width / 2 - 180, height / 2 - 120, 360, 240, 20);
    panel.lineStyle(3, 0x9933ff, 1);
    panel.strokeRoundedRect(width / 2 - 180, height / 2 - 120, 360, 240, 20);

    const title = this.add.text(width / 2, height / 2 - 80, "You're out of coins!", {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ff4444',
    }).setOrigin(0.5);

    // Track all UI elements so they can all be destroyed together.
    const uiElements = [overlay, panel, title];

    const destroyAll = () => uiElements.forEach((el) => el.destroy());

    const adBtn = this._makeTextButton(width / 2, height / 2 - 20, '🎬 Watch Ad (+50 coins)', () => {
      adsManager.showRewardedAd().then(({ rewarded }) => {
        if (rewarded) {
          playerData.addCoins(50);
          this._updateCoinDisplay();
          this.events.emit('coinsUpdated', playerData.coins);
          destroyAll();
        }
      });
    }, { fontSize: '16px', color: '#ffffff', backgroundColor: '#5522aa', padding: { x: 12, y: 10 } });
    uiElements.push(adBtn);

    const shopBtn = this._makeTextButton(width / 2, height / 2 + 50, '🛍️ Visit Shop', () => {
      destroyAll();
      this.scene.launch('Shop');
    }, { fontSize: '16px', color: '#1a0a2e', backgroundColor: '#ffdd00', padding: { x: 12, y: 10 } });
    uiElements.push(shopBtn);
  }

  // ── Win display ────────────────────────────────────────────────────────────

  _showWinLabel(amount) {
    this._winLabel.setText(`WIN  +${amount} 🪙`);
    this._winLabel.setAlpha(1);
    this.tweens.add({
      targets: this._winLabel,
      y: this._winLabel.y - 20,
      alpha: 0,
      delay: 1800,
      duration: 600,
      onComplete: () => {
        this._winLabel.y += 20;
      },
    });
  }

  _showBigWinCelebration(amount) {
    const { width, height } = this.scale;

    const bigWin = this.add.text(width / 2, height / 2, `🎉 BIG WIN!\n${amount} COINS`, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ffdd00',
      stroke: '#aa5500',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: bigWin,
      scale: 1.1,
      duration: 400,
      ease: 'Back.easeOut',
      yoyo: false,
      onComplete: () => {
        this.tweens.add({
          targets: bigWin,
          alpha: 0,
          delay: 2000,
          duration: 600,
          onComplete: () => bigWin.destroy(),
        });
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _updateCoinDisplay() {
    this.events.emit('coinsUpdated', playerData.coins);
  }

  _updateBetDisplay() {
    this._betText.setText(`${BET_OPTIONS[this._betIndex]}`);
  }

  /**
   * Create a styled interactive text button.
   * Returns the Text object so callers can destroy it if needed.
   */
  _makeTextButton(x, y, label, callback, style = {}) {
    const defaultStyle = {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#5522aa',
      padding: { x: 14, y: 8 },
    };
    const btn = this.add
      .text(x, y, label, { ...defaultStyle, ...style })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', callback);
    return btn;
  }
}
