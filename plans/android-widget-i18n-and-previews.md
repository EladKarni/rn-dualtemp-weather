# Android Widgets: i18n Fix, Location Fallback, Preview Refresh

> **Status: 📋 Planned — not started.** Written 2026-07-28.
> Successor to green-gate finding V8 (deferred) and the stale-preview discovery
> from the 2026-07-28 widget session.

## How widget refresh actually works today (verified in code)

Documented here because it drives both the copy and the preview content:

1. **Tap = refresh in place.** Every widget root sets `clickAction="REFRESH"`;
   [widgetTaskHandler.tsx](../src/widgets/widgetTaskHandler.tsx) handles the
   click in a headless JS task: renders a localized "Refreshing..." state,
   network-fetches, falls back to cached data on failure, re-renders. **The app
   never opens on tap.**
2. **Auto-update every 30 minutes** — `updatePeriodMillis: 1800000` in app.json
   fires `WIDGET_UPDATE` → cache-if-fresh, fetch-if-stale.
3. **App-driven repaint** — `useForecastStore` calls `updateAllWeatherWidgets`
   whenever the app itself fetches fresh data, so widgets update immediately
   while the app is in use.

So the "Tap to refresh" footer is *behaviorally* accurate; its problem is only
that the string is hardcoded English.

## Problems

1. **Hardcoded English in the Standard widget** (green-gate V8):
   [WeatherStandard.tsx:197](../src/widgets/WeatherStandard.tsx) renders the
   literal `text="Tap to refresh"`. Every other piece of widget chrome went
   through the b5cd4fa localization pass; this one was missed. He/ar/zh/es/fr
   users see English on their home screen.
2. **Widget data path is GPS-only — now a real hole.** `fetchWeatherForWidget`
   and `handleWidgetRefresh` read **only** `GPS_LOCATION_ID`. Since the
   GPS-optional port (`ba8e9ed`), a user can decline location and use manual
   cities exclusively — for them every widget permanently shows "Weather data
   unavailable / Tap to retry" while the app works fine. The widget is the
   feature keeping users on the app (per the Play review quoted in
   [store-metadata-automation.md](./store-metadata-automation.md)); it must not
   require GPS when the app doesn't.
3. **Widget picker previews are stale.** The three `assets/widget-preview/*.png`
   (referenced as `previewImage` in app.json) date from the original February
   widget PR and misrepresent every widget: Compact shows an impossible
   `9°C / 9°F` conversion with no icon; Standard shows one vertical column
   instead of the horizontal 4-hour strip; Extended shows a retired
   current-conditions layout instead of the daily-forecast list.

## Phase 1 — Localize the footer (and sweep)

- Add `WidgetTapToRefresh` to all six locale files, next to the existing
  `Widget*` keys. Translations, modeled on `WidgetTapToRetry` so the two verbs
  stay consistent per language:

  | Locale | `WidgetTapToRetry` (existing) | `WidgetTapToRefresh` (new) |
  |---|---|---|
  | en | Tap to retry | Tap to refresh |
  | he | הקש כדי לנסות שוב | הקש כדי לרענן |
  | ar | اضغط لإعادة المحاولة | اضغط للتحديث |
  | es | Toca para reintentar | Toca para actualizar |
  | fr | Touchez pour réessayer | Touchez pour actualiser |
  | zh | 点按以重试 | 点按以刷新 |
- Replace the literal in `WeatherStandard.tsx` with `i18n.t("WidgetTapToRefresh")`.
  The widget render path hydrates the language store before rendering
  (`ensureStoresHydrated`), so `i18n.t` is safe here — same mechanism the
  fallback widgets already use.
- Sweep `src/widgets/` for any other unlocalized literals (known candidate:
  `'Current Location'` fallback strings in the data path).
- Gate: i18nParity test should force the six-locale addition automatically.

