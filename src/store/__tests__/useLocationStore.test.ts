/**
 * Worker F — location-store edge cases.
 *
 *  - removeLocation fallback matrix: GPS-if-present -> first-remaining -> null.
 *  - addLocation throws typed UserErrors (duplicate / max) carrying the right
 *    userMessageKey instead of silently dropping the request.
 *  - addLocation self-heals a dangling activeLocationId.
 */
import { useLocationStore, GPS_LOCATION_ID } from "../useLocationStore";
import type { SavedLocation } from "../useLocationStore";
import {
  DuplicateLocationError,
  MaxLocationsError,
} from "../../utils/errors";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// The store imports logger -> @sentry/react-native, whose session timer keeps
// the jest worker alive. Mock it (as the other suites do) for clean teardown.
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
  id: GPS_LOCATION_ID,
  name: "Here",
  latitude: 32.08,
  longitude: 34.78,
  addedAt: 1,
  isGPS: true,
});

const loc = (
  id: string,
  latitude: number,
  longitude: number
): SavedLocation => ({
  id,
  name: id,
  latitude,
  longitude,
  addedAt: 1,
  isGPS: false,
});

const reset = (
  savedLocations: SavedLocation[],
  activeLocationId: string | null
) => useLocationStore.setState({ savedLocations, activeLocationId });

describe("removeLocation — active fallback matrix", () => {
  it("falls back to GPS when the GPS entry exists", () => {
    reset([gps(), loc("a", 40, -74)], "a");
    useLocationStore.getState().removeLocation("a");
    expect(useLocationStore.getState().activeLocationId).toBe(GPS_LOCATION_ID);
  });

  it("falls back to the first remaining location when GPS is absent", () => {
    reset([loc("a", 40, -74), loc("b", 51, 0)], "a");
    useLocationStore.getState().removeLocation("a");
    const state = useLocationStore.getState();
    expect(state.activeLocationId).toBe("b");
    expect(state.savedLocations.map((l) => l.id)).toEqual(["b"]);
  });

  it("falls back to null when removing the last (only) location", () => {
    reset([loc("a", 40, -74)], "a");
    useLocationStore.getState().removeLocation("a");
    const state = useLocationStore.getState();
    expect(state.activeLocationId).toBeNull();
    expect(state.savedLocations).toHaveLength(0);
  });

  it("leaves activeLocationId untouched when removing a non-active location", () => {
    reset([loc("a", 40, -74), loc("b", 51, 0)], "b");
    useLocationStore.getState().removeLocation("a");
    expect(useLocationStore.getState().activeLocationId).toBe("b");
  });

  it("refuses to remove the GPS location", () => {
    reset([gps(), loc("a", 40, -74)], "a");
    useLocationStore.getState().removeLocation(GPS_LOCATION_ID);
    expect(
      useLocationStore.getState().savedLocations.some((l) => l.isGPS)
    ).toBe(true);
  });
});

