# Green-Gate Plan — `fix/env-weather-url-and-geocoding-throw` → merge- & release-ready

**Authored:** 2026-07-16, as the handoff from the full multi-agent codebase review (65 agents, 42 verified findings). **Rev 2** — adversarially verified by 3 independent critics; 35 issues patched (orchestration collisions, gate sequencing, dependency pins, spec corrections).
**Review artifact (verdicts, evidence, deep dives):** https://claude.ai/code/artifact/0098fa45-cb7e-46a4-bd1c-16d1aa8b2fce
**Execute with:** one orchestrator on **Fable 5** (`claude-fable-5`); all worker/verifier subagents on **Opus 4.8** (`model: 'opus'` / `claude-opus-4-8`).
**Scope:** P0 + P1 + P2 (everything). **Git:** local commits only — **never push, never open a PR**. The human reviews and pushes.

---

## 0 · Mission & Definition of Done

Fix every issue from the review needed to merge this branch and ship safely, and stand up a real gate so future releases are machine-checked.

**Done means all of the following are true:**

1. `yarn gate` passes clean: `tsc --noEmit` (with `website/` excluded) + `eslint .` + `jest --ci` — **on the final tree, after the last fix commit**.
2. All three P0 merge blockers are fixed with tests proving the fix.
3. All P1 correctness/release items are fixed with tests.
4. All P2 hygiene items are done (or explicitly dispositioned "won't-fix" with a one-line reason).
5. Every one of the review's **42 findings has a written disposition** (fixed / won't-fix+reason / N-A) in the final summary the orchestrator produces.
6. A `.github/workflows/ci.yml` exists that runs the same gate on push/PR (it activates when the human pushes).
7. Each fix was **adversarially re-reviewed** by an independent Opus agent that read the diff and tried to find a regression (protocol in §2.4).
8. Everything is committed locally in reviewable, conventional commits. Working tree clean. **Nothing pushed.**

**Explicitly out of scope:** deploying/altering the Vercel proxy (spec-only deliverable, §6 Worker M), device/store submission, translations sign-off (agents author them, human reviews), version bump (stays **2.1.0** — it has not shipped).

---

## 1 · Locked decisions — the human has pre-authorized these; do NOT ask again