*(A background-task chip for this already exists — "Localize the Android widget
'Tap to refresh' footer".)*

## Phase 2 — Widget location fallback (GPS-optional parity)

The GPS-only assumption lives in **two files, five sites**, and hides a second,
pre-existing bug found while speccing this (2026-07-28):

- [widgetTaskHandler.tsx](../src/widgets/widgetTaskHandler.tsx):
  `fetchWeatherForWidget()`, `getGpsLocationOrWarn()` (used by
  `handleWidgetRefresh`), and the catch-path cache fallback all read only
  `GPS_LOCATION_ID`.
- [widgetUpdater.tsx](../src/widgets/widgetUpdater.tsx):
  `updateAllWeatherWidgets()` bails entirely when no GPS entry exists — so for
  a manual-cities-only user, the iOS payload is **never written** and the
  Android app-driven repaint never fires.
- **Cross-location mislabel (pre-existing):**
  `useForecastStore.setWeatherData(locationId, weather)` calls
  `updateAllWeatherWidgets(weather)` on *every* save — including background
  prefetches of non-GPS cities — and the updater labels whatever payload it
  gets with the GPS location's name. A background refresh of Paris repaints
  the home-screen widget with Paris temperatures under the GPS city's name
  until the next 30-minute cycle corrects it.

### Fix

1. Pure resolver in `src/widgets/utils/widgetDataUtils.ts`:

   ```ts
   resolveWidgetLocation(
     savedLocations: SavedLocation[],
     activeLocationId: string | null,
   ): SavedLocation | null
   // precedence: GPS entry ?? active location ?? first saved ?? null
   ```

2. `widgetTaskHandler.tsx`: all five reads go through the resolver; cache
   reads/writes key off the resolved location's id (not `GPS_LOCATION_ID`).
3. `updateAllWeatherWidgets(weather, locationId)`: callers pass which location
   the payload belongs to; the updater resolves the widget location and
   **skips the repaint when the ids differ** — closing the mislabel bug. Both
   call sites updated: `useForecastStore.setWeatherData` (passes its
   `locationId`) and `TempUnitSelector` (passes the resolved location's cached
   weather + id).
4. iOS payload (`updateIOSWidgetData`) gets the resolved location's name —
   fixed by (3) since it lives inside the updater.
5. Tests: resolver fallback matrix (gps+active / active-only / neither-resolves
   / empty) in `widgetDataUtils` tests; updater skip-on-mismatch case added to
   the existing widgetUpdater suite.

- Open decision: should the widget follow the *active* location before falling
  back to GPS? Today's contract is "widget = current location". Keeping GPS
  first preserves that; switching to active-first changes widget semantics.
  Default: **GPS first** (no semantic change), revisit after user feedback.

## Phase 3 — Regenerate the picker previews

> **Done 2026-07-28** on the owner's Pixel_9a AVD: release build placed all
> three widgets with live New York data (added via the manual-city flow — an
> incidental on-device verification of the GPS-optional port and the Phase 2
> resolver, since the device has no GPS entry). Widgets were sized to their
> representative forms (Standard 2-col, Extended 4-row), screencapped, cropped
> with a 16dp rounded-corner alpha mask, and written over
> `assets/widget-preview/{Compact,Standard,Extended}.png`. Rebuild + picker
> check confirms the new previews render. Raw home-screen capture saved to
> `store/screenshots/widgets/android/home-widgets.png` for the store plan.

Run **after** Phases 1–2 so the captures show the final UI (localized footer).

1. On the Mac: launch the Android emulator, install a dev/preview build, open
   the app once so weather data and payloads exist.
2. Place all three widgets on a clean home-screen page; size Standard wide
   (4 columns) and Extended tall so they show their real layouts.
3. Capture: `adb exec-out screencap -p > /tmp/home.png`, crop per widget.
4. Overwrite `assets/widget-preview/{Compact,Standard,Extended}.png` (same
   filenames — app.json needs no change). Match each widget's real cell aspect
   ratio; the old portrait-aspect crops are part of why the previews mislead.
5. Verify in the widget picker on the emulator (previews bake into the APK's
   manifest at build time — needs a rebuild after replacing the PNGs).
6. These same captures feed the store-screenshot plan's Android widget shots
   (`store/screenshots/widgets/android/`) — capture once, crop twice.

## Phase 4 (optional, iOS, small) — gallery preview polish

`getSnapshot` in [widgets.swift](../targets/widget/widgets.swift) returns nil
data before the app ever writes a payload, so a fresh install's widget gallery
shows the bare `--° 🌤️` placeholder. Return `previewWeatherData()` fixtures
when `context.isPreview` so the gallery always shows a realistic widget
(~5 lines; WidgetKit convention).

## Verification

- Phase 1: `npm run gate` (i18nParity enforces ×6); switch app language to he,
  refresh a widget on the emulator, confirm the footer is Hebrew and RTL-sane.
- Phase 2: unit tests for the resolver matrix; on the emulator, deny location,
  add a manual city, place a widget — it must show that city's weather; tap
  must refresh it.
- Phase 3: widget picker on the emulator shows previews matching the placed
  widgets side by side.
