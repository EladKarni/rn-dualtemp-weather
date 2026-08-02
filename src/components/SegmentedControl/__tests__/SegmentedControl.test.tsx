/**
 * Worker J — SegmentedControl (extracted from the ClockFormat/TempUnit/Sunrise
 * trio). Covers selection + callback behavior:
 *  - renders every option label
 *  - pressing an option calls onChange with that option's value
 *  - onAfterChange runs after onChange (preserves TempUnitSelector's
 *    updateAllWeatherWidgets() side effect)
 *  - works with non-string value types (boolean, à la SunriseSunsetToggle)
 *
 * SegmentedControl is a pure presentational component (no store / i18n), so no
 * module mocks are needed.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl", () => {
  const stringOptions = [
    { value: "12hour", label: "12h" },
    { value: "24hour", label: "24h" },
    { value: "auto", label: "Auto" },
  ] as const;

  it("renders a label for every option", () => {
    render(
      <SegmentedControl
        value="12hour"
        options={stringOptions.map((o) => ({ ...o }))}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText("12h")).toBeTruthy();
    expect(screen.getByText("24h")).toBeTruthy();
    expect(screen.getByText("Auto")).toBeTruthy();
  });

  it("calls onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        value="12hour"
        options={stringOptions.map((o) => ({ ...o }))}
        onChange={onChange}
      />
    );

    fireEvent.press(screen.getByText("24h"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("24hour");
  });

  it("runs onAfterChange after onChange with the same value", () => {
    const calls: string[] = [];
    const onChange = jest.fn(() => calls.push("change"));
    const onAfterChange = jest.fn(() => {
      calls.push("after");
    });

    render(
      <SegmentedControl
        value="12hour"
        options={stringOptions.map((o) => ({ ...o }))}
        onChange={onChange}
        onAfterChange={onAfterChange}
      />
    );

    fireEvent.press(screen.getByText("Auto"));

    expect(onChange).toHaveBeenCalledWith("auto");
    expect(onAfterChange).toHaveBeenCalledWith("auto");
    // onChange fires before the (awaited) side effect.
    expect(calls).toEqual(["change", "after"]);
  });

  it("does not throw when onAfterChange is omitted", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        value="12hour"
        options={stringOptions.map((o) => ({ ...o }))}
        onChange={onChange}
      />
    );

    expect(() => fireEvent.press(screen.getByText("24h"))).not.toThrow();
    expect(onChange).toHaveBeenCalledWith("24hour");
  });

  it("supports boolean values (SunriseSunsetToggle shape)", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        value={true}
        options={[
          { value: true, label: "Show" },
          { value: false, label: "Hide" },
        ]}
        onChange={onChange}
      />
    );

    fireEvent.press(screen.getByText("Hide"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
