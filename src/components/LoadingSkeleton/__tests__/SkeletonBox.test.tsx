/**
 * Worker J — skeleton primitive + composition.
 *  - SkeletonBox is the single placeholder primitive; it carries the shared
 *    palette-derived tint and merges caller-supplied size/shape overrides.
 *  - The detailed skeletons (Hourly/Daily) compose SkeletonBox and render.
 *
 * Subtitle (pulls in the language store) and i18n (ESM i18n-js jest-expo does not
 * transform) are mocked so the render is isolated to the skeleton tree.
 */
import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { SkeletonBox } from "../SkeletonBox";
import { palette } from "../../../styles/Palette";

jest.mock("../../Subtitle/Subtitle", () => {
  const ReactLib = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ text }: { text: string }) =>
      ReactLib.createElement(Text, null, text),
  };
});

jest.mock("../../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

import DailyForecastSkeleton from "../../DailyForecast/DailyForecastSkeleton";
import HourlyForecastSkeleton from "../../HourlyForecast/HourlyForecastSkeleton";

describe("SkeletonBox", () => {
  it("renders without crashing", () => {
    expect(() => render(<SkeletonBox />)).not.toThrow();
    expect(render(<SkeletonBox />).toJSON()).toBeTruthy();
  });

  it("applies the palette-derived tint and merges style overrides", () => {
    const tree = render(
      <SkeletonBox style={{ height: 40, width: 40 }} />
    ).toJSON();
    const node = Array.isArray(tree) ? tree[0] : tree;
    const flat = StyleSheet.flatten(
      (node as { props: { style: object } }).props.style
    ) as {
      backgroundColor?: string;
      opacity?: number;
      height?: number;
      width?: number;
    };
    expect(flat.backgroundColor).toBe(palette.textColor);
    expect(flat.opacity).toBe(0.15);
    expect(flat.height).toBe(40);
    expect(flat.width).toBe(40);
  });
});

describe("detailed skeletons compose SkeletonBox", () => {
  it("renders the daily skeleton with its section title", () => {
    expect(() => render(<DailyForecastSkeleton />)).not.toThrow();
    expect(screen.getByText("DailyTitle")).toBeTruthy();
  });

  it("renders the hourly skeleton with its section title", () => {
    expect(() => render(<HourlyForecastSkeleton />)).not.toThrow();
    expect(screen.getByText("HourlyTitle")).toBeTruthy();
  });
});
