/**
 * The JS -> Swift payload contract for the iOS widget.
 *
 * The two halves of this feature are written in different languages, live in
 * different directories, and are built by different toolchains: the JS side
 * writes JSON into an App Group, and `targets/widget/widgets.swift` decodes it
 * with a `Codable` struct. Swift's synthesised decoder is all-or-nothing — one
 * missing non-optional field makes `JSONDecoder` throw, `getWeatherData()`
 * returns nil, and the widget shows its grey placeholder. Forever, silently,
 * with nothing logged anywhere a JS developer would look.
 *
 * Nothing else connects them. `tsc` cannot see Swift, the Linux gate never
 * compiles it, and the JS payload test only asserts the shape JS produces. So
 * this parses the Swift struct declarations and diffs them against the payload
 * the JS actually writes.
 *
 * It runs on Linux, in milliseconds, and would have caught the whole class of
 * "iOS widget went blank after a JS rename" before anyone opened a Mac.
 */
import fs from "fs";
import path from "path";

const SWIFT = fs.readFileSync(
  path.join(__dirname, "../../../../targets/widget/widgets.swift"),
  "utf8"
);

/**
 * Field names and optionality for one `struct X: Codable { let a: T }` block.
 * Deliberately a small parser rather than a regex over the whole file: the
 * point is to read what Swift will actually require, and only the declarations
 * inside the matching struct are that.
 */
const swiftStruct = (name: string): { required: string[]; optional: string[] } => {
  const start = SWIFT.indexOf(`struct ${name}: Codable {`);
  if (start === -1) {
    throw new Error(`struct ${name}: Codable not found in widgets.swift`);
  }
  const body = SWIFT.slice(start, SWIFT.indexOf("\n}", start));
  const required: string[] = [];
  const optional: string[] = [];

  for (const line of body.split("\n").slice(1)) {
    const match = line.match(/^\s*let\s+([A-Za-z0-9_]+)\s*:\s*([^/]+)/);
    if (!match) continue;
    const [, field, type] = match;
    (type.trim().endsWith("?") ? optional : required).push(field);
  }
  return { required, optional };
};

describe("WeatherData", () => {
  const { required, optional } = swiftStruct("WeatherData");

  it("declares the fields this test believes it declares", () => {
    // Guards the parser itself: if widgets.swift is restructured such that this
    // stops finding fields, every other case below would vacuously pass.
    expect(required.length).toBeGreaterThan(8);
    expect(optional).toEqual(
      expect.arrayContaining(["lastUpdatedTimestamp", "schemaVersion", "locale", "chrome"])
    );
  });

  it("requires exactly the non-optional fields the JS payload must always send", () => {
    // Adding a name here means Swift will now reject any payload without it —
    // which is a breaking change for every user still on the previous JS build,
    // because the widget decodes whatever was last written to the App Group.
    // If this list changes, the field must either be optional in Swift or
    // written unconditionally by iosWidgetStorage.
    expect(required.sort()).toEqual([
      "dailyForecast",
      "description",
      "hourlyForecast",
      "humidity",
      "lastUpdated",
      "locationName",
      "temp",
      "tempScale",
      "weatherId",
      "windSpeed",
      "windUnit",
    ]);
  });
});

describe("the JS writer still emits every field Swift requires", () => {
  // The other half of the contract. Swift's requirements are only meaningful if
  // the JS side actually writes those keys, and the payload builder is iOS-only
  // at runtime — so this reads the source rather than executing it, which also
  // means it runs on Linux where the iOS half is otherwise invisible.
  const WRITER = fs.readFileSync(
    path.join(__dirname, "../iosWidgetStorage.ts"),
    "utf8"
  );

  const allRequired = [
    ...swiftStruct("WeatherData").required,
    ...swiftStruct("HourlyForecast").required,
    ...swiftStruct("DailyForecast").required,
    ...swiftStruct("WidgetChrome").required,
  ];

  it.each(allRequired)("iosWidgetStorage writes %s", (field) => {
    // Matches `field:` as an object key. A rename on either side breaks this,
    // which is the entire point: the two files have no other connection.
    expect(WRITER).toMatch(new RegExp(`\\b${field}\\s*:`));
  });
});

describe("nested forecast structs", () => {
  it.each([
    ["HourlyForecast", ["dt", "pop", "temp", "weatherId", "windSpeed"]],
    ["DailyForecast", ["dt", "tempMax", "tempMin", "weatherId"]],
  ])("%s requires %p", (name, expected) => {
    // tempMax/tempMin rather than temp.max/temp.min: the JS side flattens the
    // OpenWeather shape here, and that flattening is invisible to TypeScript.
    expect(swiftStruct(name as string).required.sort()).toEqual(expected);
  });
});

describe("localized chrome", () => {
  const { required } = swiftStruct("WidgetChrome");

  it("requires every string Swift renders, so a partial chrome object blanks the widget", () => {
    expect(required.sort()).toEqual([
      "ageDays",
      "ageHours",
      "ageMinutes",
      "hi",
      "lo",
      "today",
    ]);
  });

  it("keeps the %{count} placeholder that Swift substitutes by hand", () => {
    // Swift does a literal replacingOccurrences(of: "%{count}"). A translation
    // edit that drops the placeholder produces "m ago" with no number, and the
    // key-parity test would not notice because the key still exists.
    expect(SWIFT).toContain("%{count}");

    const en = require("../../../localization/en").default ?? require("../../../localization/en");
    const table = (en.en ?? en) as Record<string, string>;
    for (const key of ["WidgetAgeMinutes", "WidgetAgeHours", "WidgetAgeDays"]) {
      expect(table[key]).toContain("%{count}");
    }
  });
});
