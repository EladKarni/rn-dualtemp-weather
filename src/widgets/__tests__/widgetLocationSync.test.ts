/**
 * Widget location sync — repaint on resolution change.
 *
 * The updater's payload-mismatch skip plus TanStack cache freshness means an
 * active-city switch can otherwise leave the widget frozen on the previous
 * city (review finding, 2026-07-28): no fetch -> no setWeatherData -> no
 * repaint. This suite pins the subscription that closes that gap.
 */
import { startWidgetLocationSync } from "../widgetLocationSync";
import { useLocationStore } from "../../store/useLocationStore";
import type { SavedLocation } from "../../store/useLocationStore";
import { updateAllWeatherWidgets } from "../widgetUpdater";
import { useForecastStore } from "../../store/useForecastStore";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../../localization/i18n", () => ({
  i18n: { locale: "en", t: (key: string) => key },
}));

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

jest.mock("../widgetUpdater", () => ({
  updateAllWeatherWidgets: jest.fn().mockResolvedValue(undefined),
}));

const mockGetWeatherData = jest.fn();
jest.mock("../../store/useForecastStore", () => ({
  useForecastStore: {
    getState: () => ({ getWeatherData: mockGetWeatherData }),
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

const loc = (id: string): SavedLocation => ({
  id,
  name: id,
  latitude: 40,
  longitude: -74,
  addedAt: 1,
  isGPS: false,
});

const fakeWeather = { current: { temp: 20 } };

// Flush the subscription's getWeatherData().then(...) chain.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("startWidgetLocationSync", () => {
  let unsubscribe: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWeatherData.mockResolvedValue(fakeWeather);
    useLocationStore.setState({
      savedLocations: [loc("paris"), loc("tokyo")],
      activeLocationId: "paris",
    });
    unsubscribe = startWidgetLocationSync();
  });

  afterEach(() => {
    unsubscribe();
  });

  it("pushes the newly-resolved city's cached weather when a manual-only user switches active", async () => {
    useLocationStore.setState({ activeLocationId: "tokyo" });
    await flush();

    expect(mockGetWeatherData).toHaveBeenCalledWith("tokyo");
    expect(updateAllWeatherWidgets).toHaveBeenCalledWith(fakeWeather, "tokyo");
  });

  it("does nothing when the resolution is unchanged (GPS present, active switch)", async () => {
    useLocationStore.setState({
      savedLocations: [gps(), loc("paris"), loc("tokyo")],
      activeLocationId: "paris",
    });
    await flush();
    jest.clearAllMocks();

    // GPS still wins the resolution — an active switch must not repaint.
    useLocationStore.setState({ activeLocationId: "tokyo" });
    await flush();

    expect(mockGetWeatherData).not.toHaveBeenCalled();
    expect(updateAllWeatherWidgets).not.toHaveBeenCalled();
  });

  it("skips the push when the new resolution has no cached weather yet", async () => {
    mockGetWeatherData.mockResolvedValue(null);

    useLocationStore.setState({ activeLocationId: "tokyo" });
    await flush();

    expect(mockGetWeatherData).toHaveBeenCalledWith("tokyo");
    expect(updateAllWeatherWidgets).not.toHaveBeenCalled();
  });

  it("repaints when the GPS entry is removed and resolution falls to a manual city", async () => {
    useLocationStore.setState({
      savedLocations: [gps(), loc("paris")],
      activeLocationId: "gps-location",
    });
    await flush();
    jest.clearAllMocks();

    useLocationStore.getState().removeGPSLocation();
    await flush();

    expect(updateAllWeatherWidgets).toHaveBeenCalledWith(fakeWeather, "paris");
  });

  it("does nothing when the store empties entirely", async () => {
    useLocationStore.setState({ savedLocations: [], activeLocationId: null });
    await flush();

    expect(mockGetWeatherData).not.toHaveBeenCalled();
    expect(updateAllWeatherWidgets).not.toHaveBeenCalled();
  });
});
