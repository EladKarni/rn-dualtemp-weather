/**
 * Worker F — CardFooter regression (finding 11).
 *
 * The Phase-0 code fix moved the hooks above the `if (!isHydrated)` early return.
 * This test locks that in: render pre-hydration, flip `isHydrated` false -> true,
 * and assert the component neither crashes (violating the rules-of-hooks) nor
 * mis-renders. It also confirms the ISO-string consumption tolerates a legacy
 * non-string persisted value without throwing. Per the Phase-0 note, we assert
 * no-crash and eventual correctness — not the ~1s transient.
 */
import React from "react";
import { render, screen, act } from "@testing-library/react-native";
import CardFooter from "../CardFooter";
import { useSettingsStore } from "../../../store/useSettingsStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// expo-localization's native module isn't in the jest binary; useSettingsStore
// reads getCalendars()[0].uses24hourClock at module load.
jest.mock("expo-localization", () => ({
  getCalendars: () => [{ uses24hourClock: false }],
  getLocales: () => [{ languageCode: "en", languageTag: "en-US" }],
}));

// Stores transitively import logger -> @sentry/react-native, whose session
// timer keeps the jest worker alive. Mock it for clean teardown.
jest.mock("../../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    exception: jest.fn(),
    setTag: jest.fn(),
  },
}));

// i18n-js ships ESM that jest-expo does not transform; mock the localization
// module (as the widget suites do). `t` echoes the key so the label is stable.
jest.mock("../../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
  translations: { en: {}, he: {}, es: {}, ar: {}, fr: {}, zh: {} },
}));

describe("CardFooter — hydration flip", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    act(() => {
      useSettingsStore.setState({ isHydrated: false, lastUpdated: null });
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("renders a bare footer pre-hydration without crashing", () => {
    expect(() => render(<CardFooter />)).not.toThrow();
    expect(screen.queryByText("Updated")).toBeNull();
  });

  it("renders the updated label after isHydrated flips false -> true, no throw", () => {
    render(<CardFooter />);
    expect(screen.queryByText("Updated")).toBeNull();

    const iso = new Date().toISOString();
    act(() => {
      useSettingsStore.setState({ isHydrated: true, lastUpdated: iso });
    });

    // Post-hydration the label renders and the flip did not crash the component.
    expect(screen.getByText("Updated")).toBeTruthy();
  });

  it("tolerates a legacy non-string lastUpdated without throwing", () => {
    act(() => {
      useSettingsStore.setState({
        isHydrated: true,
        // @ts-expect-error — intentionally invalid legacy (pre-ISO) shape
        lastUpdated: { _isAMomentObject: true },
      });
    });
    expect(() => render(<CardFooter />)).not.toThrow();
    // Label still renders; the relative-time portion is simply empty.
    expect(screen.getByText("Updated")).toBeTruthy();
  });
});
