# Quacksters

Mobile onboarding companion for **Quackteow Group** staff, based on QT-HR-OPS-001 (30 · 60 · 90 Day Integration Programme).

Built with **React**, **TypeScript**, **Tailwind CSS**, and **Capacitor** for Android.

## Features

- Interactive roadmap dashboard with phase timeline
- Role-filtered checklists (Cook, Cashier, Supervisor)
- Self-registration with HR approval workflow
- Web admin console at `/admin` (registrations, users, hire progress, programme CMS)
- Live programme editor backed by Supabase (tasks, resources, milestones, outlets)
- Role-based admin navigation (admin, supervisor, GM, HR Ops, EXCO)
- Progress synced to Supabase (with local offline cache on device)
- Resource hub with SOP links
- Milestone reminders (Day 7, 15, 30, 45, 60, 90)
- Native Android shell with splash screen, status bar, and haptics

## Supabase setup

1. Create a **dedicated Supabase project** for Quacksters.
2. Apply migrations:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or run each file in supabase/migrations/ via the SQL editor, in order.
```

Key migrations:

| Migration | Purpose |
|-----------|---------|
| `20260519000000_quacksters_auth_schema.sql` | Auth, profiles, hire progress |
| `20260519140000_programme_content.sql` | Programme tables + `get_programme()` |
| `20260519140100_programme_seed.sql` | Seed from QT-HR-OPS-001 mock data |
| `20260519140200_programme_admin_rpcs.sql` | Admin write RPCs for programme CMS |
| `20260519150000_outlets_and_audit.sql` | Outlets config + admin audit log |
| `20260520100000_audit_hr_actions_reorders_password_reset.sql` | HR auditing, user update audit/password flag, programme list reorders |
| `20260520100500_fix_admin_list_users_signature.sql` | Drops and recreates `admin_list_users` (new column; PG forbids REPLACE on row-type change) |
| `20260520103000_audit_log_filters_complete_password_change.sql` | Audit log RPC: filters + offset paging; `complete_password_change()` for audited self‑service password clears |

After pulling this migration, run `supabase db push` on your project (staging first), then smoke-test **Admin → Audit** (filters, load more, CSV) and forced password reset → new password → profile no longer flagged.

Regenerate the programme seed after editing mock data:

```bash
npm run generate:programme-seed
```

3. Copy environment variables:

```bash
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your project settings
```

4. Bootstrap the first admin (see `supabase/seed.sql`):
   - Create a user in Supabase Auth
   - Run the SQL update to set `access_role = 'admin'`

5. In Supabase Auth settings, disable email confirmation for local dev (optional).

Without `.env`, the app runs in **offline mode** with local-only profile setup (legacy behaviour). A banner appears when programme content falls back to cached/mock data.

## Auth and admin routes

| Route | Purpose |
|-------|---------|
| `/register` | Self-register (pending HR approval) |
| `/login` | Sign in |
| `/reset-password` | Required password change when `password_reset_required` |
| `/pending` | Awaiting approval / rejection status |
| `/` | Mobile onboarding app (approved hires) |
| `/admin` | Admin dashboard |
| `/admin/registrations` | Approve/reject queue (HR Ops, Admin) |
| `/admin/users` | User and role management (Admin, HR Ops, GM) |
| `/admin/hires/:id` | Hire onboarding progress detail |
| `/admin/checklist` | Manager checklist (Supervisor, GM) |
| `/admin/programme` | Programme CMS (Admin only) |
| `/admin/audit` | Audit log (Admin + HR Ops) |

### Admin navigation by role

| Role | Nav items |
|------|-----------|
| `admin` | Dashboard, Programme, Audit log, Registrations, Users |
| `supervisor` | Dashboard, My checklist |
| `gm` | Dashboard, My checklist, Users |
| `hr_ops` | Dashboard, Audit log, Registrations, Users |
| `exco` | Dashboard (read-only) |

### Access roles

| Role | Description |
|------|-------------|
| `pending` | Registered, awaiting approval |
| `hire` | New hire — mobile onboarding |
| `supervisor` | Outlet supervisor (SUP) |
| `gm` | General Manager |
| `exco` | Executive Committee (read-only admin) |
| `hr_ops` | HR Operations — registration approval |
| `admin` | Full system admin |

Job roles (`cook`, `cashier`, `supervisor`) are separate and control checklist filtering.

## Quick start (web)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke test (starts preview server) |
| `./scripts/run-android.sh` | Clean + `installDebug` + launch MainActivity (needs `adb device`) |
| `npm run generate:programme-seed` | Regenerate programme seed SQL from mock data |

## Deploy web app (GitHub Pages)

The workflow [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds the Vite SPA and publishes **`dist/`** to **GitHub Pages** on every push to `main` or `master` (and can be run manually via **Actions → Deploy GitHub Pages → Run workflow**).

### One-time repository setup

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment:** set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. **Settings → Secrets and variables → Actions** — add repository secrets (same values as local `.env`; **anon** key only — never `service_role`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

If secrets are missing, the build still succeeds but the deployed site runs without Supabase ([offline behaviour](#supabase-setup)).

### Published URL

| Repository type | Example URL | `VITE_BASE_PATH` in CI |
|-----------------|-------------|-------------------------|
| Project repo `owner/repo` | `https://owner.github.io/repo/` | `/<repo>/` |
| Site repo named `owner.github.io` | `https://owner.github.io/` | `/` |