| # | Decision | Ruling |
|---|----------|--------|
| D1 | OpenWeather attribution (review blocker 2) | **The data source changed. Strip ALL OpenWeather references; add no replacement credit.** Remove: `ProvidedBy`/`OpenWeather` i18n keys (from all six locale files in the same edit), `assets/Images/OpenWeatherLogo.png`, AppFooter dead imports/styles, README credit + key-setup text. KEEP: technical comments referencing OpenWeather *condition-code numbering* in icon maps (they describe the data format), the proxy URL (infra, not ours to rename), and `WeatherTypes.ts` shape. |
| D2 | Scope | Everything: P0 + P1 + P2. |
| D3 | Git | Local commits only. No push, no PR, no remote operations of any kind. |
| D4 | Proxy hardening | Document only — produce `plans/proxy-hardening-spec.md` for the human to apply (§6 Worker M). |
| D5 | i18n authorship | Agents write es/fr/ar/he/zh strings themselves (this covers ANY worker adding keys, incl. Worker F's error keys), register-matched to existing translations, and list every new key + translation in the commit body under `Translations-for-review:`. |
| D6 | Green gate contents | `tsc --noEmit` + `eslint .` (fresh expo flat config) + `jest --ci`, wired as `yarn gate`, mirrored in GitHub Actions. |
| D7 | Background location | Remove `ACCESS_BACKGROUND_LOCATION`, set `isAndroidBackgroundLocationEnabled: false`, use when-in-use permission strings only. No background-location feature is planned. |
| D8 | Version | Keep `2.1.0` everywhere. (P2 makes the footer read it from `expo-constants`.) |
| D9 | Stale-cache invalidation tradeoff | Putting rounded coords in the query key invalidates users' persisted forecast cache **once** after update — accepted. |
| D10 | ESLint churn policy | Expo defaults, correctness rules only. Auto-fix what's safe; for pre-existing stylistic violations prefer rule-level `off` in config over touching hundreds of lines. `react-hooks/rules-of-hooks` must be **error** (it guards the CardFooter class of bug — whose code fix therefore lands in Phase 0, see §3.8). |

---

## 2 · Orchestration protocol

### 2.1 Roles & models
- **Orchestrator (you, Fable 5):** owns sequencing, file-ownership arbitration, gate runs, adversarial-review loops, commit hygiene, and the final 42-finding disposition table. You write no production code yourself except trivial glue; you *do* run `yarn gate` and git commands directly.
- **Workers (Opus 4.8):** one per workstream below. Spawn with `model: 'opus'`. Give each worker: its §-spec verbatim, the KNOWN FACTS block (§2.2), its exclusive file list, and the instruction to write tests for its own changes.
- **Verifiers (Opus 4.8):** read-only adversarial reviewers (§2.4).

### 2.2 KNOWN FACTS — paste into every agent prompt
```
Repo: /home/light/projects/rn-dualtemp-weather, branch fix/env-weather-url-and-geocoding-throw.
- Run `yarn install --frozen-lockfile` ONCE at bootstrap (node_modules is stale; expo-network missing until then).
- Root tsconfig sweeps website/ (a separate Next.js project) until Phase 0 adds an exclude — ignore website/ tsc errors before that.
- android/ and ios/ are gitignored (expo prebuild owns them). Never edit generated native code; native config changes go in app.json/app.config.js/eas.json.
- serviceKey history is clean (verified); serviceKey.example.json is a template — leave it.
- The error taxonomy in src/utils/errors.ts is load-bearing: UI renders error.userMessage and gates Retry on error.recoverable. AuthenticationError/RateLimitError/ServerError/NotFoundError/BadRequestError all extend ApiError. TimeoutError extends NetworkError (NOT ApiError).
- Persisted stores: useLocationStore, useLanguageStore, useSettingsStore — these expose .persist.rehydrate()/.persist.hasHydrated(). useForecastStore (SQLite-backed) and useModalStore are NOT persisted and have NO .persist API — calling it throws.
- The TanStack queryClient is created in index.js; focusManager is importable from @tanstack/react-query.
- Widgets render via react-native-android-widget primitives (TextWidget/FlexWidget) — they CANNOT import React Native components; app/widget component duplication across that boundary is intentional.
- Errors are constructed outside React — i18n resolution happens at render (userMessageKey pattern), never at construction.
- Do not push, do not run eas/expo builds, do not touch the Vercel proxy.
```

### 2.3 File-ownership map (conflict prevention)
Within a phase, workers run in parallel **only** on disjoint file sets. Files listed under a worker are exclusively theirs for that phase. If a worker needs a file it doesn't own, it reports back and the orchestrator sequences the edit instead — the specs below have been pre-checked so this should not occur.

Pre-assigned collision hotspots:
- `src/utils/fetchWeather.ts`, `src/utils/errors.ts` (behavioral changes), `src/utils/httpClient.ts` → **Worker A only** (Phase 1). Worker F's Phase-2 errors.ts change is additive-only (new class + field) and lands in a different phase.
- `App.tsx` → **Worker B** in Phase 1; **Worker F** in Phase 2 (render branches + the one-line mount of E's hook). Never two owners in the same phase.
- `src/widgets/widgetTaskHandler.tsx`, `src/utils/widgetUpdater.tsx`, `src/store/useForecastStore.ts` → **Worker C only** (Phase 1); in Phase 3 they pass J → K → L per the strict Phase-3 order (§6).
- Locale files `src/localization/*.ts` → **Worker D** (Phase 1, deletions ×6 files), **Worker F** (Phase 2, adds error keys ×6), **Worker K** then **Worker I** (Phase 3, in that order).
- `src/utils/geocoding.ts` (searchCities only) → **Worker H** (Phase 2); Worker I deletes `reverseGeocode` in Phase 3 (sequenced after).

### 2.4 Adversarial verification loop (apply the review playbook to the fixes)
After each phase's workers finish and the gate is green:
1. For each workstream, spawn one Opus verifier with the workstream spec + `git diff` of its commits. Instruction: *"Try to refute that this diff implements the spec without regressions. Read callers of every changed function. Check the acceptance criteria one by one. Report CONFIRMED-GOOD or a concrete defect with file:line."*
2. Any defect → back to the owning worker (fresh spawn is fine; include the verifier's report). Fixes land as **follow-up commits** (§2.5). **Re-run `yarn gate` after every fix round, before the verifier re-review.**
3. **Termination rule: cap 3 rounds per workstream.** On round-3 disagreement the orchestrator reads the disputed code directly and rules; record ruling + dissent in the disposition table. Verifier findings *outside the workstream's spec* (pre-existing issues) never block CONFIRMED-GOOD — file them as new rows in the disposition table instead.
4. Phase exit requires: all workstreams CONFIRMED-GOOD (or orchestrator-ruled) **and** gate green on the final tree.
5. **Schema-cap pitfall from the review:** if you use structured-output schemas for verifier fleets, set `maxItems` ≥ what you ask for in prose — a mismatch silently truncates results.
6. **Flaky-gate policy:** a gate failure is real until proven flaky — re-run once; if it passes on retry, the test is flaky and the owning worker must deflake it (fake timers, awaited async, no wall-clock sleeps) before phase exit. Never declare a phase done on a retry-green without a deflake commit.

### 2.5 Commit rules
- Conventional commits. **One commit per workstream for the initial implementation**; verification-loop fixes land as follow-up commits: `fix(review): <workstream> — addresses verifier round N`, carrying the same trailer. Never amend a commit once a verifier has read its diff. Never rebase. Never push.
- Message body lists the findings it closes by review number, e.g. `Closes-review-findings: 1 (S2 breadcrumbs), 7 (base_url normalization)`.
- End every commit message with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- After the final phase: run `yarn gate` one last time, then write the disposition table (§7) to `plans/green-gate-result.md` and commit it.

---

## 3 · Phase 0 — Bootstrap & gate scaffolding (sequential, single worker or orchestrator-driven)

**Owner:** Worker 0 (or orchestrator). **Files:** `package.json`, `yarn.lock`, `tsconfig.json`, `eslint.config.*` (new), `.github/workflows/ci.yml` (new), `test/` (delete), **plus any file needed to make the gate green** — the ownership map starts at Phase 1; Phase 0 may touch anything to reach a green gate, including the minimal CardFooter fix (§3.8).

1. `yarn install --frozen-lockfile`. Confirm `node_modules/expo-network` exists afterward.
2. `tsconfig.json`: add `"exclude": ["website", "node_modules", "dist", "android", "ios", ".expo"]`. Do **not** add path aliases (churn > value in this pass; noted as future work).
3. Test deps — **SDK-matched versions, not latest**: prefer `npx expo install jest-expo jest @types/jest` (Expo resolves SDK-54-compatible versions); if that fails, pin explicitly: `jest@~29.7.0`, `@types/jest@^29`, `jest-expo@~54.0.0`. Also add `@testing-library/react-native@^13` (React-19/RN-0.81 compatible — required by Workers F and J later; installed now because package.json ownership tightens after Phase 0). In `package.json`: `"test": "jest --ci"`, `"jest": { "preset": "jest-expo" }`. Prove the harness with one trivial passing test.
4. ESLint: `yarn add -D eslint@^9 eslint-config-expo@~10.0.0` (the SDK-54-compatible line — do not float to latest). Flat config using the expo preset; register the already-installed `@tanstack/eslint-plugin-query`. Apply decision **D10**: `react-hooks/rules-of-hooks` **error**, `react-hooks/exhaustive-deps` warn, stylistic mass-churn rules off at config level (record which and why in the commit body). `"lint": "eslint ."` with `website/`, `dist/`, `android/`, `ios/` ignored.
5. `"gate": "tsc --noEmit && eslint . && jest --ci"`.
6. `.github/workflows/ci.yml`: on push + PR to `main`: checkout → setup-node 20 + yarn cache → `yarn install --frozen-lockfile` → `yarn gate`. (It activates when the human pushes; do not attempt to trigger it.)
7. Delete `test/store.test.js` and `test/testForecastStore.ts` (unrunnable, misleading — review testing audit). Their intent (store init, `getDatabaseStats`, `updateLastUpdated`) is re-covered by Worker H item 3.
8. **Make the gate green — Phase 0 owns this outcome.** Two known obstacles, pre-resolved:
   - `rules-of-hooks` will (correctly) flag `src/components/CardFooter/CardFooter.tsx:28,34` — hooks below a conditional return. **Apply the minimal code fix now**: move the `useState`/`useEffect` block above the `if (!isHydrated)` early return (the interval effect already guards on `lastTimeUpdated`); behavior otherwise unchanged. Worker F adds the regression tests in Phase 2 and keeps the rest of finding 11's scope.
   - Any remaining pre-existing `tsc` errors after the exclude: fix them directly, even in files other phases own later. If a fix is genuinely entangled (> ~30 min), add a single-line `@ts-expect-error` with `TODO(<owning worker>)` — that worker must remove it in its phase.
9. Commit: `chore: establish green gate (tsc excl. website, eslint expo flat config, jest-expo, CI workflow, CardFooter hooks order)`.

**Acceptance:** `yarn gate` passes end-to-end at Phase-0 exit, no exceptions.

---

## 4 · Phase 1 — P0 merge blockers (Workers A–D in parallel)

### Worker A — `fetchWeather.ts` surgeon
**Files (exclusive):** `src/utils/fetchWeather.ts`, `src/utils/errors.ts`, `src/utils/httpClient.ts`, plus their new `__tests__`.
**Closes review findings:** 3 (partially — the fetch-side Sentry logic), 6, 7, 8; tier-2 "toAppError never matches RN network error".

1. **base_url normalization** (finding 7): at module load — trim; treat `''`/whitespace as unset (fall back to default); append trailing `/` if missing. Export the normalizer as a pure function for tests.
2. **Timeout** (finding 6b): replace bare `fetch(url)` with `fetchWithTimeout(url, 10_000)` from `httpClient.ts`; map `AbortError` → existing `TimeoutError`. Note the widget headless task is killed at 30s — 10s leaves room for the cached-fallback path to run.
3. **Shape validation** (finding 7b): before `return data as Weather`, validate minimally: `typeof data?.current?.temp === 'number' && Array.isArray(data?.daily) && Array.isArray(data?.hourly)`. On failure throw the existing non-JSON-style `ApiError` (`weather_api_invalid_response` path) so a 200-but-wrong-shape response can never be persisted into SQLite as fresh truth.
4. **toAppError network matching** (finding 6c): in `errors.ts` `toAppError`, add case-insensitive `/network request failed|failed to fetch/` → `NoConnectionError` (RN's actual offline TypeError matches neither of the current `'fetch'`/`'network'` checks — verified in review).
5. **Single-report policy** (finding 3a): the catch-block exclusion becomes `if (!(e instanceof ApiError || e instanceof NoConnectionError))` — all API subtypes already extend `ApiError`. Also remove/downgrade the extra `logger.error("Weather API error:", …)` at the top of the !ok branch so each failure produces exactly **one** Sentry event (the `logger.exception` call), not two or three. **Explicit policy: `TimeoutError` IS reported** (it extends NetworkError, so the catch block reports it once, tagged `weather_fetch_network_error`) — timeouts are unexpected anomalies, unlike offline.
6. **User-facing text & recoverability** (finding 8): `BadRequestError` must be constructed **without** piping the server's `data.message` into `userMessage` — server text goes only into the internal `message` and the Sentry `api_message` extra. Add an optional `recoverable` constructor param (defaulting to current values) to `NotFoundError`/`BadRequestError`; at the weather-fetch call sites pass `recoverable: true` (a transient proxy 404 must keep the Retry button). The 2xx-non-JSON `ApiError` sets `recoverable: true` explicitly (its own userMessage says "try again").
7. **body_preview sanitization at source** (part of finding 1): before attaching `body_preview`, strip URL query strings and redact coordinate-like patterns (numbers with ≥3 decimals adjacent to lat/lon-ish markers, plus plain query-string strip). Worker B's scrubber is the backstop; source-side sanitization is the primary.
8. **Tests** (review-mandated tests 1–4 + additions): 401-status and 500-with-"401"-message → `AuthenticationError`; 429 → `RateLimitError(retryAfter)`; 5xx → `ServerError`; 404/400 mapping incl. `recoverable === true` and generic `userMessage` (no server text); 200+HTML → invalid-response `ApiError` with sanitized `body_preview`; 200+wrong-shape JSON → same; offline (`expo-network` mocked) → `NoConnectionError` and **zero** logger.exception calls; timeout → `TimeoutError` and **exactly one** logger.exception call; base_url normalizer table (no-slash, empty, whitespace, correct). Mock `expo-network` and `logger`; no native modules needed.

**Commit:** `fix(fetch): normalize base_url, add timeout+shape validation, single Sentry report per failure, keep Retry on 4xx`

### Worker B — Sentry privacy completion
**Files (exclusive):** `App.tsx`, new `src/utils/sentryScrubbing.ts` + tests.
**Closes:** finding 1 (blocker), finding 3c (render-body log).

1. Create `src/utils/sentryScrubbing.ts` with **pure, exported** functions (testability is the point):
   - `stripUrlQuery(url: string): string`
   - `scrubBreadcrumb(breadcrumb)`: for categories `xhr|fetch|http|console|navigation`, strip query strings from `data.url`, `data.to`, `data.from`, and `message`.
   - `scrubEventValues(event)`: recursive value-based pass over `extra` (all depths), `contexts`, `request.url`, and `exception.values[].value`: strip query strings from any URL-looking string; redact coordinate patterns (same regex family as Worker A). Keep the existing exact-key deletes (latitude/longitude/lat/long/lon/lng) as the first pass.
2. Wire in `App.tsx` `Sentry.init`: `beforeBreadcrumb: scrubBreadcrumb`, and `beforeSend` becomes existing-key-deletes → `scrubEventValues`. Behavior change beyond scrubbing: none.
3. **Render-body log** (finding 3c): the `if (hasForecastError) logger.error(...)` in the component body moves into a `useEffect` keyed on `forecastError`, and skips `NoConnectionError` instances entirely.
4. **Tests:** craft a fake event carrying (a) an xhr breadcrumb with `?lat=32.0853421&long=34.7817676`, (b) `extra.body_preview` echoing a full URL, (c) nested `extra.foo.request_url`, (d) `exception.values[0].value` containing a URL — assert every coordinate/query is gone post-scrub while non-sensitive fields survive. Assert `beforeBreadcrumb` leaves non-http categories untouched.

**Commit:** `fix(privacy): complete S2 — scrub breadcrumb URLs and all event values, not just top-level extras`

### Worker C — Widget pipeline: hydration gate + Sentry noise
**Files (exclusive):** `src/widgets/widgetTaskHandler.tsx`, `src/utils/widgetUpdater.tsx`, `src/store/useForecastStore.ts` + tests.
**Closes:** findings 3b/3d, 5 (blocker-adjacent race); map finding "fallback text says open, action is REFRESH".

1. **Hydration gate** (finding 5): extract one `await ensureStoresHydrated()` helper that awaits **all three persisted stores** — `useLocationStore.persist.rehydrate()`, `useLanguageStore.persist.rehydrate()`, **and `useSettingsStore.persist.rehydrate()`** (widgets already read settings headlessly: `BaseWeatherWidget.tsx:28` reads `tempScale`; Worker K's Phase-3 clock-format fix reads `clockFormat` — the guarantee must cover them). Call it at the top of `handleWidgetRender`'s fetch path, `handleWidgetRefresh`, and `updateAllWeatherWidgets`, **before** reading `savedLocations` / `i18n.locale` / settings. (Do NOT call `.persist` on `useForecastStore`/`useModalStore` — they are not persisted and have no such API.) Only after hydration may the `widget_refresh_no_location` event fire — that's the exact false alarm the review caught.
2. **NoConnectionError gating** (finding 3b): in `handleWidgetRefresh`'s inner catch, report to Sentry only `if (!(refreshError instanceof NoConnectionError))` — offline is expected; keep a `logger.warn` breadcrumb. Same gate on `useForecastStore.refreshWeather`'s catch (downgrade its `logger.error` to `logger.warn`, or gate on the class).
3. **Sticky tag** (finding 3d): delete `logger.setTag('widget_flow','refresh')`. Replace with a per-event tag (`flow: 'widget_refresh'`) added to each `logger.exception` call in the refresh path (the `error_type` tags already disambiguate — keep them).
4. **Fallback text/action mismatch:** the fallback widget's text and its `clickAction` must agree — keep `clickAction: 'REFRESH'` and make the text "Tap to retry" consistently.
5. **Tests:** with mocked stores — refresh path with un-hydrated location store: assert it awaits rehydration and does NOT emit `widget_refresh_no_location` when the hydrated store has the GPS entry; settings values read only post-hydration; offline refresh: assert zero `logger.exception` calls; review-mandated test 6: stale + fetch throws → renders cached weather with original age, no crash.

**Commit:** `fix(widgets): gate headless task on three-store hydration; stop reporting expected offline errors; unstick widget_flow tag`

### Worker D — De-branding (decision D1)
**Files (exclusive):** `src/components/AppFooter/AppFooter.tsx` + its styles, `src/localization/{en,es,fr,ar,he,zh}.ts`, `assets/Images/OpenWeatherLogo.png` (delete), `README.md`.
**Closes:** finding 2 (blocker, per D1), tier-2 "AppFooter cleanup left dead imports/styles/asset".

1. AppFooter: remove now-unused imports (`Linking`, `Image`, `i18n` if unused after removal) and dead styles (`openweatherText`, `linkText`, `weatherLogo`, `geoapifyText`).
2. Delete `ProvidedBy` and `OpenWeather` keys **from all six locale files in the same edit**. Grep to confirm no `i18n.t('ProvidedBy'|'OpenWeather')` call sites remain.
3. Delete `assets/Images/OpenWeatherLogo.png`; grep for references first.
4. README: remove the OpenWeather credit (~line 87) and the obsolete key-acquisition instructions in the setup section (the full README rewrite is Worker L's; here only strip what D1 mandates so the blocker closes in P0).
5. `website/`: `grep -ri openweather website/ --exclude-dir=node_modules` — **as of plan authorship this returns zero hits** (verified twice). If still zero, record "none found — N/A" in the disposition table and move on; do not hunt further.
6. **Keep:** icon-map comments referencing OpenWeather condition-code IDs; the proxy URL; `WeatherTypes.ts`.
7. **Test coordination:** Worker H's i18n parity test reads locale keys dynamically, so these deletions are automatically safe for it.

**Commit:** `chore(branding): remove all OpenWeather references — data source changed, no credit required (owner decision)`

**Phase 1 exit:** gate green → §2.4 verification loop (fix rounds re-run the gate) → all CONFIRMED-GOOD → gate green on final tree.

---

## 5 · Phase 2 — P1 correctness & release safety (Workers E–H in parallel)

### Worker E — Stale-weather recovery & location-switch race
**Files (exclusive):** `src/hooks/useMultiLocationWeather.ts`, `src/hooks/useAppLifecycle.ts` + tests. (**Not** `useLocationStore.ts` — that is F's this phase; if E's design turns out to need a store edit, report back and the orchestrator sequences it after F commits. **Not** App.tsx — see item 2.)
**Closes:** findings 4, 9; tier-2 perf items "unselectored store subscription", "locationLoadingStates rebuilt".

1. **Coords in the query key** (finding 4a, decision D9): active query key becomes `['forecast', i18n.locale, activeLocation?.id, coordKey]` where `` coordKey = `${lat.toFixed(2)},${lon.toFixed(2)}` ``. Apply the same to the prefetch `useQueries` keys. SQLite `placeholderData` still paints instantly, so the one-time persisted-cache invalidation (D9) has no visible cost beyond a background refetch.
2. **focusManager wiring** (finding 4b): add the `AppState.addEventListener('change', s => focusManager.setFocused(s === 'active'))` listener (with cleanup) **inside the existing `useAppLifecycle.ts`** — it is already mounted at `App.tsx:110`, so no App.tsx edit is needed and no new hook is created. Keep the default `refetchOnWindowFocus` (now meaningful): stale-on-resume refetches.
3. **cachedActiveWeather race** (finding 9): store as `{ locationId, weather }`; use it for `placeholderData`/fallback **only when** `locationId === activeLocationId`; clear synchronously on switch; add a cancelled flag in the effect cleanup so a slow SQLite read can't resurrect the old location.
4. **Store subscription hygiene** (tier-2 perf): replace the selector-less `useForecastStore()` with `useForecastStore.getState()` inside callbacks/effects (writes don't need reactivity here); memoize `locationLoadingStates` and callbacks (`useMemo`/`useCallback`) so `LocationPill`'s `React.memo` actually holds.
5. **lastUpdated write contract** (coordinates with F item 3): change the `setLastUpdated(...)` call at `useMultiLocationWeather.ts:190` to write an ISO string: `setLastUpdated(new Date().toISOString())`. Worker F owns the store-type change and the consumers; both specs are explicit so landing order doesn't matter — the gate at phase exit proves the pair.
6. **Tests:** query-key builder unit test (movement > rounding threshold changes key; < threshold doesn't); cachedActiveWeather guard (switch A→B: fallback returns nothing for B until B's read lands; A's late read is discarded); focus wiring (AppState mock → `focusManager.isFocused()` flips).

**Commit:** `fix(data): refetch on GPS movement and app resume; kill stale-location display race`

### Worker F — Render-state machine & location-store edge cases
**Files (exclusive):** `App.tsx`, `src/hooks/useRenderDecision.ts`, `src/hooks/useWeatherLoadingState.ts`, `src/components/CardFooter/CardFooter.tsx` (tests only — code fix landed in Phase 0), `src/store/useLocationStore.ts`, `src/store/useSettingsStore.ts`, `src/components/ErrorAlert/WeatherErrorBanner.tsx`, `src/screens/AddLocationScreen.tsx`, `src/utils/errors.ts` (**additive only**: new class + new optional field — Worker A finished behavioral changes in Phase 1), `src/localization/*.ts` (**additive only**: the two new error keys ×6).
**Closes:** finding 11 (tests + residue); tier-2: double-SkeletonScreen, dangling activeLocationId, dismissedError never resets + dead lastUpdated, silent duplicate drop, MaxLocationsReached discarded.

1. **Single screen state** (tier-2 double-skeleton): extend `useRenderDecision` to return one `screenState: 'loading' | 'skeleton' | 'error' | 'content'` computed with explicit precedence (error > content > loading > skeleton), and replace App.tsx's five independent boolean JSX guards with one `switch`. This eliminates both overlapping-mount cases the review proved. Keep the JSX per state identical. Also add the one-line mount of nothing new — E's focus wiring lives inside `useAppLifecycle`, already mounted.
2. **CardFooter** (finding 11): the hooks-order code fix landed in Phase 0. Here: add the regression test (render pre-hydration, flip `isHydrated` false→true, assert no throw and correct post-hydration render).
3. **dismissedError lifecycle** (tier-2): key the dismissal to the error identity (e.g. `code + message`) and reset it in an effect when `hasForecastError` goes false or the identity changes. **lastUpdated wiring:** delete the dead `lastUpdated` state in `useWeatherLoadingState`; change `useSettingsStore.lastUpdated`'s type to **ISO string** (Worker E changes the writer in the same phase — explicit in E item 5); thread it into `WeatherErrorBanner` (formatting to a relative string at render); update `CardFooter`'s `.fromNow()` consumption to parse the ISO string via moment. **Rehydration tolerance (§8): treat any non-string/legacy persisted value as absent, never throw.**
4. **Dangling activeLocationId** (tier-2): in `removeLocation`, fall back to the GPS entry **only if it exists**, else the first remaining location, else `null`; when `activeLocationId` resolves to no location, `addLocation` sets the new location active (self-heal).
5. **User feedback on add** (tier-2 duplicate/max): pull the render-time i18n mechanism forward — add `userMessageKey?: string` to `AppError` **now** (F owns this additive change; Worker K extends the same mechanism in Phase 3). `addLocation` throws the existing `DuplicateLocationError` (set `userMessageKey: 'DuplicateLocation'` — new key, added to **all six** locale files per D5, translations flagged) on the ~1 km duplicate; add `MaxLocationsError extends UserError` with `userMessageKey: 'MaxLocationsReached'` (key already translated ×6) thrown at the cap. `AddLocationScreen.handleSelectCity` catches and renders `err.userMessageKey ? i18n.t(err.userMessageKey) : err.userMessage`, and does **not** close the modal on failure. This replaces the current `toAppError(new Error(i18n.t('MaxLocationsReached')))` pattern that discards the translation.
6. **Tests:** `useRenderDecision` table test over the full input matrix (assert exactly one screen per state, incl. the two previously-overlapping cases); CardFooter hydration-flip test (uses `@testing-library/react-native`, installed in Phase 0); removeLocation fallback matrix (GPS exists / doesn't / last location); addLocation duplicate & max → typed errors with the right `userMessageKey`; dismissedError resets on new error identity.

**Commit:** `fix(ui-state): mutually-exclusive render states, location-store edge cases, honest add-location feedback, lastUpdated as ISO string`

### Worker G — Permissions, env & platform config
**Files (exclusive):** `app.json`, `app.config.js`, `eas.json`, `.gitignore`, `src/store/useLanguageStore.ts`.
**Closes:** tier-2: background-location (D7), web `getLanguage` crash, `.gitignore` env gaps, eas preview env risk; review build-config concern "sentry plugin registered twice" — verify and fix if real.

1. **Permissions (D7):** remove `ACCESS_BACKGROUND_LOCATION` from `android.permissions`; in the `expo-location` plugin block set `isAndroidBackgroundLocationEnabled: false` and replace `locationAlwaysAndWhenInUsePermission` with `locationWhenInUsePermission` (keep the same user-facing string). Note in the commit body: the human must cut a new build and retract any Play Console background-location declaration (§7).
2. **Web language switch** (tier-2): in `useLanguageStore.setLanguage` (and `initializeLocale`), guard the native `getLanguage()`: compute `deviceLanguage` lazily inside `try/catch` (fallback `'en'`), or `Platform.OS === 'web' ? (navigator.language?.split('-')[0] ?? 'en') : getLanguage().split('-')[0]`. (Full localization-lib consolidation is Worker L's; this minimal crash fix lands regardless.)
3. **.gitignore:** replace the env lines with a complete set: `.env`, `.env.*`, `!.env.example`. Verify `git status` stays clean and no tracked env file exists.
4. **eas.json:** add `EXPO_PUBLIC_WEATHER_API_URL` (current default proxy URL) to the `preview` profile's `env` block so the switch to the hosted `preview` environment can't silently drop it. For `production`, do not guess — flag EAS-dashboard parity as a human follow-up (§7).
5. **Sentry plugin double-registration:** check `app.json` plugins + `app.config.js` for `@sentry/react-native/expo` appearing twice; if confirmed, dedupe (keep the parameterized one).
6. **Tests:** a config assertion test that parses `app.json` and asserts `ACCESS_BACKGROUND_LOCATION` is absent (locks the policy).

**Commit:** `fix(config): drop unused background-location permission, guard native getLanguage on web, complete env gitignore, pin preview env URL`

### Worker H — Test infrastructure & the review's independent suite
**Files (exclusive):** `src/**/__tests__/**` not owned by A–G this phase, `package.json` (jest config tweaks only), `src/utils/geocoding.ts` (**searchCities only** — explicitly H's this phase).
**Closes:** the testing audit's 10-test plan (items not already covered by A/C), i18n parity guard, `formatDataAge` latent-bug documentation, store/database coverage replacing the deleted `test/` files.

1. Review-mandated tests not yet placed: **#5** `formatDataAge` boundaries **0/29/30/59/60/1439/1440** — write it **first**; it documents current intended behavior (`<30 → null`; the `"Just now"` branch is dead) with a TODO referencing Worker K's Phase-3 contract (which **keeps the ≥1440 → "Xd ago" days branch**); **#7** `temperature.ts` known-value table incl. `formatTemperature('F')` and `convertWindSpeed`; **#8** i18n key parity — **dynamic**: read all six locale exports, assert identical sorted key sets (robust to D/F/K/I edits); **#9** `httpClient.mapHttpError`/`handleFetchError` (AbortError→TimeoutError, TypeError→NetworkError — the geocoding re-throw path this branch changed); **#10** `locationNameParser` display-name cases.
2. **searchCities shape guard** (tier-2): `geocoding.ts:68` casts the JSON body to `CityResult[]` with **zero validation** (the only length check in the file is on the query string, not the response). Add an `Array.isArray(data)` guard before the cast (non-array → return `[]` or throw the invalid-response ApiError — pick one, test it), plus the test.
3. **Store/database coverage** (replaces deleted `test/` intent): forecast store init state; `getDatabaseStats`; `updateLastUpdated` round-trip — with the jest-expo SQLite mock. Include: `deleteLocationData` succeeds on a fresh database (guards Worker I's Phase-3 `weather_errors` removal).
4. Coverage config: `collectCoverageFrom: ["src/utils/**", "src/hooks/**", "src/store/**"]` — report-only, no thresholds (avoid gate flakiness).

**Commit:** `test: independent suite — error mapping, formatters, i18n parity, geocoding shape guard, store/database coverage`

**Phase 2 exit:** gate green → verification loop (fix rounds re-run the gate) → CONFIRMED-GOOD → gate green on final tree.

---

## 6 · Phase 3 — P2 hygiene — **STRICTLY SEQUENTIAL: J → K → I → L, gate-green between each. Worker M is the only parallel-safe worker (it only creates a new plans/ file).**

Ordering rationale (verified collisions): J restructures `widgetTaskHandler.tsx`/`widgetDataUtils.ts`/`WeatherExtended.tsx`/`index.js` **before** K localizes strings inside those exact components; K finalizes the locale key set **before** I deletes unused keys; I deletes dead files at their **pre-move paths** before L renames/moves everything; L runs **last** so its renames/moves land on the final file set. I must **not** delete the empty `src/config/` — L populates it.

### Worker J — Duplication extraction (~360 LOC) — runs first
**Files (exclusive this sub-phase):** the clone groups: segmented-control trio + their 3 style files, `src/widgets/components/shared/WeatherIcon.tsx`, `src/widgets/utils/widgetDataUtils.ts`, `src/components/LoadingSkeleton/*`, skeleton files, `src/widgets/WeatherExtended.tsx`, `src/widgets/widgetTaskHandler.tsx`, `src/components/TempText/TempText.tsx`, `index.js`, `src/components/ErrorBoundary/ErrorBoundary.tsx`, + tests.
1. Generic `SegmentedControl<T>` replacing ClockFormatSelector/TempUnitSelector/SunriseSunsetToggle bodies + deleting their three byte-identical style files (preserve TempUnitSelector's `updateAllWeatherWidgets()` side effect via an optional `onAfterChange`). (These deletions happen before L's rename pass — no collision.)
2. Widget emoji icon map: single source in `src/widgets/utils/widgetDataUtils.ts`, imported by widget `WeatherIcon.tsx`; hoist the map to module scope (it currently rebuilds per render).
3. One `SkeletonBox` primitive; delete `LoadingSkeleton.tsx`'s name-colliding exports and compose the detailed skeletons in `SkeletonScreen`; unify placeholder color to the palette-derived style.
4. `WeatherExtended.tsx`: merge `CompactDailyRow`/`DailyItem` into one component with `variant: 'compact' | 'card'`. Do not localize its strings — that's K, next.
5. `widgetTaskHandler.tsx`: extract `renderWidgetWithData(...)` + `getGpsLocationOrWarn()` so the success and cached-fallback paths can't drift.
6. `TempText.tsx`: use `celsiusToFahrenheit` from `utils/temperature`.
7. Root error boundary: extract the shared fallback view + StyleSheet to one module imported by `index.js` and `ErrorBoundary.tsx` (Sentry-aware logic stays only in ErrorBoundary). L will later move this module + slim index.js — J leaves index.js functional.
**Tests:** SegmentedControl selection + callback behavior (`@testing-library/react-native` from Phase 0); icon-map lookup fallback chain; skeleton render.
**Commit:** `refactor: extract SegmentedControl, single widget icon map, SkeletonBox; merge WeatherExtended twins (~360 LOC removed)`

### Worker K — Error-surface & widget i18n (decision D5) — runs second
**Files (exclusive this sub-phase):** `src/localization/*.ts`, `src/utils/errors.ts` (extend F's `userMessageKey` mechanism to remaining classes), `src/screens/ErrorScreen.tsx`, `src/screens/LoadingScreen.tsx`, `src/components/ErrorAlert/WeatherErrorBanner.tsx`, `src/widgets/widgetTaskHandler.tsx` (fallback strings — post-J structure), `src/widgets/WeatherExtended.tsx` (labels — post-J merge), `src/widgets/utils/widgetDataUtils.ts` (`formatDataAge` — post-J), other widget time call sites, `src/screens/AddLocationScreen.tsx` (search locale).
1. **Error taxonomy i18n:** extend the `userMessageKey` mechanism Worker F introduced to the remaining error classes; UI resolves via `i18n.t(key, params)` at render with `userMessage` fallback (never at construction — §8). Localize `ErrorScreen` (title, default message, "Retry" — key exists, support blurb), `LoadingScreen`, `WeatherErrorBanner` (incl. RTL styles — mirror using the same manual pattern as the other 13 RTL-aware components).
2. **Widget chrome:** i18n for fallback texts ("Weather data unavailable", "Tap to retry", "Refreshing..."), day labels (moment locale is hydrated per Worker C's gate — `moment(...).format('ddd')` localizes; replace hardcoded "Today" with an i18n key), "Hi"/"Lo" labels, and `formatDataAge` strings. **`formatDataAge` contract (complete):** `<30 → null`, `30–59 → "Xm ago"`, `60–1439 → "Xh ago"`, `≥1440 → "Xd ago"` (**keep the existing days branch**); delete only the unreachable `"Just now"` branch. Update Worker H's boundary test TODO to assert the final contract incl. 1439/1440.
3. **Widget clock format:** route all three widget time paths through `dateFormatting.formatTime(ts, useSettingsStore.getState().clockFormat)` — settings-store hydration in the widget context is guaranteed by Worker C's **three-store** `ensureStoresHydrated()`.
4. **New keys ×6 locales, agent-authored (D5):** match register of existing translations; RTL-check ar/he strings; list every key+string per language under `Translations-for-review:` in the commit body.
5. **City-search locale** (tier-2): in `AddLocationScreen`, auto-detect mode passes the *resolved* locale (`i18n.locale`) instead of hardcoded `'en'`.
**Commit:** `feat(i18n): localize error surfaces and widget chrome in 6 languages; honor clock-format in widgets (translations flagged for review)`

### Worker I — Dead-code deletion (~600 LOC) — runs third
**Protocol:** for each item, re-verify zero importers with grep **at deletion time** (earlier phases changed things), **and grep intra-file references (including SQL string literals), not just imports**. Delete:
- `src/hooks/useForecastQuery.ts`, `src/hooks/useCurrentLocation.ts`, `src/utils/fetchUserLocation.ts`, `src/utils/AsyncStorageHelper.ts`, `src/components/ErrorAlert/ErrorBanner.tsx`.
- `reverseGeocode` + its helpers in `src/utils/geocoding.ts` (keep `searchCities` — including H's Phase-2 guard — `getDistanceKm`, `formatLocationName`, `CityResult`).
- `src/utils/rtlStyleHelper.ts` + dead RTL helper exports in `rtlDetection.ts`/`TextDirection.ts` (only exports with zero importers — the `isRTL` store plumbing stays).
- Unused widget shared components (`ForecastRow.tsx`, `TemperatureDisplay.tsx`, `WeatherMetrics.tsx` — verify zero importers post-J).
- **`weather_errors` (corrected scope):** remove the `CREATE TABLE weather_errors` (`database.ts:75`) **and** the `DELETE FROM weather_errors` statement inside `deleteLocationData` (`database.ts:290`) **together** — removing only the CREATE makes fresh installs throw "no such table" on location delete. `database.web.ts` contains **no** weather_errors code — nothing to do there. Do **not** add a `DROP` — 2.0.x installs keep the orphan table harmlessly (§8). Worker H's fresh-database `deleteLocationData` test must stay green.
- The unused i18n keys — **final list computed after K lands** (recompute: keys with zero `i18n.t` references) — deleted **from all six locale files in the same edit**; run H's parity test before committing.
- Empty dir `src/components/WeatherCarousel/`. **Do not delete `src/config/`** — Worker L populates it next.
**Commit:** `chore: delete verified dead code (~600 LOC) — zero-importer and intra-file-reference checked at deletion time`

### Worker L — Organization & docs — runs last
**Files:** renames/moves + `README.md`, `tsconfig.json`, `index.js`, `src/config/queryClient.ts` (new), `src/components/AppFooter/AppFooter.tsx`, `package.json` (dep removal), `src/store/useLanguageStore.ts`, `src/utils/deviceLanguage.ts`, `src/store/useForecastStore.ts` + `src/utils/widgetUpdater.tsx` + `src/widgets/widgetTaskHandler.tsx` (cycle break — safe now: L runs alone), `src/utils/dateFormatting.ts` / `src/utils/fetchLocale.ts` / `src/store/useSettingsStore.ts` (localization-lib swap call sites).
1. **Style-file naming** — one convention, `<Name>.styles.ts` (matches the newest code): rename **all 16 `*.Styles.ts` files** (two of them — `DailyForecastExtendedItemStyles.Styles.ts`, `PopTypeStyles.Styles.ts` — also collapse the duplicated base-name suffix, e.g. `DailyForecastExtendedItem.styles.ts`) **plus** `WeatherIcon.Styles.tsx` → `WeatherIcon.styles.ts` (JSX-free, verified) — **17 files total**; update all imports.
2. **Moves:** `AppStateContext.ts` → `src/contexts/`; `widgetUpdater.tsx` → `src/widgets/`; `iosWidgetStorage.ts` → `src/widgets/utils/`; `database.ts`/`database.web.ts` → `src/services/db/` (keep the platform-suffix pairing intact); colocate the 6 screen style files into `src/screens/`. **After every move: grep for the old path AND the old module specifier across `src/**`, all `__tests__/**`, and every `jest.mock()`/`jest.requireActual()` string literal — a stale mock path can silently stop mocking.** Run `yarn gate` before the commit.
3. **Cycle break:** `useForecastStore ⇄ widgetUpdater` — `setWeatherData` passes the weather payload into `updateAllWeatherWidgets(weather)` so widgetUpdater never imports the store.
4. **index.js slimming:** move the shared fallback (extracted by J) and queryClient construction to typed modules (`src/config/queryClient.ts`); index.js = registration glue.
5. **Localization-lib consolidation:** only `getLanguage` is imported from `react-native-localization-settings` (verified — no setter in use, consolidation is safe) and only `uses24HourClock` from `react-native-localize`. Replace with `expo-localization`: `getLocales()[0]?.languageCode` and `getCalendars()[0]?.uses24hourClock ?? false` (**the field is nullable — `?? false` is the chosen default**). Remove both deps + unused `expo-linking`. This supersedes Worker G's web guard cleanly (expo-localization works on web).
6. **TS strict (incremental):** enable `"noImplicitAny": true`; fix resulting errors. Then *measure* `"strict": true`: if ≤ ~40 errors, fix them all now; if more, leave strict off and record the count + top files in the final summary. Autonomy rule: max ~1 day-equivalent on strict; `noImplicitAny` is the committed floor.
7. **README rewrite:** real setup (clone → yarn → `.env.local` from `.env.example` → `yarn start`; no API keys needed client-side), document shipped features (widgets both platforms, 25 locations, 6 languages/RTL, offline cache), fix the nonexistent `app.config.template.js` instruction, add a project-structure section, link `plans/` docs. **Footer version from `expo-constants`** (`Constants.expoConfig?.version ?? '2.1.0'`).
8. **Plan-doc statuses:** add a status header per phase to `plans/ios-home-widgets-implementation.md` (1,2,3,5 done; 4 partial; 6 untracked; 7 not started — from the review's feature audit).
**Commit chain (multiple commits fine):** `refactor(organization): …`, `docs(readme): …`, `chore(deps): …`

### Worker M — Proxy hardening spec (document only, D4) — parallel-safe, run any time in Phase 3
**File:** `plans/proxy-hardening-spec.md` (new).
Contents: threat summary (verified: unauthenticated, `access-control-allow-origin: *`, no rate-limit headers — denial-of-wallet against the owner's weather-API quota); concrete Vercel implementation options with code sketches: (1) per-IP token-bucket rate limit (Upstash Redis or Vercel KV, e.g. 60 req/hr/IP with burst), (2) CORS allowlist (native apps don't need CORS; restrict to the web demo's origin only), (3) optional lightweight app token: `x-app-token` header checked server-side (extractable from the bundle — the rate limit is the real control; the token raises effort), with the matching one-line client change *specified but not applied*, (4) basic anomaly alerting (log drain / usage alerts). Include a rollout order that never breaks live apps: deploy rate-limit → observe → tighten.
**Commit:** `docs: proxy hardening spec (rate-limit, CORS, optional app token) — for human deployment`

**Phase 3 exit:** gate green after **each** sequential worker → verification loop per workstream → CONFIRMED-GOOD → gate green on final tree.

---

## 7 · Final deliverable — disposition & summary

The orchestrator writes `plans/green-gate-result.md` containing:
1. **The 42-finding disposition table** (finding # / title / disposition / commit hash / test that guards it). Findings out of agent reach are dispositioned: `10 (proxy)` → "spec delivered, human deploys"; anything intentionally skipped → one-line reason. Include any verifier-discovered pre-existing issues (§2.4.3) as new rows.
2. Gate output snippet (`yarn gate` final run).
3. Commit list with one-line summaries.
4. `Translations-for-review:` aggregate (all Worker F + K strings).
5. **Human follow-up checklist:** review diff & push; open PR; verify CI goes green on GitHub; apply the proxy spec; **cut a new EAS build so the manifest actually drops `ACCESS_BACKGROUND_LOCATION`, then** retract any Play Console background-location declaration; review agent-authored translations (F's two error keys + K's set); check EAS-dashboard env parity for `production` (`EXPO_PUBLIC_WEATHER_API_URL`); **update store-listing copy/screenshots if they mention OpenWeather** (outside the repo); redeploy the website only if its content changed (as of authorship: no changes needed); decide on remaining strict-mode errors if Worker L deferred them.

## 8 · Pitfalls carried over from the review (read before starting)

- **The dedup/schema cap bug:** any structured-output fleet must have schema `maxItems` ≥ the prose cap, or results silently truncate.
- **Verifier fleet death:** if subagents start failing on session limits, degrade gracefully — hand-verify by direct read and *label* what got which treatment; never present unverified work as verified.
- **`fetchWeather.ts` is the collision magnet** — one owner per phase, always.
- **Widget primitives ≠ RN components** — never "deduplicate" across the app/widget boundary.
- **Persisted-state shape changes** (query keys, `lastUpdated` type, `dismissedForError`) must tolerate stale persisted data from 2.0.x — default on missing/unknown/legacy-typed fields, never throw during rehydration. No SQLite `DROP`s.
- **Errors are constructed outside React** — i18n resolution happens at render (`userMessageKey`), never at construction.
- The review data (evidence per finding, exact quotes) lives in the artifact and in session `10b3b10f-8ba1-41ce-bf2c-ca23a5d324ff` (`tasks/review.json`, `tasks/w3xjdbr25.output`); the memory file `review-playbook-multi-agent` holds the method.
