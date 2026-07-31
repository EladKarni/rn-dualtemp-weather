#!/usr/bin/env bash
#
# Build the Android APK locally and record what it was built FROM.
#
# The recording is the point. Without it, "is the APK on my device the code I
# think it is?" can only be answered by comparing file modification times, and
# mtimes lie in both directions: `git stash`, `git checkout` and `git restore`
# all touch files whose content never changed, while a file edited and reverted
# looks untouched. This writes the commit and the working-tree state alongside
# the APK so the question can be answered from content instead.
#
# Usage: bash scripts/release/build-android.sh [profile]

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PROFILE="${1:-preview}"

step "Building ${PROFILE} (local)"
note "this takes several minutes"

BEFORE="$(newest_apk)"

npx eas build --profile "$PROFILE" --platform android --local --non-interactive

APK="$(newest_apk)"
[ -n "$APK" ] || die "build produced no APK"
[ "$APK" != "$BEFORE" ] || die "no new APK appeared; did the build fail?"

# Sidecar, not a file inside the APK: this has to be readable without unzipping
# 110MB, and it must not change the artifact being shipped.
INFO="${APK}.build-info"
{
  printf 'commit=%s\n' "$(git -C "$REPO_ROOT" rev-parse HEAD)"
  printf 'profile=%s\n' "$PROFILE"
  # Shipped source only — a dirty test file changes nothing in the APK.
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- src app.json app.config.js ':(exclude)src/**/__tests__/**')" ]; then
    printf 'tree=dirty\n'
  else
    printf 'tree=clean\n'
  fi
} > "$INFO"

pass "built $(basename "$APK")"
note "from $(git -C "$REPO_ROOT" rev-parse --short HEAD), tree $(grep -oE 'clean|dirty' "$INFO")"
note "install it: adb install -r $(basename "$APK")"

summary
