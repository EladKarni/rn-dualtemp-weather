/**
 * acquireAndStoreGPSPosition serializes concurrent acquisitions.
 *
 * updateGPSLocation reads the store with get() and *prepends* when it finds no
 * existing GPS entry, so two acquisitions that both observe the empty state
 * write two entries sharing the gps-location id. The realistic trigger is
 * startup on Android: dismissing the OS permission dialog fires an AppState
 * 'active' transition, so the foreground re-check (Effect 3) can begin while
 * the startup fetch (Effect 1) is still in flight.
 */
import { acquireAndStoreGPSPosition } from "../useGPSLocation";

// jest.mock factories are hoisted above these declarations, so anything they
// close over has to carry the `mock` prefix.
const mockGetCurrentPositionAsync = jest.fn();
const mockGetLastKnownPositionAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();
const mockUpdateGPSLocation = jest.fn();

jest.mock("expo-location", () => ({
  getCurrentPositionAsync: (...args: unknown[]) =>
    mockGetCurrentPositionAsync(...args),
  getLastKnownPositionAsync: (...args: unknown[]) =>
    mockGetLastKnownPositionAsync(...args),
  reverseGeocodeAsync: (...args: unknown[]) => mockReverseGeocodeAsync(...args),
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock("../../store/useLocationStore", () => ({
  GPS_LOCATION_ID: "gps-location",
  useLocationStore: {
    // No GPS entry yet — the exact state both racers would observe.
    getState: () => ({
      savedLocations: [],
      updateGPSLocation: mockUpdateGPSLocation,
    }),
    persist: {
      hasHydrated: () => true,
      onFinishHydration: () => () => {},
    },
  },
}));

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

const position = {
  coords: { latitude: 32.08, longitude: 34.78 },
} as const;

describe("acquireAndStoreGPSPosition — concurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReverseGeocodeAsync.mockResolvedValue([{ city: "Tel Aviv" }]);
  });

  it("joins a concurrent caller to the in-flight attempt instead of duplicating the write", async () => {
    // Hold the position fetch open so both callers overlap for certain.
    let release: (value: typeof position) => void = () => {};
    mockGetCurrentPositionAsync.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );

    const first = acquireAndStoreGPSPosition();
    const second = acquireAndStoreGPSPosition();

    release(position);
    const [a, b] = await Promise.all([first, second]);

    expect(a).toEqual({ status: "stored" });
    expect(b).toEqual({ status: "stored" });
    // The whole point: one fetch, one store write — not two of each.
    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(1);
    expect(mockUpdateGPSLocation).toHaveBeenCalledTimes(1);
  });

  it("releases the lock so a later attempt runs fresh", async () => {
    mockGetCurrentPositionAsync.mockResolvedValue(position);

    await acquireAndStoreGPSPosition();
    await acquireAndStoreGPSPosition();

    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(2);
    expect(mockUpdateGPSLocation).toHaveBeenCalledTimes(2);
  });

  it("releases the lock after a failed attempt", async () => {
    mockGetCurrentPositionAsync.mockRejectedValueOnce(
      Object.assign(new Error("no fix"), { code: "E_LOCATION_UNAVAILABLE" })
    );
    mockGetLastKnownPositionAsync.mockResolvedValueOnce(null);

    const failed = await acquireAndStoreGPSPosition();
    expect(failed.status).toBe("failed");

    mockGetCurrentPositionAsync.mockResolvedValueOnce(position);
    const recovered = await acquireAndStoreGPSPosition();
    expect(recovered).toEqual({ status: "stored" });
  });
});
