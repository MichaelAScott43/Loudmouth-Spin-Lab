import Phaser from 'phaser';
import iapManager from '../monetization/IAPManager.js';
import playerData from '../game/PlayerData.js';
import adsManager from '../monetization/AdsManager.js';

/**
 * ShopScene – modal overlay that lets players purchase coin packs via IAP,
 * or earn coins by watching rewarded ads if IAP is unavailable.
 */
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Shop' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const { width, height } = this.scale;

    this._buildOverlay(width, height);
    this._buildHeader(width);
    this._buildCoinPacksOrFallback(width, height);
    this._buildCloseButton(width);
  }

  // ── Overlay backdrop ───────────────────────────────────────────────────────

  _buildOverlay(width, height) {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 1);
    panel.fillRoundedRect(24, 80, width - 48, height - 120, 20);
    panel.lineStyle(3, 0x9933ff, 1);
    panel.strokeRoundedRect(24, 80, width - 48, height - 120, 20);
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  _buildHeader(width) {
    this.add.text(width / 2, 110, '🛍️  Coin Shop', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '26px',
      color: '#ffdd00',
      stroke: '#6600cc',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // Current balance.
    this.add.image(width / 2 - 60, 154, 'coin-icon').setDisplaySize(22, 22);
    this._balanceText = this.add.text(width / 2 - 34, 154, `${playerData.coins} coins`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ccaaff',
    }).setOrigin(0, 0.5);
  }

  // ── Products ───────────────────────────────────────────────────────────────

  _buildCoinPacksOrFallback(width, height) {
    iapManager.initialize().then(() => {
      const products = iapManager.getCatalog();

      if (products.length === 0) {
        this._buildAdFallback(width, height);
      } else {
        this._buildProductList(width, products);
      }
    }).catch(() => {
      this._buildAdFallback(width, height);
    });
  }

  _buildProductList(width, products) {
    const startY = 200;
    const rowH = 90;

    products.forEach((product, idx) => {
      const y = startY + idx * rowH;
      this._buildProductRow(width, y, product);
    });
  }

  _buildProductRow(width, y, product) {
    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x2d1055, 1);
    rowBg.fillRoundedRect(40, y, width - 80, 76, 12);
    rowBg.lineStyle(1, 0x6633cc, 0.6);
    rowBg.strokeRoundedRect(40, y, width - 80, 76, 12);

    // Coin icon
    this.add.image(70, y + 38, 'coin-icon').setDisplaySize(30, 30);

    // Product name
    this.add.text(108, y + 16, product.title || product.productID, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '15px',
      color: '#ffffff',
    }).setOrigin(0, 0);

    // Description / coin count
    const coinCount = iapManager.COIN_GRANTS[product.productID] || '?';
    this.add.text(108, y + 38, `+${coinCount} coins`, {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffdd00',
    }).setOrigin(0, 0);

    // Price & buy button.
    const priceStr = product.price || '...';
    const buyBtn = this.add.text(width - 54, y + 38, priceStr, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '14px',
      color: '#1a0a2e',
      backgroundColor: '#ffdd00',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    buyBtn.on('pointerover', () => buyBtn.setAlpha(0.8));
    buyBtn.on('pointerout', () => buyBtn.setAlpha(1));
    buyBtn.on('pointerdown', () => this._onPurchase(product.productID, buyBtn));
  }

  _buildAdFallback(width, height) {
    this.add.text(width / 2, 200, 'IAP not available in this context.\nEarn coins by watching ads!', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aaaacc',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Show ad offers.
    const adOffers = [
      { label: '🎬 Watch Ad • +50 coins',  reward: 50,  type: 'rewarded' },
      { label: '🎬 Watch Ad • +100 coins', reward: 100, type: 'rewarded' },
    ];

    adOffers.forEach((offer, idx) => {
      const y = 290 + idx * 90;
      const btn = this.add.text(width / 2, y, offer.label, {
        fontFamily: 'Arial Black, Arial',
        fontSize: '17px',
        color: '#1a0a2e',
        backgroundColor: '#ffdd00',
        padding: { x: 20, y: 12 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setAlpha(0.8));
      btn.on('pointerout', () => btn.setAlpha(1));
      btn.on('pointerdown', () => {
        btn.disableInteractive().setAlpha(0.5);
        adsManager.showRewardedAd().then(({ rewarded }) => {
          if (rewarded) {
            playerData.addCoins(offer.reward);
            this._balanceText.setText(`${playerData.coins} coins`);
            this._notifyGame();
          }
          btn.setInteractive({ useHandCursor: true }).setAlpha(1);
        });
      });
    });
  }

  // ── Purchase flow ──────────────────────────────────────────────────────────

  _onPurchase(productID, btn) {
    btn.disableInteractive().setAlpha(0.5);

    iapManager.purchase(productID).then(({ success, coins }) => {
      if (success && coins > 0) {
        playerData.addCoins(coins);
        this._balanceText.setText(`${playerData.coins} coins`);
        this._notifyGame();
        this._showFeedback(`✅ +${coins} coins added!`, '#44ff88');
      } else {
        this._showFeedback('Purchase failed. Please try again.', '#ff4444');
      }
      btn.setInteractive({ useHandCursor: true }).setAlpha(1);
    }).catch(() => {
      this._showFeedback('Purchase cancelled.', '#aaaaaa');
      btn.setInteractive({ useHandCursor: true }).setAlpha(1);
    });
  }

  /** Safely emit coinsUpdated to Game scene (guard against scene not being active). */
  _notifyGame() {
    const gameScene = this.scene.get('Game');
    if (gameScene) {
      gameScene.events.emit('coinsUpdated', playerData.coins);
    }
  }

  _showFeedback(message, color) {
    const { width, height } = this.scale;
    const msg = this.add.text(width / 2, height - 160, message, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 2000,
      duration: 500,
      onComplete: () => msg.destroy(),
    });
  }

  // ── Close button ───────────────────────────────────────────────────────────

  _buildCloseButton(width) {
    const closeBtn = this.add.text(width - 40, 90, '✕', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ff4444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setAlpha(0.7));
    closeBtn.on('pointerout', () => closeBtn.setAlpha(1));
    closeBtn.on('pointerdown', () => this.scene.stop('Shop'));
  }
}
