/**
 * Facebook Instant Games SDK wrapper.
 *
 * On web:  Loads the real FBInstant SDK injected by index.html and
 *          calls initializeAsync → startGameAsync.
 * On native: Returns safe no-op stubs so the same JS code runs on
 *            iOS / Android without modification.
 */

const noop = () => Promise.resolve();

const STUB_PLAYER = { name: 'Player', photo: null };

/** Returns true when running inside an FB Instant Games context. */
export function isFBInstantReady() {
  return (
    typeof window !== 'undefined' &&
    typeof window.FBInstant !== 'undefined'
  );
}

/**
 * Initialise the Facebook Instant Games SDK.
 * Returns an object with the player's { name, photo } (or defaults).
 */
export async function initFBInstant() {
  if (!isFBInstantReady()) return STUB_PLAYER;

  const FBInstant = window.FBInstant;

  await FBInstant.initializeAsync();
  await FBInstant.startGameAsync();

  const player = FBInstant.player;
  return {
    name: player.getName() || 'Player',
    photo: player.getPhoto() || null,
  };
}

/** Post a score to the FB Instant leaderboard (no-op on native). */
export async function postScore(score) {
  if (!isFBInstantReady()) return;
  try {
    const leaderboard = await window.FBInstant.getLeaderboardAsync(
      'high_scores'
    );
    await leaderboard.setScoreAsync(score);
  } catch (e) {
    console.warn('FBInstant postScore error:', e);
  }
}

/** Share a custom update when the player wins (no-op on native). */
export async function shareWin(score) {
  if (!isFBInstantReady()) return;
  try {
    await window.FBInstant.updateAsync({
      action: 'CUSTOM',
      cta: 'Play Now',
      image: '',
      text: {
        default: `I just scored ${score} coins on Loudmouth Spin Lab! Can you beat me?`,
        localizations: {},
      },
      template: 'win_share',
      strategy: 'LAST',
      notification: 'NO_PUSH',
    });
  } catch (e) {
    console.warn('FBInstant shareWin error:', e);
  }
}
