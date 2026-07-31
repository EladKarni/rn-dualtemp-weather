/**
 * The hourly column's dual-scale reading.
 *
 * This column previously let the reading wrap onto a second line by itself.
 * The two-line shape was wanted; the accident was not, because a wrapped
 * TextWidget can carry only one font weight and no per-line unit letter. It is
 * now an explicit stack, and these tests pin the three things that a future
 * "simplification" back to one TextWidget would silently undo.
 */
import React from "react";
import { WeatherStandard } from "../WeatherStandard";
import type { Weather } from "../../types/WeatherTypes";

interface TreeNode {
  type: string;
  props: Record<string, any>;
  children?: TreeNode[];
}

const { buildWidgetTree } = require("react-native-android-widget/lib/commonjs/api/build-widget-tree") as {
  buildWidgetTree: (jsxTree: React.JSX.Element) => TreeNode;
};

jest.mock("../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { i18n } = require("../../localization/i18n");

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../utils/widgetTheme", () => ({
  getWidgetElementColor: () => "rgba(28, 27, 77, 1)",
}));

const hour = (dt: number, temp: number) => ({
  dt,
  temp,
  feels_like: temp,
  humidity: 40,
  uvi: 9,
  wind_speed: 3,
  pop: 0.02,
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
});

const weather = {
  current: hour(1_753_900_000, 25),
  hourly: [
    hour(1_753_903_600, 23),
    hour(1_753_907_200, 22),
    hour(1_753_910_800, 21),
    hour(1_753_914_400, 20),
  ],
  daily: [],
} as unknown as Weather;

const textNodesIn = (node: TreeNode): TreeNode[] =>
  node.type === "TextWidget"
    ? [node]
    : (node.children ?? []).flatMap(textNodesIn);

/**
 * The temperature stack in the first hourly column.
 *
 * Found by shape rather than by index: the column uses
 * `justifyContent: "space-evenly"`, which makes the library inject invisible
 * weighted children before, between and after every real one — so the stack is
 * neither the first nor the last child, and any index would break the moment a
 * metric is added to the column.
 */
const buildReading = (): TreeNode => {
  const tree = buildWidgetTree(
    <WeatherStandard
      weather={weather}
      lastUpdated={new Date(1_753_900_000_000)}
      locationName="Testville"
      width={373}
      height={180}
    />
  );

  const findStack = (node: TreeNode): TreeNode | undefined => {
    const children = node.children ?? [];
    if (children.length === 2 && children.every((c) => c.type === "TextWidget")) {
      return node;
    }
    for (const child of children) {
      const hit = findStack(child);
      if (hit) return hit;
    }
    return undefined;
  };

  const reading = findStack(tree);
  if (!reading) {
    throw new Error("expected a two-line temperature stack in the built tree");
  }
  return reading;
};

describe("hourly reading", () => {
  it("is a vertical stack of two lines, not one wrapping TextWidget", () => {
    const reading = buildReading();
    expect(reading.type).toBe("LinearLayoutWidget");
    expect(reading.props.orientation).toBe("VERTICAL");
    expect(reading.children).toHaveLength(2);
  });

  it("puts the preferred scale on top, bolder, and letters both lines", () => {
    const [top, bottom] = buildReading().children ?? [];
    expect(top.props).toMatchObject({ text: "23°C", fontWeight: "bold" });
    expect(bottom.props.text).toBe("73°F");
    // The second line must stay unweighted — the contrast between the two IS
    // the signal for which scale the user picked.
    expect(bottom.props.fontWeight).toBeUndefined();
  });

  it("caps each line so a narrow column clips rather than re-wrapping", () => {
    for (const line of textNodesIn(buildReading())) {
      expect(line.props.maxLines).toBe(1);
      expect(line.props.text).not.toContain("\n");
    }
  });
});

describe("hourly column order follows the reading direction", () => {
  afterEach(() => {
    i18n.locale = "en";
  });

  /** Hour labels across the row, left to right as rendered. */
  const hours = (): string[] => {
    const tree = buildWidgetTree(
      <WeatherStandard
        weather={weather}
        lastUpdated={new Date(1_753_900_000_000)}
        locationName="Testville"
        width={373}
        height={180}
      />
    );
    return textNodesIn(tree)
      .map((n) => n.props.text)
      .filter((t: string) => /^\d{1,2}:\d{2}/.test(t));
  };

  it("runs earliest-first in English", () => {
    const ltr = hours();
    expect(ltr.length).toBeGreaterThan(1);
    expect(ltr).toEqual([...ltr]);
  });

  it("runs earliest-LAST in Hebrew, so time still flows towards the reader", () => {
    const ltr = hours();
    i18n.locale = "he";
    expect(hours()).toEqual([...ltr].reverse());
  });
});
