# 🎰 Loudmouth Spin Lab

A **Facebook Instant Games** HTML5 slot machine built with **Phaser 3** and **Vite**, with
monetisation via Audience Network ads and in-app purchases, leaderboards, daily bonuses,
and social sharing – all backed by **Vercel serverless functions**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game engine | [Phaser 3](https://phaser.io) |
| Bundler | [Vite 5](https://vitejs.dev) |
| Language | JavaScript (ES Modules) |
| API / backend | [Vercel serverless functions](https://vercel.com/docs/functions) |
| Platform | [Facebook Instant Games 8.0](https://developers.facebook.com/docs/games/instant-games) |

---

## Project Structure

```
loudmouth-spin-lab/
├── api/
│   ├── verify-purchase.js   # IAP receipt verification (Vercel function)
│   └── player-data.js       # Server-side player data / anti-cheat (Vercel function)
├── src/
│   ├── main.js              # Entry point – bootstraps FBInstant + Phaser
│   ├── fbinstant-mock.js    # Full FBInstant SDK mock for local dev
│   ├── scenes/
│   │   ├── BootScene.js     # First scene; hands off to PreloadScene
│   │   ├── PreloadScene.js  # Procedural texture generation + loading bar
│   │   ├── GameScene.js     # Core slot machine gameplay
│   │   ├── HUDScene.js      # Parallel HUD (avatar, coins, buttons)
│   │   └── ShopScene.js     # IAP / ad-offer coin shop overlay
│   ├── game/
│   │   ├── SlotMachine.js   # Animated 3-reel slot with Phaser tweens
│   │   ├── PayTable.js      # Win evaluation + payout multipliers
│   │   └── PlayerData.js    # Persistent player state via FBInstant storage
│   ├── monetization/
│   │   ├── AdsManager.js    # Rewarded + interstitial ad wrapper
│   │   └── IAPManager.js    # In-app purchase flow + server verification
│   └── social/
│       ├── Leaderboard.js   # FBInstant leaderboard + in-game overlay
│       └── Share.js         # Big-win share + friend invite
├── index.html               # HTML entry point (includes FB SDK script tag)
├── vite.config.js           # Single-bundle build config for FB Instant Games
├── vercel.json              # Vercel routing + env references
├── package.json
└── DEPLOYMENT.md            # Full deployment guide
```

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open **http://localhost:5173**. The real Facebook SDK is not loaded in local
dev; the game automatically uses `src/fbinstant-mock.js` instead, so you can
play the full game without a Facebook account.

---

## Building

### Development build

```bash
npm run build && npm run preview
```

### Facebook Instant Games bundle

```bash
npm run build:fb
```

Produces `loudmouth-spin-lab.zip` – ready to upload to the Facebook App
Dashboard under **Instant Games → Web Hosting**.

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the complete step-by-step guide
covering:

- Facebook App setup (leaderboard, IAP products, Audience Network placements)
- Environment variable configuration
- Vercel API deployment
- Facebook review submission checklist
- Monetisation setup checklist

---

## Gameplay

| Feature | Details |
|---------|---------|
| Reels | 3 reels, 3 visible rows, animated scroll with staggered stops |
| Symbols | 8 symbols (Wild, 7, BAR, Bell, Cherry, Watermelon, Orange, Lemon) |
| Payline | Single centre payline |
| Bet sizes | 10 / 25 / 50 / 100 / 250 coins |
| Starting coins | 1 000 (new players) |
| Daily bonus | +100 coins once per calendar day |
| Big win trigger | ≥ 10× bet → auto-share prompt |

### Pay Table

| Combination | Multiplier |
|-------------|-----------|
| Wild · Wild · Wild | 500× |
| 7 · 7 · 7 | 200× |
| BAR · BAR · BAR | 100× |
| Bell · Bell · Bell | 50× |
| Cherry · Cherry · Cherry | 30× |
| Watermelon · Watermelon · Watermelon | 20× |
| Orange · Orange · Orange | 15× |
| Lemon · Lemon · Lemon | 10× |
| Cherry · Cherry · any | 5× |
| Cherry · any · any | 2× |

Wild substitutes for any symbol in three-of-a-kind combinations.

---

## Environment Variables

| Variable | Where used | Description |
|----------|-----------|-------------|
| `FB_APP_ID` | Vercel (server) | Facebook App ID |
| `FB_APP_SECRET` | Vercel (server) | Facebook App Secret (never expose client-side) |
| `VITE_FB_APP_ID` | Vite build (client) | Public App ID for client-side use |

Create a `.env` file in the project root for local development (this file is gitignored).

---

## License

Private – all rights reserved.