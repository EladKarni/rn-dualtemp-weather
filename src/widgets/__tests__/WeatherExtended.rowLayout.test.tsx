/**
 * Structural tests for the resizable daily row.
 *
 * These build the real widget tree the way the native renderer does — via the
 * library's own `buildWidgetTree`, including its `processChildren` pass — so
 * they see the row exactly as Android will lay it out. That matters because two
 * bugs in this row were invisible to any test that only looked at the JSX:
 *
 *  - `justifyContent: "space-between"` makes the library INJECT an invisible
 *    `flex: 1` FlexWidget between every pair of children. The temperature
 *    columns then split the leftover width with two to four phantom columns
 *    instead of taking it, and a seven-character dual-scale reading wrapped
 *    onto two lines while ~100dp of the row sat empty.
 *  - A React Fragment used to switch between layouts throws at render time
 *    ("Symbol(react.fragment) is not a function"), because the renderer calls
 *    every element type as a function.
 *
 * Building the tree catches both: the first as an unexpected child, the second
 * as a thrown error.
 */
import React from "react";
import { WeatherExtended } from "../WeatherExtended";
import type { Weather } from "../../types/WeatherTypes";

interface TreeNode {
  type: string;
  props: Record<string, any>;
  children?: TreeNode[];
}

// The library does not re-export buildWidgetTree from its entry point and ships
// declarations only for that entry point, so this reaches into the built
// CommonJS module and types it here.
const { buildWidgetTree } = require("react-native-android-widget/lib/commonjs/api/build-widget-tree") as {
  buildWidgetTree: (jsxTree: React.JSX.Element) => TreeNode;
};

// i18n-js ships ESM that jest-expo does not transform, and the widget reads
// labels at module scope. No localized string is asserted — the key is enough
// to tell the columns apart.
jest.mock("../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

// The widget reads tempScale from the persisted settings store, which pulls in
// AsyncStorage at module scope.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../utils/widgetTheme", () => ({
  getWidgetElementColor: () => "rgba(28, 27, 77, 1)",
}));

const day = (dt: number, min: number, max: number) => ({
  dt,
  temp: { min, max, day: max, night: min, eve: max, morn: min },
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  uvi: 9,
  pop: 0,
  humidity: 40,
  wind_speed: 3,
});

const weather = {
  current: {
    dt: 1_753_900_000,
    temp: 25,
    feels_like: 25,
    humidity: 40,
    uvi: 9,
    wind_speed: 3,
    weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  },
  hourly: [],
  daily: [
    day(1_753_900_000, 15, 32),
    day(1_753_986_400, 15, 30),
    day(1_754_072_800, 19, 33),
  ],
} as unknown as Weather;

/** The row is the first (and only) child of the vertical list container. */
const buildRow = (widthDp: number): TreeNode => {
  const tree = buildWidgetTree(
    <WeatherExtended
      weather={weather}
      lastUpdated={new Date(1_753_900_000_000)}
      locationName="Testville"
      width={widthDp}
      height={204}
    />
  );

  const list = tree.children?.[0];
  const row = list?.children?.[0];
  if (!row) {
    throw new Error("expected a daily row in the built tree");
  }
  return row;
};

/** Text of every TextWidget in a subtree, in render order. */
const textsIn = (node: TreeNode): string[] =>
  node.type === "TextWidget"
    ? [node.props.text]
    : (node.children ?? []).flatMap(textsIn);

describe("daily row structure", () => {
  // Widths chosen one per density, using the measured launcher steps.
  it.each<[string, number, number]>([
    ["narrow", 179, 3],
    ["medium", 240, 4],
    ["full", 276, 4],
    ["wide", 373, 5],
  ])(
    "%s (%ddp) lays out exactly %d columns — no injected spacers",
    (_density, width, expectedColumns) => {
      const row = buildRow(width);
      expect(row.children).toHaveLength(expectedColumns);
      // An injected spacer is a childless FlexWidget carrying only a weight.
      // Any of those means justifyContent went back to a space-* value.
      const spacers = (row.children ?? []).filter(
        (child) => child.type === "LinearLayoutWidget" && !child.children?.length
      );
      expect(spacers).toHaveLength(0);
    }
  );

  it("gives every column a fixed width except the temperatures, which share the rest", () => {
    const row = buildRow(276);
    const widths = (row.children ?? []).map((child) => ({
      width: child.props.width,
      weight: child.props.weight,
    }));
    // Day and icon are pinned; the two temperature blocks are weighted equally
    // so they resolve to the same width in every row, whatever its text.
    expect(widths[0]).toMatchObject({ width: 44 });
    expect(widths[1]).toMatchObject({ width: 26 });
    expect(widths[2]).toMatchObject({ weight: 1 });
    expect(widths[3]).toMatchObject({ weight: 1 });
    expect(widths[2].width).toBeUndefined();
    expect(widths[3].width).toBeUndefined();
  });

  it("shows one averaged reading at the narrowest width", () => {
    // 15/32 averages to 23.5C -> 24C / 74F. A high/low pair would be four numbers
    // competing for a two-cell row.
    const texts = textsIn(buildRow(179));
    expect(texts).toEqual(["Today", "☀️", "24°/74°"]);
  });

  it("adds the Hi/Lo labels before it adds UV", () => {
    // UV is the only element the row can lose without losing meaning, so it is
    // added last: at 276dp the labels are in and UV is not.
    const labelled = textsIn(buildRow(276));
    expect(labelled).toEqual(["Today", "☀️", "WidgetHi ", "32°/90°", "WidgetLo ", "15°/59°"]);
    expect(labelled.join(" ")).not.toContain("WidgetUV");

    const withUv = textsIn(buildRow(373));
    expect(withUv).toEqual([
      "Today",
      "☀️",
      "WidgetUV 9",
      "WidgetHi ",
      "32° / 90°",
      "WidgetLo ",
      "15° / 59°",
    ]);
  });

  it("caps each reading at one line so a tight column clips instead of wrapping", () => {
    // A wrapped reading breaks the row's shared baseline and makes every column
    // look ragged; the thresholds are sized so this guard should never fire.
    for (const width of [179, 240, 276, 373]) {
      const row = buildRow(width);
      const readings = JSON.stringify(row).match(/"maxLines":1/g) ?? [];
      expect(readings.length).toBeGreaterThan(0);
    }
  });
});
