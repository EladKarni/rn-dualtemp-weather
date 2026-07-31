/**
 * Which position-provider failures are "expected".
 *
 * expo-location derives its error codes from exception CLASS NAMES —
 * `CurrentLocationIsUnavailableException` becomes
 * `ERR_CURRENT_LOCATION_IS_UNAVAILABLE` — and those names changed when the
 * library moved to CodedException. The hook originally recognised only the two
 * legacy `E_`-prefixed spellings, so the code a real device raises when it has
 * no current fix fell straight through to the error path: the user got no
 * last-known-position fallback, and Sentry got an error event for a phone
 * sitting indoors.
 *
 * These tests read the codes from expo-location's own source rather than from a
 * hardcoded list, so an SDK upgrade that renames one fails here instead of
 * silently turning a handled condition back into an error.
 */
import fs from "fs";
import path from "path";

const EXCEPTIONS_KT = path.join(
  __dirname,
  "../../../node_modules/expo-location/android/src/main/java/expo/modules/location/LocationExceptions.kt"
);

const HOOK = fs.readFileSync(
  path.join(__dirname, "../useGPSLocation.ts"),
  "utf8"
);

/** The code names in the hook's expected-failure allow-list. */
const expectedList = (): string[] => {
  const block = HOOK.match(
    /EXPECTED_POSITION_FAILURES = new Set\(\[([\s\S]*?)\]\)/
  );
  if (!block) {
    throw new Error("EXPECTED_POSITION_FAILURES not found in useGPSLocation.ts");
  }
  return [...block[1].matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
};

/**
 * Turn an expo CodedException class name into the code it produces:
 * CurrentLocationIsUnavailableException -> ERR_CURRENT_LOCATION_IS_UNAVAILABLE
 */
const codeForClass = (name: string): string =>
  "ERR_" +
  name
    .replace(/Exception$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();

describe("expected position failures", () => {
  it("recognises the code a device with no current fix actually raises", () => {
    // The specific regression: this is what an emulator, and any phone indoors
    // without a fix, produces. Missing it costs the user their fallback.
    expect(expectedList()).toContain("ERR_CURRENT_LOCATION_IS_UNAVAILABLE");
  });

  it("still recognises the legacy spellings, so an older runtime cannot regress", () => {
    expect(expectedList()).toEqual(
      expect.arrayContaining(["E_LOCATION_UNAVAILABLE", "E_LOCATION_TIMEOUT"])
    );
  });

  it("every modern code it lists really exists in the installed expo-location", () => {
    // Guards against a typo in the allow-list, which would be invisible: a code
    // that never matches simply means the error path is taken, exactly as
    // before the fix.
    if (!fs.existsSync(EXCEPTIONS_KT)) {
      return; // expo-location not installed with Android sources; nothing to check
    }
    const source = fs.readFileSync(EXCEPTIONS_KT, "utf8");
    const available = [...source.matchAll(/internal class (\w+Exception)/g)].map((m) =>
      codeForClass(m[1])
    );

    const modern = expectedList().filter((code) => code.startsWith("ERR_"));
    expect(modern.length).toBeGreaterThan(0);
    for (const code of modern) {
      expect(available).toContain(code);
    }
  });

  it("does not swallow codes that mean something is genuinely wrong", () => {
    // Permission and manifest problems are defects or user-actionable states
    // that deserve to surface, not be quietly downgraded to a stale position.
    for (const code of [
      "ERR_LOCATION_UNAUTHORIZED",
      "ERR_NO_PERMISSIONS_MODULE",
      "ERR_LOCATION_BACKGROUND_UNAUTHORIZED",
    ]) {
      expect(expectedList()).not.toContain(code);
    }
  });
});
