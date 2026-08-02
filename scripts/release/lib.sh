#!/usr/bin/env bash
# Shared helpers for the release verification scripts.
#
# Sourced, not executed. Everything here is deliberately dependency-free: these
# scripts have to run on a Linux/WSL box for Android and on a Mac for iOS, on
# whatever is already installed.

set -euo pipefail

RESET=$'\033[0m'; BOLD=$'\033[1m'
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'

FAILURES=0
CHECKS=0

pass() { CHECKS=$((CHECKS + 1)); printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
fail() {
  CHECKS=$((CHECKS + 1)); FAILURES=$((FAILURES + 1))
  printf '  %s✗%s %s\n' "$RED" "$RESET" "$1"
  [ $# -gt 1 ] && printf '      %s%s%s\n' "$DIM" "$2" "$RESET"
  return 0
}
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
note() { printf '    %s%s%s\n' "$DIM" "$1" "$RESET"; }
step() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }

die() { printf '%serror:%s %s\n' "$RED" "$RESET" "$1" >&2; exit 1; }

summary() {
  printf '\n'
  if [ "$FAILURES" -eq 0 ]; then
    printf '%s%s✓ %d/%d checks passed%s\n' "$BOLD" "$GREEN" "$CHECKS" "$CHECKS" "$RESET"
    return 0
  fi
  printf '%s%s✗ %d of %d checks failed%s\n' "$BOLD" "$RED" "$FAILURES" "$CHECKS" "$RESET"
  return 1
}

# --- Android tooling -------------------------------------------------------

# Resolve adb. Under WSL the Linux adb cannot see a Windows-hosted emulator, so
# the Windows binary is used instead and every path handed to it must be a
# Windows path (see to_host_path). Override with ADB=... when neither applies.
resolve_adb() {
  if [ -n "${ADB:-}" ]; then printf '%s' "$ADB"; return; fi
  if grep -qi microsoft /proc/version 2>/dev/null && [ -x /mnt/c/platform-tools/adb.exe ]; then
    printf '/mnt/c/platform-tools/adb.exe'; return
  fi
  command -v adb >/dev/null 2>&1 || die "adb not found. Install platform-tools, or set ADB=/path/to/adb"
  command -v adb
}

# Windows adb cannot read /home/... — translate for it, pass through otherwise.
to_host_path() {
  case "$(resolve_adb)" in
    *.exe) wslpath -w "$1" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Text-mode adb. The Windows binary used under WSL emits CRLF, which silently
# breaks every `grep '...$'` and every numeric comparison downstream, so all
# text output goes through here. Binary output (screencap) must NOT — call adb
# directly for that.
adb_run() {
  # `|| true` on the pipeline: callers routinely pipe this into head/grep -m1,
  # and under `set -o pipefail` the resulting SIGPIPE would abort the script
  # with 141 rather than returning the line that was asked for.
  { "$(resolve_adb)" "$@" || true; } | tr -d '\r'
}

require_one_device() {
  local count
  count="$(adb_run devices | grep -cE '[[:space:]]device$' || true)"
  [ "$count" -eq 1 ] || die "expected exactly 1 connected device, found ${count}. Run '$(resolve_adb) devices'."
}

# Resolve the applicationId for a build profile. The suffixes come from
# app.config.js, so this stays a lookup rather than a second source of truth.
package_for_profile() {
  case "${1:-preview}" in
    preview) printf 'com.ekarni.rndualtempweatherapp.preview' ;;
    development|dev) printf 'com.ekarni.rndualtempweatherapp.dev' ;;
    production|prod) printf 'com.ekarni.rndualtempweatherapp' ;;
    *) die "unknown profile '${1}'. Use preview, development or production." ;;
  esac
}

# Newest locally built APK, which is what a local release run has just produced.
newest_apk() {
  local newest="" f
  for f in "${REPO_ROOT}"/build-*.apk; do
    [ -e "$f" ] || continue
    [ -z "$newest" ] || [ "$f" -nt "$newest" ] && newest="$f"
  done
  printf '%s' "$newest"
}

resolve_aapt2() {
  if [ -n "${AAPT2:-}" ]; then printf '%s' "$AAPT2"; return; fi
  local found
  found="$(printf '%s\n' "${ANDROID_HOME:-$HOME/Android/Sdk}"/build-tools/*/aapt2 2>/dev/null | sort -V | grep -v '\*' | tail -1 || true)"
  [ -x "$found" ] || found=""
  [ -n "$found" ] || return 1
  printf '%s' "$found"
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
