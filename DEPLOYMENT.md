# Loudmouth Spin Lab – Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Facebook App Setup](#facebook-app-setup)
3. [Environment Variables](#environment-variables)
4. [Local Development](#local-development)
5. [Build for Facebook](#build-for-facebook)
6. [Upload to Facebook](#upload-to-facebook)
7. [Deploy API to Vercel](#deploy-api-to-vercel)
8. [Vercel Environment Variables](#vercel-environment-variables)
9. [Facebook Review Checklist](#facebook-review-checklist)
10. [Monetization Setup Checklist](#monetization-setup-checklist)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 LTS | https://nodejs.org |
| npm | ≥ 9 | bundled with Node |
| Vercel CLI | latest | `npm i -g vercel` |
| zip | system | `apt install zip` / pre-installed on macOS |
| Facebook Developer account | – | https://developers.facebook.com |

---

## 2. Facebook App Setup

### 2.1 Create a new Facebook App

1. Go to **https://developers.facebook.com/apps** and click **Create App**.
2. Choose **"Games"** as the app type.
3. Fill in your app name (`Loudmouth Spin Lab`) and contact email.
4. Note your **App ID** and **App Secret** from **Settings → Basic**.

### 2.2 Enable Instant Games

1. From the App Dashboard, click **Add Product** → **Instant Games**.
2. Complete the store listing:
   - Display name, short description, genre (Casino), age rating (17+).
   - Upload a 1024 × 1024 app icon and at least one screenshot.
3. Under **Instant Games → Details**, set the **Game URL** to your Vercel deployment (added later).

### 2.3 Register the Leaderboard

1. In the App Dashboard go to **Instant Games → Leaderboards**.
2. Click **+ Create Leaderboard**.
   - Name: `loudmouth.biggest.win`
   - Sort order: **Descending** (higher score is better)
   - Score format: **Numeric**

### 2.4 Set Up IAP Products

1. Go to **Instant Games → In-App Purchases**.
2. Create four products matching the `COIN_GRANTS` map in `api/verify-purchase.js`:

   | Product ID   | Title           | Price  |
   |--------------|-----------------|--------|
   | `coins_100`  | 100 Coin Pack   | $0.99  |
   | `coins_500`  | 500 Coin Pack   | $3.99  |
   | `coins_1000` | 1000 Coin Pack  | $6.99  |
   | `coins_5000` | 5000 Coin Pack  | $24.99 |

3. Set each product to **"Consumable"** type.

### 2.5 Configure Audience Network Ad Placements

1. Go to **Monetization Manager** (https://business.facebook.com/monetizationmanager).
2. Create a new **Property** for your app.
3. Add two **Ad Placements**:
   - **Rewarded Video** – copy the Placement ID into `src/monetization/AdsManager.js` as `REWARDED_PLACEMENT_ID`.
   - **Interstitial** – copy the Placement ID as `INTERSTITIAL_PLACEMENT_ID`.

---

## 3. Environment Variables

Create a `.env` file in the project root (this file is gitignored):

```dotenv
# Facebook credentials (server-side only – never expose these in client code)
FB_APP_ID=your_app_id_here
FB_APP_SECRET=your_app_secret_here

# Exposed to Vite's client bundle (safe – this is a public ID)
VITE_FB_APP_ID=your_app_id_here
```

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Start the Vite dev server (hot reload, mock SDK active)
npm run dev
```

Open **http://localhost:5173** in your browser. The FBInstant mock kicks in
automatically because `window.FBInstant` is not set by the real SDK script in
a non-Facebook context.

---

## 5. Build for Facebook

```bash
npm run build:fb
```

This runs `vite build` (outputs to `dist/`) then zips the entire `dist/`
directory into `loudmouth-spin-lab.zip` in the project root.

The resulting zip is what you upload to Facebook.

---

## 6. Upload to Facebook

1. In the App Dashboard, go to **Instant Games → Web Hosting**.
2. Click **+ Upload Version**.
3. Select `loudmouth-spin-lab.zip`.
4. Once processing completes, click **★ Set as Production** to make it live.
5. Use **QA Tool** (also on the Web Hosting page) to test inside a Facebook
   context before submitting for review.

---

## 7. Deploy API to Vercel

The serverless functions under `api/` handle purchase verification and
server-side player data.

```bash
# First-time setup (login and link project)
vercel login
vercel link

# Deploy to production
vercel --prod
```

Vercel will give you a deployment URL like `https://loudmouth-spin-lab.vercel.app`.
Update the **Game URL** in your Facebook App Dashboard to this URL.

---

## 8. Vercel Environment Variables

After deploying, add the environment variables in the Vercel dashboard
(**Settings → Environment Variables**) or via the CLI:

```bash
vercel env add FB_APP_ID
vercel env add FB_APP_SECRET
```

Alternatively, create Vercel secret references:

```bash
vercel secrets add fb-app-id "your_app_id"
vercel secrets add fb-app-secret "your_app_secret"
```

These map to the `@fb-app-id` and `@fb-app-secret` references in `vercel.json`.

Redeploy after adding secrets:

```bash
vercel --prod
```

---

## 9. Facebook Review Checklist

Before submitting the game for Facebook review:

- [ ] App icon uploaded (1024 × 1024 px, no alpha).
- [ ] At least 3 gameplay screenshots provided.
- [ ] Store listing text (description, genre, age rating) complete.
- [ ] Age rating set to **17+** (casino content).
- [ ] Game loads and is playable via the QA Tool without errors.
- [ ] Instant Games policies accepted in the App Dashboard.
- [ ] Privacy Policy URL provided under **Settings → Basic**.
- [ ] Data Deletion Callback URL implemented (required for GDPR/CCPA).
- [ ] No real-money gambling – coins are virtual and have no real-world value.
- [ ] IAP products reviewed and approved in the Products section.
- [ ] Leaderboard created and named correctly (`loudmouth.biggest.win`).

---

## 10. Monetization Setup Checklist

### In-App Purchases
- [ ] Products created in the App Dashboard (see §2.4).
- [ ] `COIN_GRANTS` map in `api/verify-purchase.js` matches the product IDs.
- [ ] `IAPManager.COIN_GRANTS` in `src/monetization/IAPManager.js` matches.
- [ ] `/api/verify-purchase` deployed and reachable from the Vercel URL.
- [ ] `FB_APP_ID` and `FB_APP_SECRET` set in Vercel environment.

### Audience Network Ads
- [ ] Monetization Manager property linked to your Facebook App.
- [ ] Rewarded Video placement created; ID set in `AdsManager.js`.
- [ ] Interstitial placement created; ID set in `AdsManager.js`.
- [ ] Audience Network policy compliance reviewed (no incentivised clicks on interstitials).

### Tips
- Test IAP with Facebook's **Test Users** before going live.
- Use `FBInstant.payments.getPurchasesAsync()` on startup to restore
  unconsumed purchases (already handled in `IAPManager`).
- Monitor ad fill rates in Monetization Manager; low fill is normal at launch.
