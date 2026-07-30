/**
 * Foreground GPS-recovery gate.
 *
 * The bug this guards: the OS permission request runs exactly once per process
 * (Effect 1), so a user who declined at first launch and later granted access
 * in system Settings came back to an app that never looked again — and had no
 * in-app route to a current location, because the "Enable Location" alert
 * button is web-only and the alert itself is suppressed once any city is saved.
 * Effect 3 re-checks on foreground; this is its decision function.
 */
import { shouldRecoverGpsOnForeground } from "../useGPSLocation";
import type { SavedLocation } from "../../store/useLocationStore";

// The hook's module graph pulls in expo-location, the alert layer, and the
// persisted stores — none of which the pure gate under test touches.
jest.mock("expo-location", () => ({}));
jest.mock("../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));
jest.mock("../../components/ErrorAlert/ErrorAlert", () => ({
  showErrorAlert: jest.fn(),
  openDeviceSettings: jest.fn(),
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../../utils/logger", () => ({
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

const gps = (): SavedLocation => ({
  id: "gps-location",
  name: "Here",
  latitude: 32.08,
  longitude: 34.78,
  addedAt: 1,
  isGPS: true,
});

const city = (): SavedLocation => ({
  id: "city-1",
  name: "Paris",
  latitude: 48.85,
  longitude: 2.35,
  addedAt: 1,
  isGPS: false,
});

describe("shouldRecoverGpsOnForeground", () => {
  const cases: {
    name: string;
    status: string;
    locations: SavedLocation[];
    expected: boolean;
  }[] = [
    {
      name: "granted + no locations -> acquire (declined at launch, granted in Settings)",
      status: "granted",
      locations: [],
      expected: true,
    },
    {
      name: "granted + manual city only -> acquire (THE reported bug: no GPS entry exists)",
      status: "granted",
      locations: [city()],
      expected: true,
    },
    {
      name: "granted + GPS entry already exists -> skip (Effect 1 owns freshness)",
      status: "granted",
      locations: [gps()],
      expected: false,
    },
    {
      name: "granted + GPS entry alongside a city -> skip",
      status: "granted",
      locations: [gps(), city()],
      expected: false,
    },
    {
      name: "denied + no locations -> skip (nothing changed outside the app)",
      status: "denied",
      locations: [],
      expected: false,
    },
    {
      name: "denied + manual city -> skip (must never nag on every foreground)",
      status: "denied",
      locations: [city()],
      expected: false,
    },
    {
      name: "undetermined -> skip (only an explicit grant triggers acquisition)",
      status: "undetermined",
      locations: [city()],
      expected: false,
    },
  ];

  it.each(cases)("$name", ({ status, locations, expected }) => {
    expect(shouldRecoverGpsOnForeground(status, locations)).toBe(expected);
  });
});
