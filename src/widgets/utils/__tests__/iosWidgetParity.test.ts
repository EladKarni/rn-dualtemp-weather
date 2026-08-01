/**
 * Behavioural parity between the iOS widget and the Android widgets.
 *
 * iosWidgetStorage.swiftContract.test.ts already pins the payload SHAPE — the
 * fields Swift will decode. This pins what Swift then DOES with them, which is
 * a different failure mode and a quieter one: a shape mismatch blanks the
 * widget and gets noticed, whereas a logic divergence renders a perfectly
 * plausible widget that simply disagrees with the phone in the other pocket.
 *
 * That is not hypothetical here. The Swift icon mapping was written as ranges
 * (`case 701...781: return "🌫️"`) where the JS is a per-id table, and ranges
 * cannot express a table whose adjacent entries differ. Eleven condition codes
 * resolved to a different icon on iOS than on Android, including all four
 * tornado codes, which showed fog.
 *
 * Nothing else can catch this. tsc cannot see Swift, the Linux gate never
 * compiles it, and the two implementations are only ever compared by a human
 * holding two phones. So this parses the Swift source from Node — no compiler,
 * no simulator, milliseconds.
 */
import fs from "fs";
import path from "path";

import {
  WEATHER_ICON_MAP,
  getWeatherIcon,
} from "../widgetDataUtils";

// widgetDataUtils imports i18n (for formatDataAge), and i18n-js ships ESM that
// jest-expo does not transform. Nothing here exercises a localized string.
// babel-plugin-jest-hoist lifts this above the import above.
jest.mock("../../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

const SWIFT = fs.readFileSync(
  path.join(__dirname, "../../../../targets/widget/widgets.swift"),
  "utf8"
);

/**
 * Parse `let weatherIconMap: [Int: String] = [ 800: "☀️", ... ]` out of the
 * Swift source.
 *
 * Scoped to the literal's own brackets rather than regexing the whole file, so
 * an unrelated `Int: String` dictionary elsewhere cannot leak entries in and
 * quietly satisfy the diff below.
 */
const swiftIconMap = (): Record<number, string> => {
  const marker = "let weatherIconMap: [Int: String] = [";
  const start = SWIFT.indexOf(marker);
  if (start === -1) {
    throw new Error("weatherIconMap not found in widgets.swift");
  }
  const body = SWIFT.slice(start + marker.length, SWIFT.indexOf("\n]", start));

  const map: Record<number, string> = {};
  for (const [, id, icon] of body.matchAll(/(\d+)\s*:\s*"([^"]+)"/g)) {
    map[Number(id)] = icon;
  }
  return map;
};

/** Swift's generic fallback, read from source rather than assumed. */
const swiftFallback = (): string => {
  const match = SWIFT.match(/func getWeatherIcon[\s\S]*?return "([^"]+)"\s*\n\}/);
  if (!match) {
    throw new Error("getWeatherIcon's fallback return not found in widgets.swift");
  }
  return match[1];
};

