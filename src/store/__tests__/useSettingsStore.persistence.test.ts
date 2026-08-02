/**
 * What survives an app restart, and what the widget sees.
 *
 * `partialize` is an ALLOW-LIST: a field absent from it is written to disk as
 * undefined, so the setting silently resets on every cold start. That is not a
 * hypothetical — the widget reads this store in a headless context where the
 * persisted copy is the only copy, so a forgotten entry means the app shows the
 * user's choice and the widget shows the default, forever, with no error
 * anywhere. This suite exists so adding a setting and forgetting the allow-list
 * fails here instead of in someone's launcher.
 */
import { useSettingsStore } from "../useSettingsStore";
import { DEFAULT_WIDGET_THEME } from "../../styles/widgetThemes";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-localization", () => ({
  getCalendars: () => [{ uses24hourClock: false }],
}));

/** The persist options the store was created with. */
const persistOptions = (useSettingsStore.persist as any).getOptions();

/**
 * State that is deliberately NOT persisted, and why. Anything else missing from
 * `partialize` is a bug, so a new field has to be classified consciously — this
 * list is the place to record the decision, not to silence the test.
 */
const DELIBERATELY_NOT_PERSISTED = [
  // Describes THIS process, not the user. Persisting it would make a cold start
  // read `isHydrated: true` off disk before hydration had actually happened,
  // which is precisely the lie every consumer of it is guarding against.
  "isHydrated",
];

describe("partialize allow-list", () => {
  it("persists every user-facing setting the store exposes", () => {
    // Derived from the live state rather than a hardcoded list, so a new
    // setting is caught the moment it is added — which is the only moment
    // anyone is in a position to fix it cheaply.
    const state = useSettingsStore.getState() as unknown as Record<string, unknown>;
    const settings = Object.keys(state).filter(
      (key) =>
        typeof state[key] !== "function" &&
        !DELIBERATELY_NOT_PERSISTED.includes(key)
    );

    const persisted = Object.keys(persistOptions.partialize(state));

    const dropped = settings.filter((key) => !persisted.includes(key));
    expect(dropped).toEqual([]);
  });

  it("round-trips a changed value rather than writing undefined", () => {
    useSettingsStore.getState().setWidgetTheme("midnight");
    const persisted = persistOptions.partialize(
      useSettingsStore.getState() as unknown as Record<string, unknown>
    );
    expect(persisted.widgetTheme).toBe("midnight");
  });
});

describe("merge tolerates whatever is actually on disk", () => {
  // A store that throws during rehydration takes the widget's headless task
  // down with it, and the user sees the error widget rather than a stale one.
  const merged = (persisted: unknown) =>
    persistOptions.merge(persisted, useSettingsStore.getInitialState());

  it.each([
    ["nothing persisted yet (fresh install)", undefined],
    ["null", null],
    ["an empty object", {}],
    ["a value of the wrong type", { widgetTheme: 42 }],
    ["an unknown theme id from a newer build", { widgetTheme: "solarized" }],
    ["junk fields from an older build", { legacyThing: true }],
  ])("falls back to the default theme given %s", (_label, persisted) => {
    expect(() => merged(persisted)).not.toThrow();
    expect(merged(persisted).widgetTheme).toBe(DEFAULT_WIDGET_THEME);
  });

  it("keeps a valid persisted theme", () => {
    expect(merged({ widgetTheme: "midnight" }).widgetTheme).toBe("midnight");
  });
});
