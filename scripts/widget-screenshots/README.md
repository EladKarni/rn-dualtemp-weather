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

`react-native-android-widget` renders widgets from the app process, so captures
come from a device/emulator (the existing `assets/widget-preview/*.png` were made
this way). From WSL, use the Windows-hosted emulator recipe (see README "Running
on an emulator from WSL" / the project notes):

1. Launch the emulator with working DNS:
   `emulator.exe -avd Pixel_10 -dns-server 8.8.8.8,8.8.4.4`
2. Build + install the app, open it once so weather data loads and the widgets
   have a payload.
3. Long-press the home screen → Widgets → place DualTemp's Compact, Standard,
   and Extended widgets.
4. Capture: `adb.exe exec-out screencap -p > store/screenshots/widgets/android/home.png`
   (crop per-widget afterwards, or screencap once per widget placement).

For store use, prefer a clean launcher page (no other icons), default wallpaper,
and a full-charge status bar, or composite the cropped widgets onto a clean
home-screen mock in the `sharp` step.