describe("weather icons resolve identically on both platforms", () => {
  const swift = swiftIconMap();

  it("finds a table to compare, rather than vacuously passing", () => {
    // Guards the parser: if widgets.swift is restructured such that this stops
    // finding entries, every assertion below would trivially succeed.
    expect(Object.keys(swift).length).toBeGreaterThan(40);
  });

  it("declares exactly the same ids as the JS table", () => {
    const jsIds = Object.keys(WEATHER_ICON_MAP).map(Number).sort((a, b) => a - b);
    const swiftIds = Object.keys(swift).map(Number).sort((a, b) => a - b);
    expect(swiftIds).toEqual(jsIds);
  });

  it("maps every id to the same icon", () => {
    const divergent = Object.keys(WEATHER_ICON_MAP)
      .map(Number)
      .filter((id) => swift[id] !== WEATHER_ICON_MAP[id])
      .map((id) => `${id}: android=${WEATHER_ICON_MAP[id]} ios=${swift[id]}`);

    expect(divergent).toEqual([]);
  });

  it("agrees across every condition code OpenWeather can actually send", () => {
    // The real test of the fallback chain. Covers the documented codes plus the
    // gaps between them, since an unknown id must degrade the same way on both
    // platforms — not just the ids someone remembered to tabulate.
    const fallback = swiftFallback();
    const resolveSwift = (id: number): string =>
      swift[id] ?? swift[Math.floor(id / 100) * 100] ?? fallback;

    const divergent: string[] = [];
    for (let id = 200; id <= 810; id++) {
      const android = getWeatherIcon(id);
      const ios = resolveSwift(id);
      if (android !== ios) {
        divergent.push(`${id}: android=${android} ios=${ios}`);
      }
    }

    expect(divergent).toEqual([]);
  });

  it("shows a tornado for the tornado codes, on both", () => {
    // The specific regression that motivated this file: 731/761/762/771 are
    // interleaved with fog codes in the 7xx block, so the Swift range
    // `701...781` swallowed all four and rendered severe weather as haze.
    for (const id of [731, 761, 762, 771]) {
      expect(WEATHER_ICON_MAP[id]).toBe("🌪️");
      expect(swift[id]).toBe("🌪️");
    }
  });
});

describe("the widget theme survives the trip to Swift", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WIDGET_THEME_LIST, WIDGET_THEMES, DEFAULT_WIDGET_THEME } =
    require("../../../styles/widgetThemes");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { toHexColor } = require("../hexColor");

  it("can express every preset as the opaque #RRGGBB the payload carries", () => {
    // Swift parses exactly six hex digits. A preset that cannot be normalised —
    // a named colour, or a translucent one — would silently fall back to the
    // default on iOS while rendering correctly on Android.
    for (const theme of WIDGET_THEME_LIST) {
      expect(toHexColor(theme.element)).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(WIDGET_THEME_LIST.length).toBeGreaterThan(1);
  });

  it("falls back to the same colour Swift hardcodes for a pre-v3 payload", () => {
    // A device holding a payload from an older app build has no elementColor,
    // so Swift uses WidgetColors.defaultElement. That literal has to be the
    // default preset, or upgrading the app would silently change the widget's
    // colour for anyone who never opened the picker.
    const expected = toHexColor(WIDGET_THEMES[DEFAULT_WIDGET_THEME].element);

    const match = SWIFT.match(
      /static let defaultElement = Color\(red: ([\d.]+), green: ([\d.]+), blue: ([\d.]+)\)/
    );
    expect(match).not.toBeNull();

    const [, r, g, b] = match!;
    const channel = (v: string) =>
      Math.round(Number(v) * 255)
        .toString(16)
        .padStart(2, "0");
    expect(`#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()).toBe(
      expected
    );
  });

  it("declares elementColor as optional, so older payloads still decode", () => {
    // Swift's synthesised decoder is all-or-nothing: a non-optional addition
    // makes every pre-v3 payload throw, getWeatherData() return nil, and the
    // widget show its grey placeholder with nothing logged.
    expect(SWIFT).toMatch(/let elementColor: String\?/);
  });
});

describe("right-to-left layout agrees on which languages are RTL", () => {
  it("lists the same RTL locales as the JS detector", () => {
    // widgets.swift:68 hardcodes `["he", "ar"]`. If a third RTL language is
    // ever added to the app, the iOS widget would keep laying it out
    // left-to-right with nothing to flag it.
    const match = SWIFT.match(/isRTL:\s*Bool\s*\{[^}]*\[([^\]]*)\]/);
    expect(match).not.toBeNull();

    const swiftRTL = [...match![1].matchAll(/"([a-z-]+)"/g)]
      .map((m) => m[1])
      .sort();

    const shipped = fs
      .readdirSync(path.join(__dirname, "../../../localization"))
      .filter((f) => f.endsWith(".ts") && f !== "i18n.ts")
      .map((f) => f.replace(/\.ts$/, ""));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isRTLLanguage } = require("../../../utils/rtlDetection");
    const jsRTL = shipped.filter(isRTLLanguage).sort();

    expect(swiftRTL).toEqual(jsRTL);
  });
});
