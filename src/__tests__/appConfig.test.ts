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
import fs from "fs";
import path from "path";

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

    // These must be explicitly `false`, NOT merely absent — which is what this
    // test used to assert, on the reasonable-sounding but wrong assumption that
    // a permission you never configure is a permission you never ship.
    //
    // @expo/config-plugins/build/ios/Permissions.js:28-31 fills in a DEFAULT
    // string for any key left undefined, and only `=== false` deletes it:
    //
    //   if (permissions[permission] === false) delete infoPlist[permission];
    //   else infoPlist[permission] =
    //          permissions[permission] || infoPlist[permission] || description;
    //
    // So with these keys omitted, the generated Info.plist carried
    // NSLocationAlwaysUsageDescription and
    // NSLocationAlwaysAndWhenInUseUsageDescription reading "Allow
    // $(PRODUCT_NAME) to access your location" — two always-location purpose
    // strings for a permission this app never requests, which is a Guideline
    // 5.1.1 question waiting to be asked at review. Verified against a real
    // `expo prebuild` plist, not inferred.
    expect(options?.locationAlwaysPermission).toBe(false);
    expect(options?.locationAlwaysAndWhenInUsePermission).toBe(false);
  });

  it("registers the Sentry Expo plugin exactly once", () => {
    expect(findPluginEntries(expo.plugins, "@sentry/react-native/expo")).toHaveLength(1);
  });

  it("declares every shipped translation to iOS, or the store lists it English-only", () => {
    // CFBundleLocalizations is how App Store Connect derives the listing's
    // Languages field and how iOS decides whether to offer the per-app language
    // picker in Settings. expo-localization only emits it when given
    // supportedLocales (withExpoLocalization.js:42-43); without the option the
    // key is simply absent, so six translations shipped advertising as one.
    //
    // Derived from the shipped translation tables rather than hardcoded, so
    // adding a language fails here until it is also declared to iOS.
    //
    // Read off disk rather than imported: src/localization/i18n.ts pulls in
    // i18n-js, which ships as ESM and is not in this project's
    // transformIgnorePatterns, so importing it here dies with
    // "SyntaxError: Unexpected token 'export'". The directory listing is the
    // same source of truth without the module graph.
    const shipped = fs
      .readdirSync(path.join(__dirname, "../localization"))
      .filter((f) => f.endsWith(".ts") && f !== "i18n.ts")
      .map((f) => f.replace(/\.ts$/, ""))
      .sort();
    const options = getPluginOptions(expo.plugins, "expo-localization");

    expect(shipped.length).toBeGreaterThan(1);

    expect(options?.supportedLocales).toBeDefined();
    expect([...(options!.supportedLocales as string[])].sort()).toEqual(shipped);
  });

  it("renders light status-bar glyphs, which the app's dark surface requires", () => {
    // UIViewControllerBasedStatusBarAppearance resolves to false here, so this
    // plist key governs the pre-JS window (splash). App.tsx renders
    // <StatusBar style="light" /> for the post-mount case; the default is dark
    // glyphs, which on #1C1B4D is dark-on-dark.
    expect(expo.ios?.infoPlist?.UIStatusBarStyle).toBe(
      "UIStatusBarStyleLightContent"
    );
  });

  it("leaves the iOS build number to EAS, and syncs the widget to it", () => {
    // eas.json uses appVersionSource "remote" with production.ios.autoIncrement,
    // so EAS issues the app's build number. A literal here would be ignored for
    // the app but still consumed by @bacons/apple-targets for the widget
    // target's CURRENT_PROJECT_VERSION (with-widget.js:232) — which is how the
    // app and its appex end up disagreeing and the upload is rejected with
    // ITMS-90473.
    expect(expo.ios).not.toHaveProperty("buildNumber");

    // The plugin that closes the gap has to run BEFORE apple-targets reads
    // ios.buildNumber, so order is part of the contract, not a detail.
    const names = asPlugins(expo.plugins).map(pluginName);
    const ours = names.indexOf("./plugins/withWidgetBuildNumber");
    const appleTargets = names.indexOf("@bacons/apple-targets");

    expect(ours).toBeGreaterThanOrEqual(0);
    expect(appleTargets).toBeGreaterThanOrEqual(0);
    expect(ours).toBeLessThan(appleTargets);
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

/**
 * Preview variant contract (d1ed6cc): the preview profile must install beside
 * production on one Android device, stay distinguishable in the launcher's
 * widget picker, and leave the production and iOS config untouched. These
 * assertions lock that contract so an app.config.js edit that regresses any
 * side of it fails the gate.
 */
describe("app.config.js — preview variant contract", () => {
  const ORIGINAL_PROFILE = process.env.EAS_BUILD_PROFILE;

  afterAll(() => {
    if (ORIGINAL_PROFILE === undefined) {
      delete process.env.EAS_BUILD_PROFILE;
    } else {
      process.env.EAS_BUILD_PROFILE = ORIGINAL_PROFILE;
    }
  });

  type AndroidConfig = {
    package?: string;
    icon?: string;
    adaptiveIcon?: { foregroundImage?: string };
  };
  type WidgetEntry = Record<string, unknown> & { label: string };

  const widgets = (plugins: unknown): WidgetEntry[] =>
    (getPluginOptions(plugins, "react-native-android-widget")?.widgets as
      | WidgetEntry[]
      | undefined) ?? [];

  const omit = (obj: Record<string, unknown>, key: string) => {
    const copy = { ...obj };
    delete copy[key];
    return copy;
  };

  it("installs beside production: distinct Android package and app name", () => {
    const cfg = buildEffectiveConfig("preview");
    expect((cfg.android as AndroidConfig).package).toBe(
      "com.ekarni.rndualtempweatherapp.preview"
    );
    expect(cfg.name).toBe("Dualtemp Weather Preview");
  });

  it("uses the preview-badged icons", () => {
    const android = buildEffectiveConfig("preview").android as AndroidConfig;
    expect(android.icon).toBe("./assets/icon-preview.png");
    expect(android.adaptiveIcon?.foregroundImage).toBe(
      "./assets/adaptive-icon-preview.png"
    );
  });

  it("prefixes every widget picker label with [Preview] and changes nothing else", () => {
    const preview = widgets(buildEffectiveConfig("preview").plugins);
    const base = widgets(appJson.expo.plugins);
    expect(base.length).toBeGreaterThan(0);
    expect(preview.map((w) => w.label)).toEqual(
      base.map((w) => `[Preview] ${w.label}`)
    );
    expect(preview.map((w) => omit(w, "label"))).toEqual(
      base.map((w) => omit(w, "label"))
    );
  });

  it("keeps the slug so EAS project validation still passes", () => {
    expect(buildEffectiveConfig("preview").slug).toBe("dualtemp-weather");
  });

  it("leaves the iOS config identical to app.json (no bundle id / App Group fork)", () => {
    expect(buildEffectiveConfig("preview").ios).toEqual(appJson.expo.ios);
  });

  it("still registers the Sentry Expo plugin exactly once after the plugins rewrite", () => {
    const cfg = buildEffectiveConfig("preview");
    expect(findPluginEntries(cfg.plugins, "@sentry/react-native/expo")).toHaveLength(1);
  });

  it("leaves the production variant identical to app.json outside extra", () => {
    const prod = omit(buildEffectiveConfig("production"), "extra");
    const base = omit(appJson.expo as unknown as Record<string, unknown>, "extra");
    expect(prod).toEqual(base);
  });
});
