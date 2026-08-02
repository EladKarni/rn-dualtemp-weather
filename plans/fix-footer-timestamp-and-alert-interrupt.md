# Fix: Blank "Last Updated" on First Run + GPS Alert Interrupting Add-City

> **Status: ✅ Done 2026-07-28.** Both bugs fixed, adversarially reviewed
> (0 findings survived), and verified on the emulator: fresh install +
> deny + manual add now shows "Last Updated: a few seconds ago" on the very
> first render.
>
> **Bug 1's actual root cause** (found via debug-build instrumentation, not
> among the original suspects): `ensureStoresHydrated` in widgetUpdater.tsx
> FORCE-ran `persist.rehydrate()` on all three stores. It also executes in the
> MAIN app context after every fetch (`setWeatherData` →
> `updateAllWeatherWidgets`), where the forced rehydrate replaced newer
> in-memory state with the AsyncStorage snapshot — blanking the first-run
> footer (persisted value still null) and silently rewinding store state after
> EVERY fetch in every process. Fixed by waiting for hydration
> (hasHydrated/onFinishHydration) with a bounded forced-rehydrate fallback for
> headless contexts only.
>
> Written 2026-07-28, from two defects observed live during the Phase 3
> emulator session (see
> [android-widget-i18n-and-previews.md](./android-widget-i18n-and-previews.md)).

## Bug 1 — "Last Updated:" renders blank after the first-ever fetch

**Observed:** fresh install on the Pixel_9a emulator, city added manually, live
weather on screen — the Today card footer read `Last Updated:` with nothing
after it (screenshot `city-added2.png`, 19:49). On every later app open the
footer is correct (`Last Updated: a few seconds ago`, verified 20:33). So the
defect is confined to the first-ever successful fetch of a fresh install —
exactly what every new user sees first.

**Render chain (verified in code):**
`useMultiLocationWeather` sets the timestamp on fetch success
([useMultiLocationWeather.ts:326-330](../src/hooks/useMultiLocationWeather.ts):
`if (activeIsSuccess && activeData) setLastUpdated(new Date().toISOString())`)
→ `useSettingsStore.lastUpdated` (persisted) →
[CardFooter.tsx](../src/components/CardFooter/CardFooter.tsx) formats with
`moment(value).fromNow()`, blank-on-invalid by design.

**Root cause not yet pinned.** The chain looks reactive end-to-end, so the
first task is a deterministic repro with eyes on state, not a speculative fix:

1. `adb shell pm clear com.ekarni.rndualtempweatherapp` → relaunch → add a
   city → observe the footer. This reproduces first-run exactly, on demand.
2. Instrument (locally, or via `adb logcat` on the release build's breadcrumbs)
   which link breaks. Ranked suspects:
   - **Persist-rehydration overwrite**: `setLastUpdated` lands, then a late
     zustand-persist merge on the freshly-created `@settings` record replaces
     state with the persisted `lastUpdated: null`. (The settings store has
     legacy-shape migration logic in its merge — first-run behavior of that
     path is untested.)
   - **The success effect never fires on the first-run mount sequence**:
     empty state → content transition remounts the tree mid-fetch;
     `activeIsSuccess`/`activeData` timing with `placeholderData` on a
     never-before-seen query key may differ from warm launches.
   - **CardFooter's `isHydrated` gate + state initializer**: mounts before the
     write, initializer captures "", and a subscription edge misses the update.
3. Fix at the confirmed link only. Likely shapes: make the settings-store merge
   preserve a newer in-memory `lastUpdated` over a persisted null, or derive
   the footer from the forecast's own fetch timestamp (the store already
   tracks per-location freshness in SQLite) instead of a second, separately
   persisted copy — decide once the repro speaks.
4. Regression test: a CardFooter + settings-store test that simulates the
   first-run ordering (mount with null → hydration completes → setLastUpdated)
   and asserts the rendered string is non-empty; plus whichever unit pins the
   actual root cause.

**Verification:** `pm clear` → relaunch → add city → footer must show
"a few seconds ago" on the very first weather render; gate stays green.

## Bug 2 — GPS-failure alert interrupts the Add-City modal

**Observed:** on first run, the GPS attempt failed while the Add Location
modal was open with search results showing; the failure alert (Cancel / Retry /
Add Location) appeared over the modal and swallowed the in-flight tap
(screenshot `city-added.png`, 19:48). The user was already performing the
alert's own recovery action when the alert interrupted them.

**Root cause (known):** `useGPSLocation`'s failure paths call `showErrorAlert`
whenever the async GPS attempt settles — `shouldShowGpsAlert()` checks only
"does a manual city exist yet", not what the user is doing. React Native's
`Alert` is app-modal, so it lands on top of everything, including the
`addLocation` modal that the alert's own **Add Location** button opens. All
three alert sites in [useGPSLocation.ts](../src/hooks/useGPSLocation.ts) share
the gate (permission-denied, no-last-known-position, unexpected-failure), so
one fix covers them.

**Fix:**

1. Extend the gate: `shouldShowGpsAlert()` returns false when
   `useModalStore.getState().activeModal === 'addLocation'` — if the user is
   already adding a city, a GPS alert is pure interruption; the empty-location
   screen behind the modal remains the fallback surface if they cancel out.
   (`gpsError` state is still set, so non-modal surfaces keep working.)
2. Keep the gate's existing semantics otherwise — alerts still fire for
   GPS-only users on the main screen, including with Settings open (the
   permission alert's "Open Settings" action is meaningful there).
3. Export the gate (or extract its decision into a pure helper in the hook's
   module) and unit-test the matrix: {no cities, has cities} ×
   {no modal, addLocation open, settings open} — six cases, one true per
   contract.

**Verification:** `pm clear` → relaunch → while the GPS attempt is pending,
open Add Location and let the GPS failure land — no alert may appear over the
modal; complete the add and confirm weather renders. Then deny-permission on
the main screen with zero cities — the alert must still appear there.

## Sequencing

Bug 2 first (root cause known, small, self-contained), then Bug 1's
repro-instrument-fix loop — both on the current branch, each with the full
gate and an emulator pass before commit.
