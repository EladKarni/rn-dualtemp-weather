# iOS release handoff — 2.2.0

**Audience:** the next agent, working on a Mac, picking up `staging-2-2-0`.
**Goal:** get the iOS build compiling, verified, at feature parity with Android,
and submitted.

This is a companion to [RELEASE.md](RELEASE.md), which covers the parts of the
process that are the same on both platforms. Read §0 and §1 of that file first;
everything here is iOS-specific and assumes the gate is already green.

---

## 0. Read this before you touch anything

### The one thing that matters most

**`targets/widget/widgets.swift` has never been compiled by anything in this
repository's toolchain.** The gate is `tsc --noEmit && eslint . && jest --ci` —
none of those can see Swift. CI runs on `ubuntu-latest`. There is no Swift
compiler anywhere in the pipeline.

Several hundred lines of that file were written on a Linux machine with no way
to check syntax. It passes brace/paren/bracket balance and every test that
parses it as *text*, but that proves content, not that it builds.

**Therefore: run the compile gate (§2) before writing a single new line of
Swift.** If you add more unproven Swift first, the first compile failure will
have several possible causes and you will not know which.

### What was already verified, and how

Do not re-derive these. Each was checked against a real artifact, not inferred
from config:

| Claim | How it was verified |
|---|---|
| `CFBundleLocalizations` = all six locales | `expo prebuild --clean`, then read the generated plist with `plistlib` |
| Location prompt uses the descriptive string; both `NSLocationAlways*` keys gone | same |
| `UIStatusBarStyle = UIStatusBarStyleLightContent` | same |
| App and widget `CFBundleVersion` agree | prebuild with `EAS_BUILD_IOS_BUILD_NUMBER=42` → both 42; unset → both 1 |
| `WeatherWidget` target materializes in the pbxproj | `grep PBXNativeTarget` on the generated project |
| 11 of 46 weather codes diverged from Android | computed both mappings and diffed |
| `widgetTheme` is persisted (`partialize` allow-list + merge guard) | read `useSettingsStore.ts:72,88` |

### What is claimed but NOT verified

These came from a static audit. They are plausible and worth checking, but
**treat them as leads, not facts** — the same audit was wrong twice (it proposed
an iPad fix that would have caused a store rejection, and overstated the icon
divergence as 17 codes when it is 11):

- The widget's accent text renders blue (`$accent: #4A90E2` in
  `targets/widget/expo-target.config.js`) where the app uses near-white.
- Daily Hi/Lo columns do not line up across rows on iOS.
- `AddLocationScreen` search results can be hidden by the keyboard.
- `LocationDropdown` does not clear the header on a Dynamic Island device.
- The widget appex needs its own `PrivacyInfo.xcprivacy` (the main bundle is
  said to be covered by React-Core's and expo-constants' shipped manifests).
- The `.dev` App Group is not enabled on the `.dev` App ID in the developer
  portal.
- There were four errored iOS builds in 2026 whose logs are behind expo.dev
  session auth and could not be read from Linux.

**Check each before acting on it.** Cheap to confirm, expensive to "fix" if it
was never broken.

---

## 1. Orient (5 minutes)

```bash
git checkout staging-2-2-0 && git pull
yarn install
yarn gate                      # must be green before you start; ~1060 tests
```

The commits that touched iOS in this cycle, newest first:

| Commit | What it changed |
|---|---|
| `30dcbc0` | Payload schema **v3** (`elementColor`), `Color(hex:)` extension, `elementColor` threaded through `HourlyItemView`/`DailyItemView`, card fill made opaque |
| `a04eb70` | Replaced the range-based icon mapping with an id-keyed `weatherIconMap`; added `iosWidgetParity.test.ts` |
| `7dcb53d` | `app.json` + `plugins/withWidgetBuildNumber.js` — localizations, location strings, status bar, build-number sync |

`git log --oneline 10ea763..HEAD -- targets/ src/widgets/` shows everything that
moved since the iOS widget was last edited before this cycle.

---

## 2. The compile gate — do this first

