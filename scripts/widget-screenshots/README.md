# Widget screenshots

Capture path for home-screen widget imagery on both platforms, per the
"[Widget screenshots](../../plans/store-metadata-automation.md#widget-screenshots)"
section of the store metadata plan. Widgets live on the OS home screen, not in the
app, so normal UI-automation flows can't photograph them — each platform gets a
dedicated route. Raw captures land in `store/screenshots/widgets/<platform>/`;
compositing onto a home-screen background and resizing to exact store dimensions
is the store plan's `sharp` step, not part of this capture step.

## iOS (macOS only)

```bash
scripts/widget-screenshots/ios/render.sh            # → store/screenshots/widgets/ios/
scripts/widget-screenshots/ios/render.sh /tmp/out   # custom output dir
```

Compiles `targets/widget/widgets.swift` together with `ios/RenderWidgets.swift`
(plain `xcrun swiftc`, no Xcode project) and renders each widget view with
SwiftUI's `ImageRenderer` — no simulator, no Springboard automation, fully
deterministic. Needs Xcode 15+ / the macOS 14 SDK.

Output: `compact|standard|extended-{en,he}.png` at iPhone 16 Pro Max widget
sizes @3x (510×510, 1092×510, 1092×1146). The `he` variants exist to verify the
widget localization work: Hebrew chrome, RTL layout, 24-hour clock. Edit the
fixtures in `RenderWidgets.swift` to add locales or change weather data — keep
chrome strings in sync with `src/localization/*.ts`.

This is also the fastest way to eyeball any change to the Swift widget views
without an EAS build.

## Android

```bash
bash scripts/widget-screenshots/android/capture.sh            # -> assets/widget-preview/
bash scripts/widget-screenshots/android/capture.sh preview /tmp/out
```

Automated end to end except placement. The script dims the wallpaper to black
(`cmd wallpaper set-dim-amount 1`) so the widgets' deliberately transparent
surface can be keyed back out to real alpha while the opaque element cards are
untouched, finds each widget by the launcher's `content-desc` — which carries
the widget label verbatim, so placement order and on-screen size do not matter —
crops to the exact host-view bounds, and restores the previous dim amount on
exit even if it fails.

**Placement is the one manual step, and cannot be automated.** `cmd appwidget`
has no shell implementation, the launcher's widget picker is gated behind a
`signature|privileged` permission, and `APPWIDGET_UPDATE` is a protected
broadcast. Place all three widgets by hand once and save an AVD snapshot.

Re-run this whenever a widget's layout changes: `app.json` points the picker at
these files, so until they are regenerated the launcher — and the Play listing —
advertises a widget that no longer exists.

The keying fuzz is deliberately tight (4%). The darkest widget preset is
`rgba(14, 16, 32)`, under 9% away from black, so a generous tolerance would eat
the widget's own background along with the wallpaper.

For store imagery (as opposed to picker previews), prefer a clean launcher page,
default wallpaper and a full-charge status bar, or composite the cropped widgets
onto a home-screen mock in the store plan's `sharp` step.
