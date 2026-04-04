/**
 * Share – wraps FBInstant share/invite APIs.
 *
 * For the share image we use a 1×1 transparent PNG encoded as base64.
 * In production this would be replaced with a canvas screenshot of the
 * winning reels captured via Phaser's renderer snapshot API.
 */

// Minimal valid 1×1 transparent PNG (68 bytes) as a base64 data URI.
const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export class Share {
  /**
   * Share a big-win moment to the player's Facebook timeline / stories.
   * @param {number} amount - Coin amount won.
   */
  async shareBigWin(amount) {
    try {
      await window.FBInstant.shareAsync({
        intent: 'SHARE',
        image: PLACEHOLDER_IMAGE,
        text: `I just won ${amount} coins in Loudmouth Spin Lab! 🎰🎉 Can you beat my score?`,
        data: { type: 'big_win', amount },
      });
    } catch (err) {
      // Share is optional; user may have declined.
      console.warn('[Share] shareBigWin failed:', err);
    }
  }

  /**
   * Invite friends to play Loudmouth Spin Lab.
   */
  async inviteFriends() {
    try {
      await window.FBInstant.shareAsync({
        intent: 'INVITE',
        image: PLACEHOLDER_IMAGE,
        text: 'Join me in Loudmouth Spin Lab – the wildest slot machine on Facebook! 🎰',
        data: { type: 'invite' },
      });
    } catch (err) {
      console.warn('[Share] inviteFriends failed:', err);
    }
  }
}

export default new Share();