```bash
bash scripts/widget-screenshots/ios/render.sh
```

This runs `xcrun swiftc -parse-as-library` over `widgets.swift` +
`scripts/widget-screenshots/ios/RenderWidgets.swift` and renders PNGs using
SwiftUI's `ImageRenderer`. **No simulator, no Xcode project, no pods.** It is by
far the cheapest way to find out whether the Swift is valid.

**Expect at least one round of errors.** Highest-risk constructs, all new:

- `extension Color { init?(hex: String?) }` — uses `guard let hex = hex else`
  spelled out on purpose, because the `guard let hex` shorthand needs a Swift
  5.7+ compiler and the target builds at `SWIFT_VERSION 5.0`. Also uses
  `UInt64(digits, radix: 16)` and `self.init(red:green:blue:)`.
- `let weatherIconMap: [Int: String]` — a new top-level dictionary literal with
  ~46 emoji string values.
- `var resolvedElement: Color` on `extension WeatherData` — forward-references
  `WidgetColors.defaultElement`, declared later in the file. Legal in Swift, but
  worth knowing if the error points there.
- `HourlyItemView` and `DailyItemView` each gained a **required**
  `elementColor: Color` parameter. Every construction site had to be updated;
  if one was missed, that is a missing-argument error.

When it compiles, compare the output against the six committed baselines:

```bash
ls store/screenshots/widgets/ios/     # compact/standard/extended × en/he
git diff --stat store/screenshots/widgets/ios/
```

The images **should** change — the card fill went from translucent
`Color.white.opacity(0.1)` to opaque `#1C1B4D`. Look at them and confirm the
change is the one you expected and nothing else broke.

> If you have to fix Swift here, keep the fixes minimal and re-run. Do not start
> on §5 improvements until this is clean.

---

## 3. Build bring-up

```bash
yarn prebuild:prod            # or prebuild:dev
cd ios && pod install && cd ..
```

**Always `--clean`** (both `prebuild:dev` and `prebuild:prod` already pass it).
Without it, prebuild merges into a stale tree and the pbxproj retains leftovers
from earlier runs — this produced a phantom `CURRENT_PROJECT_VERSION = 2.1.0`
during this cycle and briefly looked like a real bug.

Then build app + widget for a simulator in Xcode.

**If the widget target is missing from the scheme:** check plugin order in
`app.json`. `./plugins/withWidgetBuildNumber` must come **before**
`@bacons/apple-targets` — that plugin reads `ios.buildNumber` while constructing
the target, so the order is load-bearing, and `appConfig.test.ts` asserts it.

**If provisioning fails on the App Group:** enable
`group.com.ekarni.rndualtempweatherapp.widget` (and the `.dev` variant if you
are building the dev flavour) on the App ID in the developer portal.

---

## 4. Feature parity checklist

This is the substance of the handoff. Android is the reference implementation —
it has had far more attention this cycle. For each row, put the two side by side.

### 4.1 Widgets

Install **one variant at a time** (dev *or* production, never both) until the
App Group question is settled, or you cannot tell whose payload you are reading.

- [ ] **All three families render at all.** `systemSmall`, `systemMedium`,
      `systemLarge`. A grey `PlaceholderView` means `getWeatherData()` returned
      nil — see §7.
- [ ] **Weather icons match Android exactly.** Specifically check a tornado
      (731/761/762/771 → 🌪️, was fog), light rain (500 → 🌦️, was heavy rain),
      and the sleet band (611–621 → 🌨️, was ❄️). These are the 11 codes fixed
      in `a04eb70`.
- [ ] **The widget style picker repaints the widget.** Settings → change preset
      → widget changes colour. **This has never worked on iOS.** It is the whole
      point of `30dcbc0`. All six presets.
- [ ] **Card fill is opaque**, not a translucent wash over the background.
- [ ] **Dual temperatures agree with the app's detail screen** for the same
      reading, in both C and F.
- [ ] **Hi/Lo labels and columns align across daily rows.** *(Claimed broken —
      verify before fixing.)*
