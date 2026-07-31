# Release verification

Mandatory before every release, including patches. There is one path — deciding
which parts to skip is the failure mode this replaces.

The split below is not arbitrary. Everything under **Automated** is enforced by
`yarn gate` and CI; everything under **Manual** is here because it genuinely
cannot be automated, and each item says why. If you find yourself doing a manual
step that *could* be scripted, script it and move it up.

---

## 0. Before you start

| | |
|---|---|
| Branch | Not `main`. Release work happens on a branch and merges via PR. |
| CI | Must be green on the branch — see [CI runs on every branch](#ci). |
| Emulator | Android emulator running, with **all three widgets already placed** (see [Widget placement](#widget-placement)). |

---

## 1. Automated gate — `yarn gate`

~7 seconds. Runs in CI on every push, and must pass locally before a build.

```
yarn gate      # tsc --noEmit && eslint . && jest --ci
```

What it covers that is easy to underestimate:

- **Both platforms.** The suite runs as two jest projects, `android` and `ios`.
  This matters more than it sounds: `jest-expo`'s default preset resolves
  everything as iOS, so before this split every `Platform.OS === 'android'`
  branch in the widget code — including the whole Android `requestWidgetUpdate`
  path — was silently never executed.
- **Release config invariants** (`src/config/__tests__/releaseConfig.test.ts`):
  version agreement across `package.json` / `app.json` / the `AppFooter`
  fallback, `autoIncrement` on every profile that ships, widget declarations
  matching the code that renders them, and package scripts that actually exist.
  These are seconds here and a rejected store upload otherwise.
- **The JS ↔ Swift widget contract**
  (`iosWidgetStorage.swiftContract.test.ts`): Swift's `Codable` decode is
  all-or-nothing, so a JS-side rename blanks the iOS widget permanently and
  silently. This diffs the Swift struct declarations against the JS writer, on
  Linux, without a Mac.

---

## 2. Build

```
yarn build:android          # local, and records what it was built from
yarn build:preview          # EAS cloud
```

Local builds land as `build-<epoch>.apk` in the repo root, gitignored, each
with a `.build-info` sidecar recording the commit and whether the tree was
clean. That sidecar is what lets step 3 answer "is this APK my code?" from
content; without it the check falls back to modification times, which lie in
both directions — `git stash`, `git checkout` and `git restore` all touch files
whose content never changed.

---

## 3. Android device pass — `yarn smoke:android`

```
adb install -r build-<newest>.apk
yarn smoke:android
```

Runs against the connected emulator or device and checks:

1. **Build identity** — that the APK on the device is the one built from this
   working tree. This is first for a reason: testing an install that predates
   your fix, concluding the fix does not work, and debugging code that was never
   on the device is a failure this project has actually spent hours on. The
   version *name* cannot tell you — it stays `2.1.0` across every build — so it
   compares `versionCode` and source-file mtimes.
2. **Widget placement** — all three widgets present on a home screen.
3. **Cold start** — force-stop, launch, reach a resumed activity.
4. **The headless widget task** — taps each placed widget. This is the only
   scriptable trigger for that code path, and it is the single highest-risk area
   in the app: the headless JS context has different store-hydration semantics
   from the app, and the two render paths have drifted apart before.
5. **Log scan** — error-level JS/runtime output, plus the widget's own error
   fallback text (which is logged at INFO but means the user is looking at an
   error card).
6. **Permissions** — location still granted.

Screenshots and the full logcat land in `.smoke/<timestamp>/`.

**A pass here is necessary, not sufficient.** It cannot see layout. Look at the
screenshots.

---

## 4. Manual — Android

Each of these is manual because it cannot be scripted, not because nobody got
round to it.

- [ ] **Resize the daily widget** through 2, 3, 4 and 5 cells wide, and at least
      two heights. Confirm nothing clips, wraps or misaligns.
      *Why manual:* the widget renders to a bitmap the native side draws, so its
      text is invisible to `uiautomator`; only a human can see a clipped row.
      The dp thresholds were measured on one launcher at one density.
- [ ] **Change the widget style** in Settings, then **resize a widget**.
      Confirm the new style survives.
      *Why manual:* this is the exact shape of a bug that shipped — the headless
      context served a stale snapshot, so the widget repainted in the previous
      style. A tap alone does not reproduce it; the resize does.
- [ ] **Switch language** to Hebrew or Arabic and refresh a widget.
      *Why manual:* nothing sets `layoutDirection` on the widget, the column
      widths are sized for English, and RTL is not observable from a test.
- [ ] **Revoke location permission**, launch, then grant it in system Settings
      and return to the app. Confirm the app recovers without a restart.
      *Why manual:* the emulator's Play image routes location through the fused
      provider, which ignores `adb emu geo fix`.
- [ ] **Regenerate the widget picker previews** if any widget's layout changed:
      `bash scripts/widget-screenshots/android/capture.sh`. Automated apart from
      placement. `app.json` points the picker at these files, so until they are
      regenerated the launcher and the Play listing advertise a widget that no
      longer exists.

---

## 5. Manual — iOS (Mac only)

The Linux gate never compiles Swift. Until this runs, the iOS widget is
unverified no matter how green CI is.

- [ ] `bash scripts/widget-screenshots/ios/render.sh` — renders the widget via
      SwiftUI's `ImageRenderer` without a simulator. This is the fastest way to
      catch a Swift compile error; do it first.
- [ ] Build and run on a simulator; add all widget sizes to the home screen.
- [ ] Confirm the iOS widget matches the Android one in content and layout.
      *Known drift:* `targets/widget/` has had far fewer commits than
      `src/widgets/`, so assume divergence until you have looked.
- [ ] Check the localized chrome renders with numbers, not a literal
      `%{count}`.

> **Never build the `preview` profile for iOS.** Its iOS config is deliberately
> untouched, so an iOS preview build carries the **production** bundle id and
> would overwrite the production app. `yarn build:preview` is pinned to
> `--platform android` for this reason.

---

## 6. Ship

- [ ] Bump the version in `package.json`, `app.json` and the `AppFooter`
      fallback — the gate enforces that all three agree.
- [ ] Tag the release: `git tag v<version> && git push --tags`.
- [ ] **Review the translations.** Several strings were agent-authored and have
      never had a human pass. Nothing in the gate checks meaning — `i18nParity`
      only proves the six tables have matching keys.
- [ ] Confirm the EAS **production** environment defines every variable the
      build needs, because each of these fails silently:
      - `EXPO_PUBLIC_WEATHER_API_URL` — unset, the app falls back to a
        hardcoded proxy. The build succeeds and works, right up until that URL
        changes and nothing connects the outage to a missing variable.
      - `EXPO_PUBLIC_SENTRY_DSN` — unset, `Sentry.init` is skipped entirely and
        crash reporting is off with no warning.
      - `SENTRY_AUTH_TOKEN` — unset, every stack trace arrives unsymbolicated.
- [ ] Build production, submit, and verify the first Sentry event arrives under
      the new release identity.

---

## Appendix

### <a id="widget-placement"></a>Widget placement is not scriptable

Placing an Android widget cannot be automated on a user build: `cmd appwidget`
has no shell implementation, the launcher's picker is gated behind a
`signature|privileged` permission, and `APPWIDGET_UPDATE` is a protected
broadcast. Place the three widgets by hand once and **save an AVD snapshot**;
everything after that point is scripted.

### <a id="ci"></a>CI

`.github/workflows/ci.yml` runs the gate on **every branch and every PR**, not
just `main`. It previously ran only on `main`, which meant release branches — the
only branches where it matters — were never checked.
