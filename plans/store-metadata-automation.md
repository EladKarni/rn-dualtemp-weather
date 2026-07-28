# Store Metadata Automation Plan

> **Status: 📋 Planned — not started.** Written 2026-07-25.
> Blocked on credentials (see [Prerequisites](#prerequisites)) and on the iOS widget
> fixes tracked separately in [ios-home-widgets-implementation.md](./ios-home-widgets-implementation.md).

## Problem

Store listings are stale and drift further with every release. Updating them is a
manual, multi-console chore, so it doesn't happen.

## Current state (audited 2026-07-25)

| | App Store | Google Play | Repo |
|---|---|---|---|
| Version | 2.0.0, released Feb 18 | 2.0.0, updated Feb 10 2026 | **2.1.0** |
| Description | original 2019-era copy | original 2019-era copy | — |
| Screenshots | count unconfirmed | count unconfirmed (lazy-loaded) | **none exist** |
| Feature graphic | n/a | required, **not in repo** | — |

**2.1.0 was bumped in the repo but never shipped.** 43 commits have landed since the
Feb 10 release, several user-visible: 6-language localization of error surfaces and
widget chrome, GPS coordinates no longer sent to Sentry, offline handling, refetch on
GPS movement and app resume, TypeScript strict mode, ~834 LOC of dead code removed.

Neither store description mentions **widgets, multi-location, forecasts, sunrise/sunset,
or the 6 supported languages** — all shipped in 2.0.0. A current Play review reads:

> "For now I have to keep my other weather app too because I want the widget so I can
> see the temp without needing to open the app."

The app has had that widget since 2.0.0. The listing is actively costing installs.

### Drift found in the repo

- [app.json](../app.json) `name` is `"Dualtemp Weather"`; both stores, the website, and
  the location-permission string in the same file use `"DualTemp Weather"`.
- Version is duplicated in three places: `package.json`, `app.json` `expo.version`, and
  `app.json` `ios.buildNumber`. `eas.json` uses `appVersionSource: remote`, so the local
  `buildNumber` is vestigial.
- `package.json` declares a `generate:icons` script pointing at `scripts/generate-dev-icons.js`,
  which does not exist. `scripts/` is empty.
- Unrelated but worth fixing: `.env.local` defines `EXPO_PUBLIC_SENTRY_AUTH_TOKEN`.
  [.env.example](../.env.example) explicitly warns against that prefix — it inlines the
  token into the client bundle.

## Verified platform constraints

Checked against the local `eas-cli` 16.28.0 source and current store docs.

- **EAS Metadata is iOS text only.** No screenshots, no Android. It *does* support a
  dynamic `store.config.js` resolved via `require` (`build/metadata/config/resolve.js`),
  so listing copy can derive from one source file with no generated artifact to drift.
- **iOS screenshots require the App Store Connect API directly** (reserve → upload →
  commit with MD5 checksum), or `fastlane deliver`.
- **Play requires the Android Publisher API** for everything. `changesNotSentForReview`
  on `edits.commit` gives draft-safe behaviour.
- **Release-note limits differ 8×**: Apple 4,000 chars, Play 500. The 2.0.0 notes would
  not fit Play — the source format needs per-store variants, not one shared blob.
- **iPad screenshots are mandatory** while `supportsTablet: true`.
- Apple auto-scales down from the largest supplied size; supplying 6.9" iPhone + 13" iPad
  covers every device.

### Character limits to enforce

| Field | Apple | Play |
|---|---|---|
| Name / title | 30 | 30 |
| Subtitle | 30 | — |
| Short description | — | 80 |
| Description | 4,000 | 4,000 |
| Keywords | 100 total | — |
| Promo text | 170 | — |
| Release notes | 4,000 | **500** |

### Asset specs

| Asset | Spec |
|---|---|
| iPhone 6.9" screenshot | 1320×2868 portrait, 1–10, no alpha |
| iPad 13" screenshot | 2064×2752 portrait, 1–10, no alpha |
| Play phone screenshot | 1080×1920 min, 2–8, 9:16, no alpha |
| Play tablet screenshot | 16:9 / 9:16, min 4 for Large-screen quality |
| Play feature graphic | 1024×500, no alpha |
| Play icon | 512×512 32-bit PNG, ≤1024 KB |

## Design

Two independent halves, deliberately decoupled:

- **Capture** — macOS only, run when the UI changes. Maestro flows over iOS Simulator
  and Android emulator, `sharp` post-processing to exact store dimensions. Output
  committed to `store/screenshots/`.
- **Push** — runs anywhere (WSL or CI), every release. Uploads whatever is committed.

The Mac is therefore only needed when the UI actually changes, not for routine metadata
updates.

### Chosen options

Confirmed with the owner on 2026-07-25:

- Trigger: **local command + CI on `v*` tag**.
- Safety: **draft / no auto-release** — never auto-submits for review.
- Locales: **English only** for store listings (the app itself stays 6-language).
- Screenshots: **native capture on the owner's Mac** (both simulators available).

## Phases

### Phase 0 — validate what exists (no credentials)

- Extract current live copy into `store/metadata/en-US.json` as the source of truth.
- Collapse version to `package.json` only; `app.config.js` derives `version` and
  `ios.buildNumber`. Remove the duplicates from `app.json`.
- Fix the `Dualtemp` → `DualTemp` casing.
- `yarn store:lint` enforcing every character limit and asset spec in the tables above.

Fully runnable and verifiable today. Nothing leaves the machine.

### Phase 1 — read-only diff (first credentialed step)

`yarn store:diff` pulls both live listings via API and diffs against the repo source.
Cannot mutate anything. This proves the integrations work and settles the open questions
the public HTML scrape couldn't (actual Play screenshot count and current release notes).

### Phase 2 — text + release notes push

- iOS: dynamic `store.config.js` + `eas metadata:push`.
- Android: Android Publisher API — `edits.insert` → `listings.update` → `tracks.patch`
  for release notes → `commit` with `changesNotSentForReview`.
- Release notes drafted from git log into `store/release-notes/<version>.{apple,play}.md`
  for human editing — generated notes are a starting draft, never auto-published copy.

### Phase 3 — screenshots

Depends on the iOS widget fixes landing first (see below).

- Maestro flows capture app screens on both platforms.
- **Widget screenshots** are a separate path from app screens — see
  [Widget screenshots](#widget-screenshots).
- `sharp` normalizes to exact store dimensions and strips alpha.
- Upload: ASC API for iOS, Publisher API `images.upload` for Play.
- Produce the missing 1024×500 feature graphic.

### Phase 4 — CI on `v*` tag

Bump version, regenerate note drafts, push metadata + screenshots, stop before submission.

## Widget screenshots

Widgets are the app's strongest differentiator and are absent from both listings. They
cannot be captured by a normal UI-automation flow, because the widget lives on the OS
home screen, not in the app.

- **iOS** — the reliable, deterministic route is rendering the SwiftUI widget views
  directly at exact `WidgetFamily` dimensions (`ImageRenderer`, iOS 16+) and compositing
  onto a home-screen background, rather than automating Springboard widget placement.
  The existing `#Preview` blocks in `targets/widget/widgets.swift` already define fixture
  data that can be reused for this.
- **Android** — `react-native-android-widget` can render widgets headlessly; the existing
  `assets/widget-preview/*.png` were produced this way and prove the path works.

**Blocker:** iOS widget quality issues must be fixed before they are photographed for the
store. Tracked separately — see the iOS widget findings.

## Prerequisites

Neither credential exists locally today:

- `serviceKey.json` — Google Play service account. `eas.json` already references it at
  `./serviceKey.json` for submissions.
- App Store Connect API key (`.p8`) — needed for screenshot upload and for
  `eas metadata:push` in CI. Interactive local runs can use Apple ID +
  `EXPO_APPLE_APP_SPECIFIC_PASSWORD` instead.

For CI both must be added as encrypted repository secrets.

## Open decisions

1. **iPad** — produce 13" iPad screenshots, or set `supportsTablet: false` and drop the
   requirement?
2. **Next version** — ship the 43 commits as 2.1.0, or bump to 2.2.0 given the scope?
3. **Feature graphic** — designer/source file available, or generate from the app's
   gradient + icon?

## Notes

- `eas metadata:push` targets the current editable App Store version. If no version is in
  "Prepare for Submission" state, expect it to fail — create the version first.
- Play listing text changes may still require review even when pushed with
  `changesNotSentForReview`; the flag controls submission, not reviewability.
