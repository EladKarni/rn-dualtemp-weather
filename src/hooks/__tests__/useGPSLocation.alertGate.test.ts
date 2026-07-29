/**
 * GPS-alert interruption gate (plans/fix-footer-timestamp-and-alert-interrupt.md
 * Bug 2): a GPS failure is only worth an app-modal alert when the user has no
 * manual city to fall back on AND is not already inside the Add Location modal
 * (the alert's own recovery surface — observed on-device swallowing taps).
 */
import { shouldInterruptWithGpsAlert } from "../useGPSLocation";
import type { SavedLocation } from "../../store/useLocationStore";
import type { ModalType } from "../../store/useModalStore";

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

describe("shouldInterruptWithGpsAlert — six-case contract matrix", () => {
  const cases: {
    name: string;
    locations: SavedLocation[];
    modal: ModalType;
    expected: boolean;
  }[] = [
    {
      name: "no cities, no modal -> alert (GPS is the only source and it broke)",
      locations: [],
      modal: null,
      expected: true,
    },
    {
      name: "no cities, addLocation open -> NO alert (user is already recovering)",
      locations: [],
      modal: "addLocation",
      expected: false,
    },
    {
      name: "no cities, settings open -> alert (Open Settings action is meaningful)",
      locations: [],
      modal: "settings",
      expected: true,
    },
    {
      name: "has a city, no modal -> no alert (manual fallback exists)",
      locations: [gps(), city()],
      modal: null,
      expected: false,
    },
    {
      name: "has a city, addLocation open -> no alert",
      locations: [city()],
      modal: "addLocation",
      expected: false,
    },
    {
      name: "has a city, settings open -> no alert (manual fallback exists)",
      locations: [city()],
      modal: "settings",
      expected: false,
    },
    {
      name: "GPS-only entry counts as no manual city -> alert",
      locations: [gps()],
      modal: null,
      expected: true,
    },
  ];

  it.each(cases)("$name", ({ locations, modal, expected }) => {
    expect(shouldInterruptWithGpsAlert(locations, modal)).toBe(expected);
  });
});
