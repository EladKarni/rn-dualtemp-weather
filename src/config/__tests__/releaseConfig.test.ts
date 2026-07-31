/**
 * Release-configuration invariants.
 *
 * These run in the ordinary gate rather than at release time on purpose: every
 * failure below is a mistake that costs a whole build cycle — or a store
 * rejection — to discover, and seconds to catch here. They are deliberately
 * about config files rather than code, because config is the part of this
 * project that nothing else type-checks, lints or exercises.
 *
 * Each case names the failure it prevents. If one starts failing, read the
 * comment before "fixing" the assertion.
 */
import easJson from "../../../eas.json";
import appJson from "../../../app.json";
import packageJson from "../../../package.json";

const build = easJson.build as Record<string, any>;
const expo = appJson.expo;

describe("version is stated once and agreed everywhere", () => {
  // The marketing version is hand-edited in several files. When they drift, the
  // app shows one number, the store shows another, and Sentry groups releases
  // under an identity that matches neither.
  it("package.json and app.json state the same version", () => {
    expect(expo.version).toBe(packageJson.version);
  });

  it("is a plain semver triple", () => {
    // EAS runtimeVersion is `appVersion`, so anything exotic here changes OTA
    // update compatibility as a side effect.
    expect(expo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("the AppFooter fallback matches, so a missing manifest cannot show a stale version", () => {
    // AppFooter reads Constants.expoConfig?.version and falls back to a literal.
    // The fallback is what users see if the manifest is unavailable, so a stale
    // one is a silently wrong version number in the UI.
    const footer = require("fs").readFileSync(
      require("path").join(__dirname, "../../components/AppFooter/AppFooter.tsx"),
      "utf8"
    );
    const fallback = footer.match(/Constants\.expoConfig\?\.version\s*\?\?\s*"([^"]+)"/);
    expect(fallback).not.toBeNull();
    expect(fallback?.[1]).toBe(expo.version);
  });
});

describe("every distributable profile auto-increments its build number", () => {
  // Google Play rejects an AAB whose versionCode it has already seen, and App
  // Store Connect rejects a duplicate buildNumber. With appVersionSource:
  // "remote" the number comes from EAS, and ONLY if autoIncrement is set for
  // that profile and platform — a missing block is silent until the upload is
  // refused, by which point the build has already been paid for.
  it("uses the remote version source, which is what makes autoIncrement meaningful", () => {
    expect(easJson.cli.appVersionSource).toBe("remote");
  });

  it("production increments on both platforms it ships to", () => {
    expect(build.production?.android?.autoIncrement).toBe(true);
    expect(build.production?.ios?.autoIncrement).toBe(true);
  });

  it("preview increments on Android, the only platform it may build", () => {
    expect(build.preview?.android?.autoIncrement).toBe(true);
  });

  it("preview stays unconfigured for iOS, because an iOS preview build would overwrite production", () => {
    // The preview profile deliberately leaves the iOS config untouched, so an
    // iOS build from it carries the PRODUCTION bundle id. Adding an ios block
    // here is the first step towards someone doing that by accident; the README
    // guardrail is the second line of defence, not the first.
    expect(build.preview?.ios).toBeUndefined();
  });
});

describe("widget declarations stay consistent with the code that renders them", () => {
  const widgetPlugin = (expo.plugins as unknown[]).find(
    (plugin): plugin is [string, { widgets: any[] }] =>
      Array.isArray(plugin) && String(plugin[0]).includes("android-widget")
  );
  const widgets: any[] = widgetPlugin?.[1]?.widgets ?? [];
  const byName = Object.fromEntries(widgets.map((w) => [w.name, w]));

  it("declares exactly the three widgets the task handler knows how to render", () => {
    // A widget declared here but absent from nameToWidget renders the error
    // view; one implemented but not declared never appears in the picker.
    expect(Object.keys(byName).sort()).toEqual([
      "WeatherCompact",
      "WeatherExtended",
      "WeatherStandard",
    ]);
  });

  it("keeps WeatherExtended resizable on both axes", () => {
    // The daily row picks its density from the measured width and its day count
    // from the measured height. Dropping an axis here does not break the build —
    // it silently freezes the widget at one size and makes half that logic dead.
    expect(byName.WeatherExtended.resizeMode).toBe("horizontal|vertical");
    expect(byName.WeatherExtended.maxResizeWidth).toBeDefined();
    expect(byName.WeatherExtended.maxResizeHeight).toBeDefined();
  });

  it.each(["WeatherCompact", "WeatherStandard", "WeatherExtended"])(
    "%s ships a preview image for the picker",
    (name) => {
      expect(byName[name].previewImage).toMatch(/^\.\/assets\/widget-preview\/.+\.png$/);
      expect(
        require("fs").existsSync(
          require("path").join(__dirname, "../../..", byName[name].previewImage)
        )
      ).toBe(true);
    }
  );

  it.each(["WeatherCompact", "WeatherStandard", "WeatherExtended"])(
    "%s refreshes on the same cycle",
    (name) => {
      // Three different periods would mean three headless tasks waking at three
      // different times, tripling the API cost of a single visible refresh.
      expect(byName[name].updatePeriodMillis).toBe(1800000);
    }
  );
});

describe("scripts referenced by package.json exist", () => {
  // A script that names a missing file fails only when someone runs it, which
  // for release-adjacent scripts is exactly the worst moment.
  const scripts = packageJson.scripts as Record<string, string>;

  it.each(Object.entries(scripts))("%s resolves its local script file", (_name, command) => {
    const local = command.match(/node\s+(scripts\/[\w./-]+)/);
    if (!local) {
      return;
    }
    expect(
      require("fs").existsSync(require("path").join(__dirname, "../../..", local[1]))
    ).toBe(true);
  });
});

describe("the backend URL comes from the environment, not from a fallback", () => {
  // fetchWeather reads EXPO_PUBLIC_WEATHER_API_URL at module load and falls
  // back to a hardcoded proxy when it is unset. That fallback is a safety net,
  // not a configuration mechanism: a production build that silently used it
  // would work perfectly right up until the day that URL changes, and nothing
  // would connect the outage to a missing variable.
  it.each(Object.keys(build))(
    "%s declares the EAS environment it resolves variables from",
    (profile) => {
      // Without this, EAS resolves NO variables for the profile — the build
      // succeeds and quietly bakes in the fallback.
      expect(build[profile].environment).toBeDefined();
    }
  );

  it("production does not pin a URL in eas.json, so the environment supplies it", () => {
    // preview deliberately pins one (it points at a scratch proxy). Production
    // must not: a value here overrides the EAS environment, which would put the
    // real backend URL in version control and make rotating it a code change.
    expect(build.production?.env?.EXPO_PUBLIC_WEATHER_API_URL).toBeUndefined();
  });
});
