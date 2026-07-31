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
# Answered from CONTENT when the APK carries a build-info sidecar (written by
# build-android.sh), and only from mtimes when it does not. mtimes lie in both
# directions — `git stash`, `git checkout` and `git restore` touch files whose
# content never changed, so an mtime-only check reports phantom drift, and a
# check that cries wolf trains people to skip it.
INFO="${APK}.build-info"

if [ -f "$INFO" ]; then
  BUILT_FROM="$(grep -oE '^commit=.*' "$INFO" | cut -d= -f2)"
  BUILT_TREE="$(grep -oE '^tree=.*' "$INFO" | cut -d= -f2)"

  if ! git -C "$REPO_ROOT" cat-file -e "${BUILT_FROM}^{commit}" 2>/dev/null; then
    warn "APK records commit ${BUILT_FROM:0:7}, which is not in this repo"
  else
    DRIFT="$(git -C "$REPO_ROOT" diff --name-only "$BUILT_FROM" HEAD -- \
      src app.json app.config.js ':(exclude)src/**/__tests__/**' 2>/dev/null || true)"

    if [ -z "$DRIFT" ] && [ "$BUILT_TREE" = "clean" ]; then
      pass "APK contains exactly the shipped source at HEAD"
    elif [ -z "$DRIFT" ]; then
      warn "APK matches HEAD, but was built from a dirty tree"
      note "it may contain changes that were never committed"
    else
      COUNT="$(printf '%s\n' "$DRIFT" | wc -l | tr -d ' ')"
      fail "${COUNT} shipped file(s) changed since this APK was built" \
           "$(printf '%s' "$DRIFT" | head -3 | tr '\n' ' ')— rebuild before testing"
    fi
  fi

  # Uncommitted work is never in an APK built before it.
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- src app.json ':(exclude)src/**/__tests__/**' 2>/dev/null)" ]; then
    warn "working tree has uncommitted source changes not in this APK"
  fi
else
  note "no build-info sidecar — falling back to modification times"
  note "build with 'yarn build:android' to get a content-based check instead"

  NEWER="$(
    cd "$REPO_ROOT" || exit 0
    git ls-files -z -- src app.json app.config.js ':(exclude)src/**/__tests__/**' 2>/dev/null |
      xargs -0 -r ls -t 2>/dev/null |
      while IFS= read -r f; do
        [ "$f" -nt "$APK" ] || break
        printf '%s\n' "$f"
      done
  )"

  if [ -z "$NEWER" ]; then
    pass "no shipped source file is newer than the APK"
  else
    COUNT="$(printf '%s\n' "$NEWER" | wc -l | tr -d ' ')"
    warn "${COUNT} source file(s) have a newer mtime than the APK"
    note "mtime is not proof of a content change; rebuild if in doubt"
  fi
fi

summary
