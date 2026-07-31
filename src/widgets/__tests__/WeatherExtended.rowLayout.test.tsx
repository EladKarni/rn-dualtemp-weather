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
  // Eight days so the row-count assertions are bounded by the height budget
  // rather than by the fixture. Only the first three carry distinctive values;
  // the rest exist to be counted.
  daily: [
    day(1_753_900_000, 15, 32),
    day(1_753_986_400, 15, 30),
    day(1_754_072_800, 19, 33),
    day(1_754_159_200, 16, 31),
    day(1_754_245_600, 16, 31),
    day(1_754_332_000, 16, 31),
    day(1_754_418_400, 16, 31),
    day(1_754_504_800, 16, 31),
  ],
} as unknown as Weather;

const build = (widthDp: number, heightDp = 204, dataAge?: number): TreeNode =>
  buildWidgetTree(
    <WeatherExtended
      weather={weather}
      lastUpdated={new Date(1_753_900_000_000)}
      locationName="Testville"
      width={widthDp}
      height={heightDp}
      dataAge={dataAge}
    />
  );

/** The vertical list of day rows (expanded mode only). */
const buildList = (widthDp: number, heightDp = 204, dataAge?: number): TreeNode => {
  const list = build(widthDp, heightDp, dataAge).children?.[0];
  if (!list) {
    throw new Error("expected a daily list in the built tree");
  }
  return list;
};

/** The first day row. Injected spacers go BETWEEN children, so [0] is real. */
const buildRow = (widthDp: number, heightDp = 204): TreeNode => {
  const row = buildList(widthDp, heightDp).children?.[0];
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

/** Every TextWidget node in a subtree, in render order. */
const textNodesIn = (node: TreeNode): TreeNode[] =>
  node.type === "TextWidget"
    ? [node]
    : (node.children ?? []).flatMap(textNodesIn);

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
    // 15/32 averages to 23.5C -> 24C / 74F. A high/low pair would be four
    // numbers competing for a two-cell row.
    expect(textsIn(buildRow(179))).toEqual(["Today", "\u2600\ufe0f", "24\u00b0C", "74\u00b0F"]);
  });

  it("adds the Hi/Lo labels before it adds UV", () => {
    // UV is the only element the row can lose without losing meaning, so it is
    // added last: at 276dp the labels are in and UV is not.
    const labelled = textsIn(buildRow(276));
    expect(labelled).toEqual([
      "Today",
      "\u2600\ufe0f",
      "WidgetHi ",
      "32\u00b0C",
      "90\u00b0F",
      "WidgetLo ",
      "15\u00b0C",
      "59\u00b0F",
    ]);
    expect(labelled.join(" ")).not.toContain("WidgetUV");

    expect(textsIn(buildRow(373))).toEqual([
      "Today",
      "\u2600\ufe0f",
      "WidgetUV 9",
      "WidgetHi ",
      "32\u00b0C",
      "90\u00b0F",
      "WidgetLo ",
      "15\u00b0C",
      "59\u00b0F",
    ]);
  });

  it("stacks each reading as two separately styled lines, preferred scale on top and bolder", () => {
    // Not one TextWidget with a newline in it: a single TextWidget can carry
    // only one font weight, and maxLines={1} would delete the second scale
    // outright while every existing assertion kept passing.
    const reading = buildRow(276).children?.[2]?.children?.[1];
    expect(reading?.type).toBe("LinearLayoutWidget");
    expect(reading?.props.orientation).toBe("VERTICAL");

    const lines = reading?.children ?? [];
    expect(lines).toHaveLength(2);
    expect(lines[0].props).toMatchObject({ text: "32\u00b0C", fontWeight: "bold" });
    expect(lines[1].props.text).toBe("90\u00b0F");
    expect(lines[1].props.fontWeight).toBeUndefined();
  });

  it("never puts a newline inside a single TextWidget", () => {
    // The renderer would honour it, but maxLines={1} then silently drops
    // everything after the break.
    for (const width of [179, 240, 276, 373]) {
      for (const node of textNodesIn(buildRow(width))) {
        expect(node.props.text).not.toContain("\n");
      }
    }
  });

  it("caps every temperature line so a tight column clips instead of wrapping", () => {
    // A wrapped line breaks the row's shared baseline and makes every column
    // look ragged; the thresholds are sized so this guard should never fire.
    // Asserted per line rather than "at least one", because a cap that reaches
    // only the first scale is the exact bug this is here to catch.
    for (const width of [179, 240, 276, 373]) {
      const capped = textNodesIn(buildRow(width)).filter((n) =>
        /\u00b0[CF]$/.test(n.props.text)
      );
      expect(capped.length).toBeGreaterThan(0);
      for (const line of capped) {
        expect(line.props.maxLines).toBe(1);
      }
    }
  });
});

describe("daily list vertical budget", () => {
  // The widget root is measured EXACTLY and drawn into a bitmap: too many rows
  // does not overflow or scroll, it silently shrinks and clips them. These pin
  // the row count that calculateDailyItemCount hands out at real widget heights.
  it.each<[number, number]>([
    [204, 3],
    [388, 6],
    [470, 7],
  ])("fits %ddp with %d rows", (heightDp, expectedRows) => {
    const rows = (buildList(276, heightDp).children ?? []).filter(
      (child) => (child.children?.length ?? 0) > 0
    );
    expect(rows).toHaveLength(expectedRows);
  });

  it("gives every row room for two stacked lines plus the injected spacers", () => {
    // 50dp per row (two 13dp lines + 8dp padding top and bottom) and 12dp per
    // visible gap (6dp flexGap x the two dividers that straddle each phantom
    // spacer). If this fails the rows are over-subscribed and will be clipped.
    const ROW = 50;
    const GAP = 12;
    for (const [heightDp, rows] of [[204, 3], [388, 6], [470, 7]] as const) {
      const available = heightDp - 24; // root padding, top and bottom
      expect(rows * ROW + (rows - 1) * GAP).toBeLessThanOrEqual(available);
    }
  });

  it("surrenders a row rather than clipping when the stale-data indicator shows", () => {
    // formatDataAge returns null under 30 minutes, so fresh data pays nothing.
    // 210dp fits 3 rows; minus the 16dp indicator it fits 2.
    const fresh = buildList(276, 210).children ?? [];
    const stale = buildList(276, 210, 90).children ?? [];
    const count = (children: TreeNode[]) =>
      children.filter((c) => (c.children?.length ?? 0) > 0).length;
    expect(count(fresh)).toBe(3);
    expect(count(stale)).toBe(2);
  });

  it("falls back to a single inline reading at the declared minimum height", () => {
    // app.json declares minHeight 40dp. The compact row has no vertical padding
    // inside a root that has 8dp, so its content box is 24dp — one line of 13dp
    // type fits there and a two-line stack does not.
    const compact = build(276, 40).children?.[0];
    expect(compact?.props.orientation).toBe("HORIZONTAL");
    const texts = textsIn(compact as TreeNode);
    expect(texts).toContain("32\u00b0/90\u00b0");
    expect(texts.join(" ")).not.toContain("\u00b0C");
  });
});
