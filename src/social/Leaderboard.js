import Phaser from 'phaser';

/**
 * Leaderboard – thin wrapper around FBInstant leaderboard API.
 * Also provides an in-game Phaser overlay to display connected friends' scores.
 */
export class Leaderboard {
  static LEADERBOARD_NAME = 'loudmouth.biggest.win';

  constructor() {
    this._leaderboard = null;
    this._personalBest = 0;
  }

  // ── Score submission ────────────────────────────────────────────────────────

  /**
   * Update the leaderboard if the supplied score beats the player's current entry.
   * @param {number} score
   */
  async updateScore(score) {
    if (score <= this._personalBest) return;

    try {
      const lb = await this._getLeaderboard();
      await lb.setScoreAsync(score);
      this._personalBest = score;
    } catch (err) {
      console.warn('[Leaderboard] updateScore failed:', err);
    }
  }

  /**
   * Fetch the top connected-player entries.
   * @returns {Promise<Array<{ rank: number, name: string, score: number, photo: string|null }>>}
   */
  async getTopEntries() {
    try {
      const lb = await this._getLeaderboard();
      const entries = await lb.getConnectedPlayerEntriesAsync(10, 0);

      return entries.map((entry) => ({
        rank:  entry.getRank(),
        name:  entry.getPlayer().getName() || 'Anonymous',
        score: entry.getScore(),
        photo: entry.getPlayer().getPhoto(),
      }));
    } catch (err) {
      console.warn('[Leaderboard] getTopEntries failed:', err);
      return [];
    }
  }

  // ── In-game overlay ────────────────────────────────────────────────────────

  /**
   * Open a Phaser modal overlay showing the top 10 connected friends.
   * @param {Phaser.Scene} scene
   */
  showLeaderboard(scene) {
    const { width, height } = scene.scale;

    // Dim overlay
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    overlay.setInteractive(); // Catch pointer events so they don't fall through.

    // Panel
    const panelX = 30;
    const panelY = 70;
    const panelW = width - 60;
    const panelH = height - 120;

    const panel = scene.add.graphics();
    panel.fillStyle(0x1a0a2e, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panel.lineStyle(3, 0xffdd00, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    scene.add.text(width / 2, panelY + 24, '🏆 Top Friends', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ffdd00',
    }).setOrigin(0.5, 0);

    // Loading indicator while we fetch entries.
    const loading = scene.add.text(width / 2, panelY + 80, 'Loading…', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaff',
    }).setOrigin(0.5, 0);

    this.getTopEntries().then((entries) => {
      loading.destroy();

      if (entries.length === 0) {
        scene.add.text(width / 2, panelY + 80, 'No friends on the leaderboard yet.\nPlay with friends to compete!', {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: '#aaaacc',
          align: 'center',
        }).setOrigin(0.5, 0);
        return;
      }

      entries.forEach((entry, idx) => {
        const rowY = panelY + 70 + idx * 48;

        // Rank medal for top 3.
        const medals = ['🥇', '🥈', '🥉'];
        const rankLabel = idx < 3 ? medals[idx] : `#${entry.rank}`;

        scene.add.text(panelX + 20, rowY, rankLabel, {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ffdd00',
        }).setOrigin(0, 0.5);

        scene.add.text(panelX + 60, rowY, entry.name, {
          fontFamily: 'Arial',
          fontSize: '15px',
          color: '#ffffff',
          wordWrap: { width: panelW - 140 },
        }).setOrigin(0, 0.5);

        scene.add.text(panelX + panelW - 20, rowY, `${entry.score}`, {
          fontFamily: 'Arial Black, Arial',
          fontSize: '15px',
          color: '#ffdd00',
        }).setOrigin(1, 0.5);
      });
    });

    // Close button
    const closeBtn = scene.add.text(panelX + panelW - 16, panelY + 10, '✕', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '22px',
      color: '#ff4444',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      closeBtn.destroy();
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _getLeaderboard() {
    if (!this._leaderboard) {
      this._leaderboard = await window.FBInstant.getLeaderboardAsync(Leaderboard.LEADERBOARD_NAME);
    }
    return this._leaderboard;
  }
}

export default new Leaderboard();