describe("addLocation — typed errors with userMessageKey", () => {
  it("throws DuplicateLocationError (userMessageKey 'DuplicateLocation') for a ~1km duplicate", () => {
    reset([loc("a", 40.0, -74.0)], "a");
    let caught: unknown;
    try {
      useLocationStore
        .getState()
        .addLocation({ name: "dup", latitude: 40.005, longitude: -74.005 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(DuplicateLocationError);
    expect((caught as DuplicateLocationError).userMessageKey).toBe(
      "DuplicateLocation"
    );
    // Nothing was added.
    expect(useLocationStore.getState().savedLocations).toHaveLength(1);
  });

  it("throws MaxLocationsError (userMessageKey 'MaxLocationsReached') at the cap", () => {
    const many: SavedLocation[] = Array.from({ length: 25 }, (_, i) =>
      loc(`l${i}`, i, i)
    );
    reset(many, "l0");
    let caught: unknown;
    try {
      useLocationStore
        .getState()
        .addLocation({ name: "over", latitude: 88, longitude: 88 });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(MaxLocationsError);
    expect((caught as MaxLocationsError).userMessageKey).toBe(
      "MaxLocationsReached"
    );
    expect(useLocationStore.getState().savedLocations).toHaveLength(25);
  });

  it("adds a distinct, non-duplicate location successfully", () => {
    reset([loc("a", 40, -74)], "a");
    useLocationStore
      .getState()
      .addLocation({ name: "far", latitude: 10, longitude: 10 });
    expect(useLocationStore.getState().savedLocations).toHaveLength(2);
  });
});

describe("addLocation — self-heals a dangling activeLocationId", () => {
  it("adopts the new location as active when the current active id resolves to nothing", () => {
    // active points at an id that no longer exists in savedLocations.
    reset([], "ghost-id");
    useLocationStore
      .getState()
      .addLocation({ name: "new", latitude: 12, longitude: 34 });

    const state = useLocationStore.getState();
    expect(state.savedLocations).toHaveLength(1);
    const added = state.savedLocations[0];
    expect(state.activeLocationId).toBe(added.id);
  });

  it("does NOT change active when the current active id still resolves", () => {
    reset([loc("a", 40, -74)], "a");
    useLocationStore
      .getState()
      .addLocation({ name: "new", latitude: 12, longitude: 34 });
    expect(useLocationStore.getState().activeLocationId).toBe("a");
  });
});

describe("removeGPSLocation — app-side GPS cleanup (GPS-optional flow)", () => {
  it("removes the GPS entry and falls back to the first manual location when GPS was active", () => {
    reset([gps(), loc("a", 40, -74)], GPS_LOCATION_ID);
    useLocationStore.getState().removeGPSLocation();
    const state = useLocationStore.getState();
    expect(state.savedLocations.some((l) => l.isGPS)).toBe(false);
    expect(state.activeLocationId).toBe("a");
  });

  it("falls back to null when GPS was the only location", () => {
    reset([gps()], GPS_LOCATION_ID);
    useLocationStore.getState().removeGPSLocation();
    const state = useLocationStore.getState();
    expect(state.savedLocations).toHaveLength(0);
    expect(state.activeLocationId).toBeNull();
  });

  it("leaves the active manual location untouched", () => {
    reset([gps(), loc("a", 40, -74)], "a");
    useLocationStore.getState().removeGPSLocation();
    expect(useLocationStore.getState().activeLocationId).toBe("a");
  });

  it("is a no-op when no GPS entry exists", () => {
    reset([loc("a", 40, -74)], "a");
    useLocationStore.getState().removeGPSLocation();
    const state = useLocationStore.getState();
    expect(state.savedLocations.map((l) => l.id)).toEqual(["a"]);
    expect(state.activeLocationId).toBe("a");
  });
});

describe("updateGPSLocation — first fix must not steal activation (GPS-optional flow)", () => {
  it("keeps a manually chosen city active when GPS resolves for the first time", () => {
    // User denied GPS at first, added a city, then granted permission later.
    reset([loc("a", 40, -74)], "a");
    useLocationStore.getState().updateGPSLocation(32.08, 34.78, "Here");
    const state = useLocationStore.getState();
    expect(state.savedLocations.some((l) => l.isGPS)).toBe(true);
    expect(state.activeLocationId).toBe("a");
  });

  it("activates GPS on first fix when the active id is the unresolved placeholder", () => {
    // Fresh install: initial activeLocationId is GPS_LOCATION_ID before any
    // GPS entry exists, so it resolves to nothing until the first fix lands.
    reset([], GPS_LOCATION_ID);
    useLocationStore.getState().updateGPSLocation(32.08, 34.78, "Here");
    expect(useLocationStore.getState().activeLocationId).toBe(GPS_LOCATION_ID);
  });

  it("updates coordinates in place without touching activation when GPS already exists", () => {
    reset([gps(), loc("a", 40, -74)], "a");
    useLocationStore.getState().updateGPSLocation(48.85, 2.35, "Paris");
    const state = useLocationStore.getState();
    const gpsEntry = state.savedLocations.find((l) => l.isGPS)!;
    expect(gpsEntry.latitude).toBe(48.85);
    expect(state.activeLocationId).toBe("a");
  });
});
