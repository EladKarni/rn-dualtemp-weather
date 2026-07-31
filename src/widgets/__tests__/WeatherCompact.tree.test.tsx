/**
 * Structural tests for the 1x1 compact widget.
 *
 * Built through the library's own `buildWidgetTree`, including its
 * `processChildren` pass, so these see what Android will actually lay out
 * rather than what the JSX says. That distinction is not academic here: this
 * renderer has three ways to fail that no JSX-level test can see, and the other
 * two widgets already carry tests for them while this one had none — it was
 * stubbed to the string 'WeatherCompact' in every suite that touched it.
 *
 *  - A React Fragment throws "Symbol(react.fragment) is not a function",
 *    because every element type is called as a function.
 *  - `justifyContent: "space-*"` injects invisible weighted children between
 *    every pair of siblings, quietly starving anything that shares the axis.
 *  - A numeric `fontWeight` is unportable below API 28 and can kill the whole
 *    render, since the native parseInt has no try/catch.
 *
 * Any of those turns the widget into an error card on someone's home screen.
 */
import React from "react";
import { WeatherCompact } from "../WeatherCompact";
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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../utils/widgetTheme", () => ({
  getWidgetElementColor: () => "rgba(28, 27, 77, 1)",
}));

const weather = {
  current: {
    dt: 1_753_900_000,
    temp: 22,
    feels_like: 22,
    humidity: 40,
    uvi: 9,
    wind_speed: 3,
    weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  },
  hourly: [],
  daily: [
    {
      dt: 1_753_900_000,
      temp: { min: 15, max: 32, day: 32, night: 15, eve: 30, morn: 16 },
      weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
      uvi: 9,
      pop: 0,
      humidity: 40,
      wind_speed: 3,
    },
  ],
} as unknown as Weather;

const build = (dataAge?: number): TreeNode =>
  buildWidgetTree(
    <WeatherCompact
      weather={weather}
      lastUpdated={new Date(1_753_900_000_000)}
      locationName="Testville"
      dataAge={dataAge}
    />
  );

const nodesIn = (node: TreeNode): TreeNode[] => [
  node,
  ...(node.children ?? []).flatMap(nodesIn),
];

const textsIn = (node: TreeNode): string[] =>
  nodesIn(node)
    .filter((n) => n.type === "TextWidget")
    .map((n) => n.props.text);

describe("WeatherCompact renders at all", () => {
  it("builds a tree without throwing", () => {
    // The Fragment crash and the fontWeight parse failure both surface here,
    // as a thrown error rather than a wrong-looking widget.
    expect(() => build()).not.toThrow();
  });

  it("shows both temperature scales, which is the entire point of the app", () => {
    const texts = textsIn(build());
    expect(texts).toEqual(expect.arrayContaining(["22°C", "72°F"]));
  });

  it("puts the user's preferred scale first", () => {
    const texts = textsIn(build()).filter((t) => /°[CF]$/.test(t));
    expect(texts[0]).toMatch(/°C$/);
  });
});

describe("layout hazards specific to this renderer", () => {
  it("uses no space-* justifyContent anywhere", () => {
    // These inject invisible weighted children between every pair of siblings.
    // In a 1x1 widget there is no spare room to give away, so anything sharing
    // an axis with a phantom gets squeezed until its text wraps or clips.
    const injected = nodesIn(build()).filter(
      (n) => n.type === "LinearLayoutWidget" && !n.children?.length && n.props.weight
    );
    expect(injected).toEqual([]);
  });

  it("uses no numeric fontWeight", () => {
    // Below API 28 (minSdk here is 24) the native side collapses every weight
    // >= 500 onto Typeface.BOLD, and above it resolves against the device's own
    // font. Worse, its Integer.parseInt has no try/catch, so a value the font
    // cannot supply takes down the entire render.
    const weights = nodesIn(build())
      .map((n) => n.props.fontWeight)
      .filter(Boolean);
    for (const weight of weights) {
      expect(["normal", "bold"]).toContain(weight);
    }
  });

  it("draws its own background, since the widget surface is transparent", () => {
    // The root surface is deliberately transparent so widgets sit on the
    // wallpaper. Anything that does not carry its own fill renders text
    // straight onto whatever photo the user has set.
    const filled = nodesIn(build()).filter((n) => n.props.backgroundColor);
    expect(filled.length).toBeGreaterThan(0);
  });
});

describe("stale data", () => {
  it("stays silent while the data is fresh", () => {
    // formatDataAge returns null under 30 minutes.
    expect(textsIn(build(5)).join(" ")).not.toMatch(/WidgetAge/);
  });

  it("marks the reading once it is old enough to mislead", () => {
    expect(textsIn(build(180)).join(" ")).toMatch(/WidgetAge/);
  });
});
