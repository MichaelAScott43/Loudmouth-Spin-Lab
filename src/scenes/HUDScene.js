import Phaser from 'phaser';
import playerData from '../game/PlayerData.js';
import adsManager from '../monetization/AdsManager.js';
import leaderboard from '../social/Leaderboard.js';

/**
 * HUDScene – runs in parallel with GameScene.
 * Shows: player avatar, player name, coin count, shop/ad/leaderboard buttons.
 */
export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const { width } = this.scale;

    this._buildTopBar(width);
    this._buildActionButtons(width);
    this._listenToGame();
  }

  // ── Top bar ────────────────────────────────────────────────────────────────

  _buildTopBar(width) {
    // Semi-transparent top stripe.
    const bar = this.add.graphics();
    bar.fillStyle(0x0d0020, 0.85);
    bar.fillRect(0, 0, width, 70);

    // Player avatar (circle with initials or photo).
    this._buildAvatar(36, 35);

    // Player name.
    this._nameText = this.add
      .text(80, 20, playerData.playerName || 'Player', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ccaaff',
      })
      .setOrigin(0, 0);

    // Coin icon + count.
    this.add.image(80, 48, 'coin-icon').setDisplaySize(22, 22).setOrigin(0, 0.5);

    this._coinText = this.add
      .text(106, 48, `${playerData.coins}`, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '18px',
        color: '#ffdd00',
      })
      .setOrigin(0, 0.5);
  }

  _buildAvatar(x, y) {
    const photo = playerData.playerPhoto;

    if (photo) {
      // Try to load the photo URL as a Phaser texture, then display it.
      if (!this.textures.exists('player-photo')) {
        this.load.image('player-photo', photo);
        this.load.once('complete', () => {
          this._drawAvatarImage(x, y, 'player-photo');
        });
        this.load.start();
      } else {
        this._drawAvatarImage(x, y, 'player-photo');
      }
    } else {
      this._drawInitialsAvatar(x, y);
    }
  }

  _drawAvatarImage(x, y, textureKey) {
    const circle = this.add.image(x, y, textureKey)
      .setDisplaySize(48, 48)
      .setCircle(24);
    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillCircle(x, y, 24);
    circle.setMask(mask.createGeometryMask());
  }

  _drawInitialsAvatar(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0x6633cc, 1);
    g.fillCircle(x, y, 24);
    g.lineStyle(2, 0xcc88ff, 1);
    g.strokeCircle(x, y, 24);

    const initials = (playerData.playerName || 'P').charAt(0).toUpperCase();
    this.add.text(x, y, initials, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  // ── Action buttons ─────────────────────────────────────────────────────────

  _buildActionButtons(width) {
    // Shop button (top-right corner).
    this._makeButton(width - 16, 35, '🛍️', 'Shop', () => {
      if (!this.scene.isActive('Shop')) {
        this.scene.launch('Shop');
      }
    }).setOrigin(1, 0.5);

    // Watch Ad button.
    this._makeButton(16, 110, '🎬 +50', 'Watch Ad', () => {
      adsManager.showRewardedAd().then(({ rewarded }) => {
        if (rewarded) {
          playerData.addCoins(50);
          this._updateCoins(playerData.coins);
          this.scene.get('Game').events.emit('coinsUpdated', playerData.coins);
        }
      });
    }).setOrigin(0, 0.5);

    // Leaderboard button.
    this._makeButton(width - 16, 110, '🏆', 'Leaderboard', () => {
      leaderboard.showLeaderboard(this);
    }).setOrigin(1, 0.5);
  }

  _makeButton(x, y, icon, tooltip, callback) {
    const btn = this.add
      .text(x, y, icon, {
        fontFamily: 'Arial',
        fontSize: '28px',
        backgroundColor: '#2d1055',
        padding: { x: 8, y: 4 },
      })
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setAlpha(0.75);
      // Show tooltip.
      if (!this._tooltip) {
        this._tooltip = this.add.text(x, y + 32, tooltip, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#000000cc',
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 0);
      }
    });

    btn.on('pointerout', () => {
      btn.setAlpha(1);
      if (this._tooltip) {
        this._tooltip.destroy();
        this._tooltip = null;
      }
    });

    btn.on('pointerdown', callback);
    return btn;
  }

  // ── Game event listener ────────────────────────────────────────────────────

  _listenToGame() {
    const gameScene = this.scene.get('Game');
    if (!gameScene) return;

    gameScene.events.on('coinsUpdated', (coins) => {
      this._updateCoins(coins);
    });
  }

  _updateCoins(coins) {
    if (this._coinText) {
      this._coinText.setText(`${coins}`);

      // Brief scale-bounce to draw attention.
      this.tweens.add({
        targets: this._coinText,
        scaleX: 1.2,
        scaleY: 1.2,
        yoyo: true,
        duration: 120,
      });
    }
    if (this._nameText) {
      this._nameText.setText(playerData.playerName || 'Player');
    }
  }
}
