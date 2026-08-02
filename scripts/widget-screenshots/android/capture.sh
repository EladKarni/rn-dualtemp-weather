#!/usr/bin/env bash
#
# Capture the Android widget picker previews.
#
# These are the images the launcher's widget picker (and the Play listing)
# advertises, and they are hand-made screenshots — so they go stale silently
# every time a widget's layout changes, and keep advertising a widget that no
# longer exists. This automates everything about that capture except the one
# step that genuinely cannot be automated.
#
# PREREQUISITE: all three widgets must already be on the home screen. Placing
# one is not scriptable on a user build — `cmd appwidget` has no shell
# implementation, the launcher's picker is gated behind a signature|privileged
# permission, and APPWIDGET_UPDATE is a protected broadcast. Place them once and
# save an AVD snapshot.
#
# The widgets are matched to their files by the launcher's content-desc, which
# carries each widget's label verbatim — so placement ORDER and on-screen size
# do not matter, and a resized Extended widget cannot be mistaken for a
# Standard one.
#
# Usage: bash scripts/widget-screenshots/android/capture.sh [profile] [outdir]

source "$(dirname "${BASH_SOURCE[0]}")/../../release/lib.sh"

PROFILE="${1:-preview}"
OUT="${2:-${REPO_ROOT}/assets/widget-preview}"
ADB="$(resolve_adb)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

command -v convert >/dev/null 2>&1 || die "ImageMagick 'convert' not found"
require_one_device
mkdir -p "$OUT"

# The widget surface is deliberately transparent so widgets sit on the
# wallpaper. To capture that as real alpha we need a background we can key out,
# and dimming the wallpaper to 1 renders it black WITHOUT touching the opaque
# element cards drawn on top.
step "Preparing the home screen"
PREV_DIM="$(adb_run shell cmd wallpaper get-dim-amount 2>/dev/null | grep -oE '[0-9.]+' | head -1 || echo 0)"
restore_wallpaper() {
  adb_run shell cmd wallpaper set-dim-amount "${PREV_DIM:-0}" >/dev/null 2>&1 || true
}
trap 'restore_wallpaper; rm -rf "$WORK"' EXIT

adb_run shell cmd wallpaper set-dim-amount 1 >/dev/null 2>&1 || warn "could not dim the wallpaper"
adb_run shell input keyevent KEYCODE_HOME >/dev/null 2>&1 || true
sleep 3
note "wallpaper dimmed (was ${PREV_DIM:-0}); it is restored on exit"

step "Locating widgets"
adb_run shell uiautomator dump /sdcard/widget-capture.xml >/dev/null 2>&1 || true
HIER="$(adb_run shell cat /sdcard/widget-capture.xml 2>/dev/null || true)"
[ -n "$HIER" ] || die "could not read the view hierarchy"

"$ADB" exec-out screencap -p > "${WORK}/screen.png" 2>/dev/null
[ -s "${WORK}/screen.png" ] || die "screencap produced nothing"

for widget in Compact Standard Extended; do
  # The label is "[Preview] Weather (Compact)" on the preview variant and
  # "Weather (Compact)" on production, so match on the parenthesised name only.
  NODE="$(printf '%s' "$HIER" |
    grep -oE "<node[^>]*content-desc=\"[^\"]*Weather \(${widget}\)\"[^>]*>" | head -1 || true)"

  if [ -z "$NODE" ]; then
    fail "${widget} is not on the home screen" "place it by hand, then re-run"
    continue
  fi

  BOUNDS="$(printf '%s' "$NODE" | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' |
    sed 's/bounds="\[//; s/"$//')"
  x1=${BOUNDS%%,*}; rest=${BOUNDS#*,}
  y1=${rest%%\]*}; rest=${rest#*\]\[}
  x2=${rest%%,*}; y2=${rest#*,}; y2=${y2%\]*}
  w=$((x2 - x1)); h=$((y2 - y1))

  # Key the dimmed wallpaper back out to alpha. The fuzz is deliberately small:
  # the darkest widget preset is rgba(14,16,32), only ~9% away from black, and a
  # generous tolerance would eat the widget's own background along with the
  # wallpaper.
  convert "${WORK}/screen.png" \
    -crop "${w}x${h}+${x1}+${y1}" +repage \
    -fuzz 4% -transparent black \
    "${OUT}/${widget}.png"

  pass "${widget} -> ${OUT#"$REPO_ROOT"/}/${widget}.png (${w}x${h})"
done

step "Result"
note "app.json points the picker at these files; commit them to update the listing"
summary