- [ ] **Accent/highlight text colour matches the app.** *(Claimed blue vs
      near-white — verify.)*
- [ ] **Age label shows a number**, e.g. "5m ago" / "לפני 5 דקות" — **not** a
      literal `%{count}`. Swift fills the placeholder at render time
      (`fillCount`, `widgets.swift`).
- [ ] **RTL:** switch the app to Hebrew or Arabic. Day labels move to the right,
      the row order reverses, and the hourly columns run earliest-last. Compare
      against the Android screenshots — Android's RTL work landed in `8c4b762`.

### 4.2 App screens

- [ ] **Status bar glyphs are light on every screen**, including the splash and
      every modal. Both halves were fixed (`Info.plist` for the pre-JS window,
      `<StatusBar style="light" />` in `App.tsx` for after mount) — confirm both
      paths.
- [ ] **Location prompt reads** "This app uses your location to show you the
      weather." — not the generic "Allow DualTemp Weather to use your location."
- [ ] **iOS Settings → the app → Language** offers a language picker listing all
      six. This proves `CFBundleLocalizations` reached the binary.
- [ ] `AddLocationScreen` results are usable with the keyboard up. *(Claimed
      broken — verify.)*
- [ ] `LocationDropdown` clears the header on a Dynamic Island device.
      *(Claimed broken — verify.)*
- [ ] One pass on an **iPad simulator in landscape**. See §6 — this is a known
      open decision, not a bug to quietly fix.

### 4.3 Schema v3 back-compatibility

The payload went v2 → v3 this cycle. `elementColor` is optional on the Swift
side precisely so older payloads still decode.

- [ ] Install the **previous** release, let it write a v2 payload, then upgrade
      to this build **without opening the app**. The widget must keep rendering
      (falling back to `WidgetColors.defaultElement`), not go grey.

That is the single highest-value regression check on this release, because
Swift's synthesised decoder is all-or-nothing: one mishandled field blanks the
widget forever, silently, with nothing logged where a JS developer would look.

---

## 5. Known gaps to close on the Mac

Fix these **after** §2 is clean, one at a time, re-running `render.sh` after
each so a compile error always has one candidate cause.

1. **Accent colour** — `targets/widget/expo-target.config.js` declares
   `$accent: "#4A90E2"`. Confirm what actually renders before changing it.
2. **Daily row alignment** — Android solved this with fixed-width columns for
   everything except the temperatures, which are weighted
   (`src/widgets/WeatherExtended.tsx`). The SwiftUI analogue is
   `.frame(width:alignment:)` on the day/icon columns. Read the Android
   rationale first; it is documented in that file at length.
3. **Widget privacy manifest** — if confirmed needed, add
   `targets/widget/PrivacyInfo.xcprivacy` declaring
   `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`. Do **not**
   add `ios.privacyManifests` to `app.json`; the main bundle is reportedly
   already covered.
4. **`EXPO_PUBLIC_WEATHER_API_URL` in the production EAS environment** — can be
   done from anywhere:
   ```bash
   eas env:create --environment production \
     --name EXPO_PUBLIC_WEATHER_API_URL --value '<proxy base URL, trailing slash>'
   ```
   Not a blocker (there is a hardcoded fallback that *is* the intended backend)
   but it removes the trap where changing the URL needs a full review cycle.

---

## 6. Open decision — iPad

`orientation: "portrait"` in `app.json` does **not** constrain iPad; it only
writes the non-`~ipad` key. The obvious fix does not work:

> Setting `UISupportedInterfaceOrientations~ipad` to portrait-only is silently
> overwritten by Expo's `withRequiresFullScreen`, which forces all four
> orientations whenever `supportsTablet: true` and `requireFullScreen` is falsy,
> because iPad multitasking requires them. Restricting them causes
> **ITMS-90474** at upload.

Constraining iPad to portrait therefore means `ios.requireFullScreen: true`,
which drops Split View support. The app has shipped as universal since 2022.
**This is the owner's product call — surface it, do not decide it.**

---

## 7. Debugging a blank (grey) widget

