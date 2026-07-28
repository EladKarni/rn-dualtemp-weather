#!/usr/bin/env bash
# Renders the iOS widget views to PNGs at exact WidgetKit sizes.
# macOS only — needs Xcode 15+ (macOS 14 SDK). Run from anywhere:
#   scripts/widget-screenshots/ios/render.sh [output-dir]
# Default output: store/screenshots/widgets/ios/
set -euo pipefail

cd "$(dirname "$0")/../../.."
OUT="${1:-store/screenshots/widgets/ios}"

ARCH="$(uname -m)"
BIN="$(mktemp -d)/render-widgets"

xcrun swiftc -parse-as-library \
  -target "${ARCH}-apple-macosx14.0" \
  targets/widget/widgets.swift \
  scripts/widget-screenshots/ios/RenderWidgets.swift \
  -o "$BIN"

"$BIN" "$OUT"
