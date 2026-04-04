import Phaser from 'phaser';

/**
 * BootScene – first scene to run.
 * Sets initial SDK loading progress and hands off to PreloadScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    window.FBInstant.setLoadingProgress(10);
    this.scene.start('Preload');
  }
}