A grey `PlaceholderView` always means `getWeatherData()` returned nil, which
almost always means a `JSONDecoder` failure.

```bash
xcrun simctl spawn booted log stream --predicate 'process CONTAINS "WeatherWidget"'
```

`widgets.swift` prints the decode error in the `catch` of `getWeatherData()`.

Most likely causes, in order:

1. A field is non-optional in Swift but absent from the JS payload. Run
   `npx jest iosWidgetStorage.swiftContract` — it diffs the Swift struct
   declarations against the JS writer and catches exactly this on Linux.
2. The App Group id disagrees between the app and the extension. It appears in
   `widgets.swift` (`appGroupId`), `app.json` (`ios.entitlements`), and
   `targets/widget/expo-target.config.js`. All three must match.
3. Two variants installed at once, so you are reading the other one's payload.

---

## 8. Ship

Follow [RELEASE.md §6](RELEASE.md), plus these iOS-specific gates:

- [ ] **Before the first production build**, open the four errored 2026 builds
      in the EAS dashboard and check for a shared cause. Their logs could not be
      read from Linux. Budget 2–3 attempts; each is a paid ~20-minute build.
- [ ] Consider an iOS **development**-profile cloud build first, so the first
      *production* attempt is not also the first *cloud* compile.
- [ ] **Never** `eas build --profile preview --platform ios`. The preview
      profile's iOS config is deliberately absent, so an iOS preview build
      carries the **production** bundle id and would overwrite the production
      app. `yarn build:preview` is pinned to `--platform android` for this
      reason, and `releaseConfig.test.ts` asserts `build.preview.ios` stays
      undefined.
- [ ] After upload, watch for:
      - **ITMS-90473** (app/appex `CFBundleVersion` mismatch) → the
        `withWidgetBuildNumber` plugin did not take. Check that
        `EAS_BUILD_IOS_BUILD_NUMBER` was set on the builder and that the plugin
        still precedes `@bacons/apple-targets`.
      - **ITMS-91053** (missing API declaration) → the widget `.xcprivacy` did
        not bundle.
      - **ITMS-90474** (iPad multitasking orientations) → someone restricted
        `~ipad` without setting `requireFullScreen`. See §6.
- [ ] In App Store Connect, confirm the **Languages** field lists all six before
      submitting. That is the proof `CFBundleLocalizations` reached the binary.
- [ ] Post-ship: confirm the first Sentry event arrives under the `2.2.0`
      release identity **and is symbolicated** — that proves `SENTRY_AUTH_TOKEN`
      resolved on the builder.

### Two standing gates from the owner

1. **Review the translations.** Several strings were agent-authored and have
   never had a human pass. `i18nParity` only proves the six tables have matching
   keys — nothing checks meaning.
2. **Confirm all three EAS production variables are set.** Each fails silently:
   `EXPO_PUBLIC_WEATHER_API_URL`, `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.

---

## 9. Deferred — do not do these for 2.2.0

Recorded so they are not rediscovered as new findings:

- **iOS transparent widget surface.** Needs `containerBackground(.clear)` on
  iOS 17+ with a pre-17 fallback, and how it reads over a wallpaper can only be
  judged on a device. The current approach reproduces today's look exactly.
- **Background refresh (`BGAppRefreshTask`).** A real product gap — an iOS
  widget only updates when the app foregrounds — but it is new native surface
  with best-effort OS scheduling. The widget already surfaces its own staleness.
  *For 2.2.0: fix the misleading comment in `WeatherProvider.getTimeline` that
  implies a background task which does not exist.*
- **`.widgetURL` tap target.** Needs a URL scheme (`app.json` has none) plus a
  deep-link handler. iOS has no analogue to Android's tap-to-refresh anyway.
- **`scripts/release/ios-smoke.sh`.** Write it after the first successful iOS
  release, when you know what actually needs checking. Note the highest-risk
  Android check — the headless-task tap — has no iOS analogue by construction:
  `widgets.swift` has no network and no JS, so iOS has a single data-driven
  render path.
- **UV column on `systemLarge`.** Additive only, no wrong output.
