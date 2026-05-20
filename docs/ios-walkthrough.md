# Walkthrough: iOS app on simulator or device

Linear checklist from clone to running Quacksters on iOS. Stop at any failing step and fix it before continuing.

## Preconditions (once per Mac)

1. **Xcode** from the Mac App Store (Command Line Tools alone are not enough).
2. After installing Xcode, point the active developer directory at it:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -version
```

3. **Node.js** (CI uses Node 22 — see `.github/workflows/ci.yml`).
4. Repository root is the folder that contains `package.json` and `ios/`.

## Phase A — Install JS deps

From repo root:

```bash
npm ci
```

(or `npm install` if you are not using lockfile workflows.)

**Checkpoint:** Command exits with no npm errors.

## Phase B — Configure Supabase for a real backend (recommended)

Capacitor bundles the built web assets at sync time; Supabase URL and key are baked in when you run **`npm run build`** (via Vite).

1. Copy `.env.example` → `.env`.
2. Set **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** from Supabase Dashboard → **Project Settings → API**, using the **`anon` `public`** JWT — never **`service_role`** in `.env`.

If you skip `.env`, the app can fall back to offline/mock behaviour (see README); login, programme data, and admin flows against your database will not work as expected.

**Checkpoint:** `.env` exists with correct **`anon`** values **before** `npm run cap:sync` / archive builds.

## Phase C — Backend schema (when using Supabase)

If the app must talk to your real project database:

1. Apply migrations (`supabase db push` or run SQL files in order under `supabase/migrations/`) — see README.
2. Bootstrap at least one admin user (`supabase/seed.sql` describes the pattern).

**Checkpoint:** Optional smoke test: `npm run dev`, sign in against Supabase in the browser before relying on the native build.

## Phase D — Sync web build into iOS

From repo root:

```bash
npm run cap:sync
```

This runs `npm run build`, copies `dist/` into `ios/App/App/public`, and updates native plugin wiring.

**Checkpoint:** No errors from `cap sync`. Re-run after every web change you want on device.

## Phase E — Open in Xcode

```bash
npm run cap:ios
```

Or open **`ios/App/App.xcodeproj`** manually in Xcode.

## Phase F — Run on simulator

1. In Xcode, select a simulator (e.g. **iPhone 16**) from the scheme/device menu.
2. Press **Run** (▶) or `Cmd+R`.

**Checkpoint:** App launches with the Quacksters splash, then the onboarding UI.

## Phase G — Run on a physical iPhone (development)

1. Connect the device via USB (or use wireless debugging after pairing).
2. Xcode → **Signing & Capabilities** → select your **Team** (Apple ID or organization).
3. Xcode may prompt to register the device; accept.
4. Choose your iPhone as the run destination and press **Run**.

First launch on device: **Settings → General → VPN & Device Management** → trust your developer certificate if iOS blocks the app.

**Checkpoint:** App installs and opens on the phone.

## Phase H — Distribution (TestFlight / App Store)

1. In Xcode, set **Signing & Capabilities** for **Release** with a distribution certificate.
2. **Product → Archive**, then **Distribute App** (App Store Connect or Ad Hoc).
3. For internal testing, upload to **TestFlight** from App Store Connect.

Unlike GitHub Pages, **updating the web site does not update installed iOS builds** unless you ship a new binary (or add a separate live-update mechanism).

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| `xcodebuild requires Xcode` | Install full Xcode; run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| Signing errors | Add your Apple ID under Xcode → Settings → Accounts; pick a Team on the App target |
| Blank white screen after sync | Re-run `npm run cap:sync`; confirm `dist/` built successfully |
| Notifications never appear | Allow notifications when prompted; check **Settings → Quacksters → Notifications** on device |
| Stale UI after code changes | Always `npm run cap:sync` before rebuilding in Xcode |

## App identity

| Field | Value |
|-------|-------|
| Display name | Quacksters |
| Bundle ID | `com.quackteow.onboarding` |
| Version | 1.0.0 (build 2) |
