/**
 * Config policy assertions (Worker G / plan §5).
 *
 * Locks two decisions so a future edit that regresses either is caught by the
 * gate instead of shipped:
 *   - Decision D7: no ACCESS_BACKGROUND_LOCATION, background location disabled,
 *     when-in-use permission strings only.
 *   - Sentry Expo config plugin is registered exactly once (it was previously
 *     double-registered: parameterized in app.json + a plain append in
 *     app.config.js).
 *
 * We assert on BOTH the static app.json AND the EFFECTIVE config produced by
 * app.config.js (which overlays app.json via a dynamic-config function), so the
 * policy holds after the merge — not just in the source JSON.
 */
import appJson from "../../app.json";

type PluginEntry = string | [string, Record<string, unknown>?];

const asPlugins = (plugins: unknown): PluginEntry[] =>
  Array.isArray(plugins) ? (plugins as PluginEntry[]) : [];

const pluginName = (entry: PluginEntry): string =>
  Array.isArray(entry) ? entry[0] : entry;

const findPluginEntries = (plugins: unknown, name: string): PluginEntry[] =>
  asPlugins(plugins).filter((entry) => pluginName(entry) === name);

const getPluginOptions = (
  plugins: unknown,
  name: string
): Record<string, unknown> | undefined => {
  const match = asPlugins(plugins).find((entry) => pluginName(entry) === name);
  return Array.isArray(match) ? match[1] : undefined;
};

// app.config.js default-exports ({ config }) => finalConfig. Load the real
// module (it has no side effects and imports nothing native).
const appConfigFn = jest.requireActual("../../app.config.js").default as (args: {
  config: unknown;
}) => Record<string, unknown>;

const buildEffectiveConfig = (
  profile?: string
): Record<string, unknown> => {
  if (profile === undefined) {
    delete process.env.EAS_BUILD_PROFILE;
  } else {
    process.env.EAS_BUILD_PROFILE = profile;
  }
  return appConfigFn({ config: appJson.expo });
};

describe("app.json — static config policy", () => {
  const expo = appJson.expo;

  it("does not request ACCESS_BACKGROUND_LOCATION (decision D7)", () => {
    const permissions = expo.android?.permissions ?? [];
    expect(permissions).not.toContain("ACCESS_BACKGROUND_LOCATION");
  });

  it("disables Android background location in the expo-location plugin (D7)", () => {
    const options = getPluginOptions(expo.plugins, "expo-location");
    expect(options).toBeDefined();
    expect(options?.isAndroidBackgroundLocationEnabled).toBe(false);
  });

  it("uses a when-in-use location permission string only (D7)", () => {
    const options = getPluginOptions(expo.plugins, "expo-location");
    expect(options?.locationWhenInUsePermission).toBeTruthy();
    expect(options).not.toHaveProperty("locationAlwaysAndWhenInUsePermission");
  });

  it("registers the Sentry Expo plugin exactly once", () => {
    expect(findPluginEntries(expo.plugins, "@sentry/react-native/expo")).toHaveLength(1);
  });
});

describe("app.config.js — effective config after dynamic merge", () => {
  const ORIGINAL_PROFILE = process.env.EAS_BUILD_PROFILE;

  afterAll(() => {
    if (ORIGINAL_PROFILE === undefined) {
      delete process.env.EAS_BUILD_PROFILE;
    } else {
      process.env.EAS_BUILD_PROFILE = ORIGINAL_PROFILE;
    }
  });

  it("still omits ACCESS_BACKGROUND_LOCATION in the production variant (D7)", () => {
    const cfg = buildEffectiveConfig("production");
    const android = cfg.android as { permissions?: string[] } | undefined;
    expect(android?.permissions ?? []).not.toContain("ACCESS_BACKGROUND_LOCATION");
  });

  it("still omits ACCESS_BACKGROUND_LOCATION in the development variant (D7)", () => {
    const cfg = buildEffectiveConfig("development");
    const android = cfg.android as { permissions?: string[] } | undefined;
    expect(android?.permissions ?? []).not.toContain("ACCESS_BACKGROUND_LOCATION");
  });

  it("does not double-register the Sentry Expo plugin", () => {
    const cfg = buildEffectiveConfig("production");
    expect(findPluginEntries(cfg.plugins, "@sentry/react-native/expo")).toHaveLength(1);
  });
});
