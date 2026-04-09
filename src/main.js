/**
 * Game entry point.
 * Bootstraps FBInstant (real or mock), then starts the Phaser game.
 */

import Phaser from 'phaser';
import FBInstantMock from './fbinstant-mock.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import ShopScene from './scenes/ShopScene.js';

// Use the real SDK when available (loaded via <script> tag in index.html),
// otherwise fall back to the local mock for development.
const FBInstant = typeof window !== 'undefined' && window.FBInstant
  ? window.FBInstant
  : FBInstantMock;

// Expose globally so scenes and managers can access it without circular imports.
window.FBInstant = FBInstant;

const gameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#1a0a2e',
  parent: 'game-canvas',
  scene: [BootScene, PreloadScene, GameScene, HUDScene, ShopScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Initialise the FB SDK before creating the game so the loading
// progress bar is driven from BootScene onwards.
FBInstant.initializeAsync().then(() => {
  const game = new Phaser.Game(gameConfig);
  // Attach game instance for debugging convenience.
  window.__game = game;
});
