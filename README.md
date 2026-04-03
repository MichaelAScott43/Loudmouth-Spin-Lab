# 🎰 Loudmouth Spin Lab

Dr. Loudmouth's casino spin-lab game — available on **iOS**, **Android**, and **Facebook Instant Games**.

Built with [Expo](https://expo.dev/) (React Native) so a single JavaScript codebase targets all three platforms.

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` (for store builds) |

```bash
npm install
```

---

## Running Locally

```bash
# iOS Simulator (requires macOS + Xcode)
npm run ios

# Android Emulator (requires Android Studio)
npm run android

# Web / Facebook Instant Games preview
npm run web
```

---

## Building for Stores

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) to produce signed store-ready binaries.

### 1. Log in to Expo

```bash
eas login
```

### 2. Build for Android (Google Play)

```bash
npm run build:android
```

Produces an **AAB** (Android App Bundle) ready for upload to the Google Play Console.

### 3. Build for iOS (App Store)

```bash
npm run build:ios
```

Produces an **IPA** ready for upload to App Store Connect via [EAS Submit](https://docs.expo.dev/submit/introduction/) or Transporter.

### 4. Submit directly from EAS

```bash
# Android → Google Play
eas submit --platform android

# iOS → App Store Connect
eas submit --platform ios
```

> **Before submitting:** fill in your credentials in `eas.json` (`appleId`, `ascAppId`, `appleTeamId`) and supply a `google-services-key.json` service-account file for Android. These files are excluded from the repository via `.gitignore`.

---

## Facebook Instant Games

### Web build

```bash
npm run build:web
```

The output is placed in `dist/`. Compress the entire `dist/` folder to a ZIP and upload it in the [Facebook Developer Portal](https://developers.facebook.com/apps/) under **Instant Games → Web Hosting**.

### SDK integration

* The Facebook Instant Games SDK is loaded via `web/index.html` (the custom HTML template used for the web build).
* `src/utils/fbInstant.js` wraps `FBInstant.initializeAsync()`, `FBInstant.startGameAsync()`, leaderboard score posting, and win-sharing.
* On iOS/Android the same wrapper returns safe no-op stubs, so the game code is identical across all platforms.

### Configuration

1. Replace `"YOUR_FACEBOOK_APP_ID"` in `app.json` → `expo.extra.facebookAppId` with your real App ID.
2. Update `fbapp-config.json` with your game details.

---

## Running Tests

```bash
npm test
```

---

## Project Structure

```
├── App.js                   # Root component — FB Instant Games init + navigation
├── app.json                 # Expo config (iOS, Android, Web)
├── eas.json                 # EAS Build & Submit config
├── fbapp-config.json        # Facebook Instant Games config
├── web/
│   └── index.html           # Custom HTML template with FB Instant Games SDK
├── assets/                  # App icons, splash screen, favicon
└── src/
    ├── components/
    │   ├── SlotMachine.js
    │   ├── SpinButton.js
    │   └── ScoreBoard.js
    ├── screens/
    │   ├── HomeScreen.js
    │   └── GameScreen.js
    ├── utils/
    │   ├── gameLogic.js     # Spin logic, payout calculation
    │   └── fbInstant.js     # Facebook Instant Games SDK wrapper
    └── __tests__/
        ├── gameLogic.test.js
        └── fbInstant.test.js
```
