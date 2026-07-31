#!/usr/bin/env bash
#
# Prove the APK on the device is the one built from the current working tree.
#
# This exists because of a specific, expensive failure: testing an install that
# predates the fix you are testing, concluding the fix does not work, and
# debugging code that was never on the device. The version NAME cannot tell you
# — it stays "2.1.0" across every build of a release — so this uses versionCode,
# which EAS increments on every build, plus the APK's own mtime against the last
# commit that touched shipped source.
#
# Usage: bash scripts/release/verify-android-build.sh [profile]
#        (profile defaults to "preview")

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PROFILE="${1:-preview}"
PKG="$(package_for_profile "$PROFILE")"
ADB="$(resolve_adb)"

step "Build identity — ${PKG}"

require_one_device

APK="$(newest_apk || true)"
[ -n "$APK" ] || die "no build-*.apk in ${REPO_ROOT}. Build first: yarn build:preview:local"

PKG_DUMP="$(adb_run shell dumpsys package "$PKG" 2>/dev/null || true)"
INSTALLED_CODE="$(printf '%s' "$PKG_DUMP" | grep -oE 'versionCode=[0-9]+' | head -1 | cut -d= -f2 || true)"
[ -n "$INSTALLED_CODE" ] || fail "$PKG is not installed" "adb install -r $(basename "$APK")"

if AAPT2="$(resolve_aapt2)"; then
  BADGING="$("$AAPT2" dump badging "$APK" 2>/dev/null || true)"
  APK_CODE="$(printf '%s' "$BADGING" | grep -oE "versionCode='[0-9]+'" | head -1 | grep -oE '[0-9]+' || true)"
  if [ "$INSTALLED_CODE" = "$APK_CODE" ]; then
    pass "installed build is $(basename "$APK") (versionCode ${APK_CODE})"
  else
    fail "device has versionCode ${INSTALLED_CODE}, newest local APK is ${APK_CODE}" \
         "install it: adb install -r $(basename "$APK")"
  fi
else
  warn "aapt2 not found — cannot compare versionCode (set AAPT2=/path/to/aapt2)"
  note "installed versionCode is ${INSTALLED_CODE}"
fi

# An APK older than the code is the same trap wearing a different hat: the right
# file installed, built before the change you mean to test.
#
# Compared against SOURCE FILE mtimes rather than commit times. Commit time is
# the wrong clock — building from a dirty tree and committing afterwards is
# normal, and would make a perfectly good APK look stale. A source file modified
# after the APK was written, however, is definitively not in it.
NEWER_THAN_APK="$(
  cd "$REPO_ROOT" || exit 0
  git ls-files -z -- src app.json app.config.js ':(exclude)src/**/__tests__/**' 2>/dev/null |
    xargs -0 -r ls -t 2>/dev/null |
    while IFS= read -r f; do
      [ "$f" -nt "$APK" ] || break
      printf '%s\n' "$f"
    done
)"

if [ -z "$NEWER_THAN_APK" ]; then
  pass "no shipped source file is newer than the APK"
else
  COUNT="$(printf '%s\n' "$NEWER_THAN_APK" | wc -l | tr -d ' ')"
  fail "${COUNT} source file(s) changed after this APK was built" \
       "$(printf '%s' "$NEWER_THAN_APK" | head -3 | tr '\n' ' ')— rebuild before testing"
fi

# Uncommitted changes are not in any APK unless the APK was built from them.
# Reported, not failed: mid-iteration local builds are the normal case.
if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- src app.json ':(exclude)src/**/__tests__/**' 2>/dev/null)" ]; then
  note "working tree has uncommitted source changes (fine if this APK was built from them)"
fi

summary