[Vite](vite.config.ts) reads **`VITE_BASE_PATH`** at build time; local/Android builds omit it so **`base` stays `./`** for Capacitor.

### Supabase redirect URLs

In the Supabase Dashboard → **Authentication → URL configuration**, allow your Pages origin (e.g. `https://owner.github.io/repo/` and variants Supabase lists).

### APK vs Pages

Installing **Android release APK** ([Release build](#release-build)) bundles web assets from **`npm run cap:sync`** at build time. **Updating Pages does not update installed APKs** unless you add a separate live-update mechanism.

### Ship `app-release.apk` with GitHub Releases

After building **`android/app/build/outputs/apk/release/app-release.apk`** locally, open **GitHub → Releases → Draft a new release**, attach the APK, and publish. Use a **private** repository if the binary must stay internal-only.

Automating signed APK builds in Actions requires storing keystore material as encrypted secrets—left as a future enhancement unless your team standardizes it.

## Android development

Step-by-step from clone to **`app-debug.apk`** on an emulator or USB device: **[docs/android-apk-walkthrough.md](docs/android-apk-walkthrough.md)**. With a device connected (`adb devices`), **`./scripts/run-android.sh`** performs clean + install + launch.

### Prerequisites

- Android Studio with SDK installed
- JDK (bundled with Android Studio)

### Environment

```bash
source scripts/android-env.sh
```

Default SDK path: `~/Library/Android/sdk`

### Sync web build to Android

```bash
npm run cap:sync
```

### Open in Android Studio

```bash
npm run cap:android
```

### Run on emulator or device

```bash
source scripts/android-env.sh
cd android && ./gradlew installDebug
adb shell am start -n com.quackteow.onboarding/.MainActivity
```

## Release build

1. Generate a signing keystore:

```bash
chmod +x scripts/generate-keystore.sh
./scripts/generate-keystore.sh
```

2. Copy and edit signing config:

```bash
cp android/keystore.properties.example android/keystore.properties
# Update passwords in keystore.properties
```

3. Build release APK:

```bash
npm run cap:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

For Play Store, use `./gradlew bundleRelease` to produce an AAB.

## App identity

| Field | Value |
|-------|-------|
| App name | Quacksters |
| Package ID | `com.quackteow.onboarding` |
| Version | 1.0.0 (versionCode 2) |

## Project structure

```
src/
├── components/
│   ├── admin/      # Web admin console + programme editor
│   ├── auth/       # Login, register, route guards
│   ├── dashboard/  # Mobile dashboard
│   ├── onboarding/ # Welcome / hire confirmation
│   └── ...
├── context/        # Auth, outlets, programme, onboarding state
├── data/           # Fallback roadmap data from QT-HR-OPS-001
├── lib/            # Supabase, permissions, programme API, storage
└── types/          # TypeScript interfaces
supabase/
├── migrations/     # Database schema + RLS + programme RPCs
└── seed.sql        # Bootstrap admin instructions
android/            # Capacitor Android project
scripts/            # android-env.sh, run-android.sh, generate-keystore.sh, generate-programme-seed.mjs
```

## CI

GitHub Actions runs ESLint, Vitest, production build, and a Playwright smoke test on push/PR to `main` or `master`.

A separate workflow **Deploy GitHub Pages** (see [Deploy web app (GitHub Pages)](#deploy-web-app-github-pages)) publishes the SPA to Pages on pushes to `main`/`master` when Pages is enabled.

When developing locally: `npx playwright install chromium` once if `npm run test:e2e` fails to find browsers.

## Confidentiality

Internal use only. Aligned to QT-SOP-OPS-002 v3.0.
