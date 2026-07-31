#!/usr/bin/env bash
#
# Android device smoke test.
#
# Covers the things this project actually ships broken — which, by its own git
# history, are concentrated almost entirely in the widget layer: the headless JS
# task, persisted-store hydration in a fresh process, and rendering that only
# exists as a bitmap the native side draws. None of that is reachable from jest,
# which mocks every one of those boundaries away.
#
# PREREQUISITE, and it cannot be automated: all three widgets must already be on
# the home screen. Placing one is not scriptable on a user build — `cmd
# appwidget` has no shell implementation, the launcher's picker is gated behind
# a signature|privileged permission, and APPWIDGET_UPDATE is a protected
# broadcast. Place them by hand once and save an AVD snapshot; everything after
# that point is scripted here.
#
# Usage: bash scripts/release/android-smoke.sh [profile]

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PROFILE="${1:-preview}"
PKG="$(package_for_profile "$PROFILE")"
ADB="$(resolve_adb)"
OUT="${SMOKE_OUT:-${REPO_ROOT}/.smoke/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$OUT"

screenshot() {
  # Raw adb, NOT adb_run: this is binary and stripping CR would corrupt the PNG.
  "$ADB" exec-out screencap -p > "${OUT}/$1.png" 2>/dev/null
  note "saved $1.png"
}

require_one_device

step "1. Build identity"
bash "$(dirname "${BASH_SOURCE[0]}")/verify-android-build.sh" "$PROFILE" || FAILURES=$((FAILURES + 1))

step "2. Widgets are placed"
# dumpsys distinguishes a DECLARED provider from one with a live instance on a
# home screen. Only the second kind can actually be exercised.
WIDGET_DUMP="$(adb_run shell dumpsys appwidget 2>/dev/null || true)"
PLACED=0
for widget in WeatherCompact WeatherStandard WeatherExtended; do
  if printf '%s' "$WIDGET_DUMP" | grep -q "provider=.*${PKG}/${PKG}.widget.${widget}"; then
    pass "${widget} is on a home screen"
    PLACED=$((PLACED + 1))
  else
    fail "${widget} is NOT placed" "add it by hand: long-press home screen > Widgets > $(basename "$PKG")"
  fi
done

step "3. Cold start"
adb_run shell am force-stop "$PKG" >/dev/null 2>&1 || true
adb_run logcat -c >/dev/null 2>&1 || true
adb_run shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

# Captured to a variable before grepping, never piped straight into `grep -q`:
# grep closes the pipe on its first match, `tr` inside adb_run dies of SIGPIPE,
# and under `set -o pipefail` the pipeline then reports 141 — so a successful
# match reads as a failure and the loop runs to its timeout.
RESUMED=""
for _ in $(seq 1 30); do
  ACTIVITIES="$(adb_run shell dumpsys activity activities 2>/dev/null || true)"
  if printf '%s' "$ACTIVITIES" | grep -qE "[Rr]esumedActivity.*${PKG}/"; then
    RESUMED=yes; break
  fi
  sleep 1
done
if [ -n "$RESUMED" ]; then
  pass "app reached a resumed activity"
else
  fail "app never resumed within 30s" "check logcat in ${OUT}/logcat.txt"
fi

# Give the first fetch and the app-context widget repaint time to land.
sleep 10
screenshot "01-app"

step "4. Headless widget task"
# The ONLY trigger reachable from a script is a tap on a placed widget: the app
# repainting a widget from its own JS context proves nothing about the headless
# path, and those two paths have drifted apart in this project before.
adb_run shell input keyevent KEYCODE_HOME >/dev/null 2>&1 || true
sleep 3
screenshot "02-home-before"

if [ "$PLACED" -gt 0 ]; then
  # Widgets render as a bitmap inside an ImageView, so their text is invisible
  # to uiautomator and they cannot be found by content. The launcher does expose
  # the host view's class, though, and that IS exact — matching on size instead
  # picks up the Google search bar and opens it.
  adb_run shell uiautomator dump /sdcard/smoke.xml >/dev/null 2>&1 || true
  HIER="$(adb_run shell cat /sdcard/smoke.xml 2>/dev/null || true)"
  HOSTS="$(printf '%s' "$HIER" |
    grep -oE 'class="[^"]*AppWidgetHostView"[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' |
    grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' |
    sed 's/bounds="\[//; s/"$//' | sort -u || true)"

  TAPPED=0
  while IFS= read -r bounds; do
    [ -n "$bounds" ] || continue
    x1=${bounds%%,*}; rest=${bounds#*,}
    y1=${rest%%\]*}; rest=${rest#*\]\[}
    x2=${rest%%,*}; y2=${rest#*,}; y2=${y2%\]*}
    adb_run shell input tap $(( (x1 + x2) / 2 )) $(( (y1 + y2) / 2 )) >/dev/null 2>&1 || true
    TAPPED=$((TAPPED + 1))
    sleep 6
  done <<< "$HOSTS"

  if [ "$TAPPED" -gt 0 ]; then
    pass "tapped ${TAPPED} widget(s) to run the headless task"
  else
    fail "found no AppWidgetHostView to tap" "the headless path was NOT exercised"
  fi
fi

sleep 4
screenshot "03-home-after"

step "5. Errors in the log"
adb_run logcat -d > "${OUT}/logcat.txt" 2>/dev/null || true

# Two passes, because they catch different things and a single case-insensitive
# regex catches neither cleanly (it matched "result code 0." as an error).
#  - priority filter: real E-level output from JS and the runtime
#  - content filter: the widget's own fallback text, which is logged at INFO but
#    means the user is looking at an error card on their home screen
CRASHES="$(adb_run logcat -d 'ReactNativeJS:E' 'AndroidRuntime:E' 'ReactNative:E' '*:S' 2>/dev/null || true)"
FALLBACKS="$(grep -aE 'Unable to load weather|Weather data unavailable|WidgetLoadError|WidgetRefreshError|Symbol\(react\.fragment\)' "${OUT}/logcat.txt" 2>/dev/null || true)"

if [ -z "$CRASHES" ]; then
  pass "no error-level JS or runtime output"
else
  fail "error-level output in logcat" "see ${OUT}/logcat.txt"
  printf '%s\n' "$CRASHES" | head -10 | sed 's/^/      /'
fi

if [ -z "$FALLBACKS" ]; then
  pass "no widget rendered its error fallback"
else
  fail "a widget fell back to an error card" "see ${OUT}/logcat.txt"
  printf '%s\n' "$FALLBACKS" | head -5 | sed 's/^/      /'
fi

step "6. Permissions still resolve"
# The path that shipped broken once: launched without location permission, and
# no in-app route to recover after granting it in system Settings.
PERMS="$(adb_run shell dumpsys package "$PKG" 2>/dev/null | grep -A2 'ACCESS_FINE_LOCATION' || true)"
if printf '%s' "$PERMS" | grep -q 'granted=true'; then
  pass "location permission is granted"
else
  warn "location permission is NOT granted — exercise the in-app recovery path by hand"
fi

printf '\n%sArtifacts:%s %s\n' "$BOLD" "$RESET" "$OUT"
summary
