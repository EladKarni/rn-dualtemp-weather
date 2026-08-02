/**
 * `resolveWidgetLocation` fallback matrix (Phase 2 — widget location fallback).
 *
 * The app is GPS-optional: a user can decline location access and use manual
 * cities exclusively. The widget contract stays "widget = current location",
 * so the GPS entry wins whenever it exists; without one the widget follows the
 * active location, then the first saved location, and only a truly empty store
 * resolves to null (the "Weather data unavailable" fallback).
 *
 * Precedence under test: GPS entry ?? active location ?? first saved ?? null.
 */
import { resolveWidgetLocation } from "../widgetDataUtils";
import type { SavedLocation } from "../../../store/useLocationStore";

// widgetDataUtils imports i18n (for formatDataAge). i18n-js ships ESM that
// jest-expo does not transform, so mock the localization module (this test does
// not exercise any localized string). babel-plugin-jest-hoist lifts this above
// the import so widgetDataUtils resolves i18n to the mock.
jest.mock("../../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

const makeLocation = (
  overrides: Partial<SavedLocation> & Pick<SavedLocation, "id" | "name">
): SavedLocation => ({
  latitude: 0,
  longitude: 0,
  addedAt: 0,
  isGPS: false,
  ...overrides,
});

const gps = makeLocation({
  id: "gps-location",
  name: "Current Location",
  isGPS: true,
});
const paris = makeLocation({ id: "location-1", name: "Paris" });
const tokyo = makeLocation({ id: "location-2", name: "Tokyo" });

describe("resolveWidgetLocation — fallback matrix", () => {
  it("prefers the GPS entry even when a manual city is active (widget = current location)", () => {
    // GPS is not first in the array and not active — it must still win.
    expect(resolveWidgetLocation([paris, gps, tokyo], paris.id)).toBe(gps);
  });

  it("falls back to the active location when no GPS entry exists (manual-cities-only user)", () => {
    expect(resolveWidgetLocation([paris, tokyo], tokyo.id)).toBe(tokyo);
  });

  it("falls back to the first saved location when the active id resolves to nothing", () => {
    expect(resolveWidgetLocation([paris, tokyo], "location-deleted")).toBe(
      paris
    );
  });

  it("falls back to the first saved location when there is no active id", () => {
    expect(resolveWidgetLocation([paris, tokyo], null)).toBe(paris);
  });

  it("returns null when no locations are saved", () => {
    expect(resolveWidgetLocation([], null)).toBeNull();
    // Even a dangling active id over an empty store cannot resolve anything.
    expect(resolveWidgetLocation([], "gps-location")).toBeNull();
  });
});
