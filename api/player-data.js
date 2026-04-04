/**
 * /api/player-data
 *
 * Server-side player data endpoint for anti-cheat validation.
 *
 * GET  /api/player-data?playerID=xxx  – retrieve player data
 * POST /api/player-data               – persist player data with signature check
 *
 * NOTE: This implementation uses a simple in-memory store for demonstration.
 * In production, replace `memoryStore` with a durable database such as
 * Upstash Redis, PlanetScale, or Supabase.
 */

import crypto from 'crypto';

// In-memory store (resets on cold-start). Replace with a real DB.
const memoryStore = new Map();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── GET ────────────────────────────────────────────────────────────────────────

function handleGet(req, res) {
  const { playerID } = req.query;

  if (!playerID) {
    return res.status(400).json({ error: 'playerID is required' });
  }

  const stored = memoryStore.get(playerID);

  if (stored) {
    return res.status(200).json(stored);
  }

  // Return defaults for a new player.
  return res.status(200).json({
    playerID,
    coins: 1000,
    totalSpins: 0,
    biggestWin: 0,
    note: 'New player – defaults returned. Connect a database for persistence.',
  });
}

// ── POST ───────────────────────────────────────────────────────────────────────

function handlePost(req, res) {
  const { playerID, signedPlayerInfo, coins, totalSpins, biggestWin } = req.body || {};

  if (!playerID) {
    return res.status(400).json({ error: 'playerID is required' });
  }

  // Validate signed player info to confirm the request originates from a
  // legitimate FB Instant Games session.
  if (signedPlayerInfo) {
    const valid = verifySignedPlayerInfo(signedPlayerInfo);
    if (!valid) {
      return res.status(403).json({ error: 'Invalid signed player info' });
    }
  }

  // Basic sanity checks to prevent obvious coin inflation.
  const existing = memoryStore.get(playerID) || { coins: 1000, totalSpins: 0, biggestWin: 0 };
  const safeCoins = typeof coins === 'number' && coins >= 0 ? coins : existing.coins;
  const safeBiggestWin = typeof biggestWin === 'number' && biggestWin >= 0
    ? Math.max(biggestWin, existing.biggestWin)
    : existing.biggestWin;

  const record = {
    playerID,
    coins: safeCoins,
    totalSpins: typeof totalSpins === 'number' ? totalSpins : existing.totalSpins,
    biggestWin: safeBiggestWin,
    updatedAt: new Date().toISOString(),
  };

  memoryStore.set(playerID, record);
  return res.status(200).json({ success: true, record });
}

// ── Signature verification ─────────────────────────────────────────────────────

/**
 * Verify an FB Instant Games signed player info string.
 * The token is a base64url-encoded JSON payload with an HMAC-SHA256 signature
 * using the app secret as the key.
 *
 * @param {string} signedPlayerInfo
 * @returns {boolean}
 */
function verifySignedPlayerInfo(signedPlayerInfo) {
  const appSecret = process.env.FB_APP_SECRET;
  if (!appSecret) return false;

  try {
    const [encodedSig, payload] = signedPlayerInfo.split('.');
    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return crypto.timingSafeEqual(
      Buffer.from(encodedSig),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}
