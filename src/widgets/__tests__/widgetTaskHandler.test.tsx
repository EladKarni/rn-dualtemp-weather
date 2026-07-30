/**
 * Worker C — widget task-handler tests.
 *
 * Covers the Phase-1 spec:
 *  - finding 5:  hydration gate — the refresh/render paths await store
 *                rehydration before reading savedLocations, so the
 *                `widget_refresh_no_location` false alarm can't fire, and
 *                settings are hydrated before the widget (which reads them at
 *                render time) is handed to renderWidget.
 *  - finding 3b: offline refresh (NoConnectionError) reports zero Sentry
 *                exceptions.
 *  - finding 3d: no sticky `widget_flow` scope tag; per-event `flow` tag instead.
 *  - fallback text/action agreement: fallback text is "Tap to retry" and its
 *    clickAction is REFRESH.
 *  - review test 6: stale cache + fetch failure renders cached weather at its
 *    original age without crashing.
 *  - Phase 2 (widget location fallback): the refresh path resolves its location
 *    via resolveWidgetLocation (GPS ?? active ?? first saved), so a
 *    manual-cities-only user (no GPS entry) still gets a working widget.
 */
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NoConnectionError } from '../../utils/errors';
import { widgetTaskHandler } from '../widgetTaskHandler';
import { useLocationStore } from '../../store/useLocationStore';
import { useForecastStore } from '../../store/useForecastStore';
import { logger } from '../../utils/logger';
import { fetchForecast } from '../../utils/fetchWeather';
import { ensureStoresHydrated } from '../widgetUpdater';

// jest.mock() calls are hoisted above the imports by babel-plugin-jest-hoist,
// so the imports above resolve to these mocks at runtime.

// react-native-android-widget primitives are mocked as host-string components so
// the created elements are plain, inspectable objects (never actually rendered).
jest.mock('react-native-android-widget', () => ({
  FlexWidget: 'FlexWidget',
  TextWidget: 'TextWidget',
  requestWidgetUpdate: jest.fn(),
}));

jest.mock('../WeatherCompact', () => ({ WeatherCompact: 'WeatherCompact' }));
jest.mock('../WeatherStandard', () => ({ WeatherStandard: 'WeatherStandard' }));
jest.mock('../WeatherExtended', () => ({ WeatherExtended: 'WeatherExtended' }));

// Worker K localized the widget fallback strings, so the handler now calls
// i18n.t(...). Back the mock with the real English table + %{...} interpolation
// so the fallback-text assertions below keep asserting the actual rendered copy.
jest.mock('../../localization/i18n', () => {
  const { en } = jest.requireActual('../../localization/en') as {
    en: Record<string, string>;
  };
  return {
    i18n: {
      locale: 'en',
      t: (key: string, opts?: Record<string, unknown>): string => {
        const template = en[key] ?? key;
        return opts
          ? template.replace(/%\{(\w+)\}/g, (_m, k: string) =>
              String(opts[k] ?? '')
            )
          : template;
      },
    },
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
    trace: jest.fn(),
    setTag: jest.fn(),
    // The handler awaits this on every exit path so queued Sentry events are
    // delivered before Android tears the headless task down.
    flush: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../utils/fetchWeather', () => ({ fetchForecast: jest.fn() }));

// The hydration gate itself is unit-tested against the real implementation in
// widgets/__tests__/widgetUpdater.test.tsx. Here it is a controllable stand-in
// that reveals the persisted GPS location only when awaited — modelling the
// headless race the gate exists to close.
jest.mock('../widgetUpdater', () => ({
  ensureStoresHydrated: jest.fn(),
  updateAllWeatherWidgets: jest.fn(),
}));

jest.mock('../../store/useLocationStore', () => ({
  GPS_LOCATION_ID: 'gps-location',
  // `persist` is part of the real store's surface (zustand's persist
  // middleware always attaches it) and the no-location diagnostic reads
  // hasHydrated(), so the mock has to carry it too.
  useLocationStore: {
    getState: jest.fn(),
    persist: { hasHydrated: jest.fn(() => true) },
  },
}));

jest.mock('../../store/useForecastStore', () => ({
  useForecastStore: { getState: jest.fn() },
}));

const GPS = 'gps-location';

const mockedLogger = logger as unknown as Record<string, jest.Mock>;
const mockedFetchForecast = fetchForecast as unknown as jest.Mock;
const mockedEnsureHydrated = ensureStoresHydrated as unknown as jest.Mock;
const mockedLocationGetState = useLocationStore.getState as unknown as jest.Mock;
const mockedForecastGetState = useForecastStore.getState as unknown as jest.Mock;

const gpsLocation = {
  id: GPS,
  name: 'Home',
  latitude: 32.1,
  longitude: 34.8,
  addedAt: 0,
  isGPS: true,
};

interface WidgetElement {
  type: unknown;
  props: {
    clickAction?: string;
    weather?: unknown;
    dataAge?: unknown;
    text?: string;
    children?: WidgetElement[] | WidgetElement;
  };
}

// State the mocked stores expose. `hydratedLocations` is what rehydration
// reveals; `locationState.savedLocations` starts empty and is populated only
// when `ensureStoresHydrated` is awaited.
let locationState: {
  savedLocations: typeof gpsLocation[];
  activeLocationId: string | null;
};
let hydratedLocations: typeof gpsLocation[];
let forecastState: Record<string, jest.Mock>;

function makeProps(
  overrides: Partial<{ widgetAction: string; clickAction: string }> = {}
): WidgetTaskHandlerProps {
  return {
    widgetAction: 'WIDGET_UPDATE',
    clickAction: undefined,
    widgetInfo: {
      widgetName: 'WeatherStandard',
      widgetId: 1,
      width: 200,
      height: 200,
    },
    renderWidget: jest.fn(),
    ...overrides,
  } as unknown as WidgetTaskHandlerProps;
}

function renderedElements(props: WidgetTaskHandlerProps): WidgetElement[] {
  const renderWidget = props.renderWidget as unknown as jest.Mock;
  return renderWidget.mock.calls.map((call: unknown[]) => call[0] as WidgetElement);
}

function exceptionErrorTypes(): (string | undefined)[] {
  const calls = mockedLogger.exception.mock.calls as [
    unknown,
    { tags?: { error_type?: string } } | undefined
  ][];
  return calls.map((call) => call[1]?.tags?.error_type);
}

beforeEach(() => {
  jest.clearAllMocks();

  hydratedLocations = [gpsLocation];
  locationState = { savedLocations: [], activeLocationId: null };

  mockedEnsureHydrated.mockImplementation(async () => {
    // Rehydration reveals the persisted locations that weren't there before.
    locationState.savedLocations = hydratedLocations;
    locationState.activeLocationId = hydratedLocations[0]?.id ?? null;
  });

  mockedLocationGetState.mockImplementation(() => locationState);

  forecastState = {
    initializeDatabase: jest.fn().mockResolvedValue(undefined),
    getWeatherDataWithAge: jest
      .fn()
      .mockResolvedValue({ weather: null, ageMinutes: null }),
    isLocationDataFresh: jest.fn().mockResolvedValue(true),
    refreshWeather: jest.fn().mockResolvedValue(undefined),
    setWeatherData: jest.fn().mockResolvedValue(undefined),
  };
  mockedForecastGetState.mockImplementation(() => forecastState);
});

describe('Sentry delivery — headless task flush', () => {
  // Android kills the headless JS task the moment the handler resolves. Anything
  // captured on the way out is dropped unless the queue is flushed first, which
  // made widget failures — the hardest to reproduce by hand — also the least
  // likely to ever reach Sentry.
  it('flushes after a normal render', async () => {
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: { lat: 1 },
      ageMinutes: 0,
    });

    await widgetTaskHandler(makeProps({ widgetAction: 'WIDGET_UPDATE' }));

    expect(mockedLogger.flush).toHaveBeenCalledTimes(1);
  });

  it('flushes on the unknown-widget path, which reports and then returns immediately', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_UPDATE' });
    (props.widgetInfo as { widgetName: string }).widgetName = 'NoSuchWidget';

    await widgetTaskHandler(props);

    expect(mockedLogger.error).toHaveBeenCalled();
    // The report is worthless if the process dies before it is on the wire.
    expect(mockedLogger.flush).toHaveBeenCalledTimes(1);
    expect(mockedLogger.flush.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockedLogger.error.mock.invocationCallOrder[0]
    );
  });

  it('flushes even when the handler throws', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });
    mockedEnsureHydrated.mockRejectedValue(new Error('hydration exploded'));

    await widgetTaskHandler(props);

    expect(mockedLogger.flush).toHaveBeenCalledTimes(1);
  });
});

describe('widget refresh — hydration gate (finding 5)', () => {
  it('awaits rehydration before reading savedLocations, so no false no-location alarm fires', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: { lat: 1 },
      ageMinutes: 0,
    });

    await widgetTaskHandler(props);

    expect(mockedEnsureHydrated).toHaveBeenCalledTimes(1);
    // The GPS entry was read post-hydration → the refresh proceeded to fetch.
    expect(forecastState.refreshWeather).toHaveBeenCalledWith(
      GPS,
      'en',
      gpsLocation.latitude,
      gpsLocation.longitude
    );
    // The exact false alarm the review caught must not be emitted.
    expect(exceptionErrorTypes()).not.toContain('widget_refresh_no_location');
  });

  it('hydrates stores before rendering, so settings are read only post-hydration', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_UPDATE' });
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: { lat: 1 },
      ageMinutes: 5,
    });

    await widgetTaskHandler(props);

    const renderWidget = props.renderWidget as unknown as jest.Mock;
    expect(mockedEnsureHydrated).toHaveBeenCalledTimes(1);
    expect(renderWidget).toHaveBeenCalled();
    // Hydration (which rehydrates useSettingsStore) precedes the render that
    // reads settings headlessly.
    expect(mockedEnsureHydrated.mock.invocationCallOrder[0]).toBeLessThan(
      renderWidget.mock.invocationCallOrder[0]
    );
  });
});

describe('widget refresh — Sentry noise (findings 3b, 3d)', () => {
  it('reports zero Sentry exceptions on an offline refresh and still renders cached data', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });
    const cached = { lat: 1, lon: 2 };
    forecastState.refreshWeather.mockRejectedValue(new NoConnectionError());
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: cached,
      ageMinutes: 45,
    });

    await widgetTaskHandler(props);

    expect(forecastState.refreshWeather).toHaveBeenCalled();
    // Offline is expected — no Sentry exception, only a breadcrumb.
    expect(mockedLogger.exception).not.toHaveBeenCalled();
    expect(mockedLogger.warn).toHaveBeenCalled();

    const weatherEl = renderedElements(props).find((el) => el.type === 'WeatherStandard');
    expect(weatherEl).toBeDefined();
    expect(weatherEl?.props.weather).toBe(cached);
    // refresh failed → cached data shown at its cached age, not "fresh" (0).
    expect(weatherEl?.props.dataAge).toBe(45);
  });

  it('does not set a sticky widget_flow scope tag', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: { lat: 1 },
      ageMinutes: 0,
    });

    await widgetTaskHandler(props);

    expect(mockedLogger.setTag).not.toHaveBeenCalled();
  });

  it('tags a genuine no-location event with the per-event flow tag', async () => {
    hydratedLocations = []; // no saved location at all, even after hydration
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });

    await widgetTaskHandler(props);

    expect(mockedLogger.exception).toHaveBeenCalledWith(
      'Widget refresh: no widget location found',
      expect.objectContaining({
        tags: expect.objectContaining({
          error_type: 'widget_refresh_no_location',
          flow: 'widget_refresh',
        }),
      })
    );
  });
});

describe('widget refresh — GPS-optional location fallback (Phase 2)', () => {
  it('refreshes the resolved fallback location for a manual-cities-only user (no GPS entry)', async () => {
    const manualCity = {
      id: 'location-1',
      name: 'Paris',
      latitude: 48.85,
      longitude: 2.35,
      addedAt: 0,
      isGPS: false,
    };
    hydratedLocations = [manualCity];
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: { lat: 1 },
      ageMinutes: 0,
    });

    await widgetTaskHandler(props);

    // The resolver fell back to the active manual city — no false no-location
    // alarm, and every cache read/write keys off the city's own id.
    expect(exceptionErrorTypes()).not.toContain('widget_refresh_no_location');
    expect(forecastState.refreshWeather).toHaveBeenCalledWith(
      manualCity.id,
      'en',
      manualCity.latitude,
      manualCity.longitude
    );
    expect(forecastState.getWeatherDataWithAge).toHaveBeenCalledWith(manualCity.id);
  });
});

describe('fallback widget text/action agreement', () => {
  it('refresh no-location fallback uses "Tap to retry" with a REFRESH action', async () => {
    hydratedLocations = [];
    const props = makeProps({ widgetAction: 'WIDGET_CLICK', clickAction: 'REFRESH' });

    await widgetTaskHandler(props);

    const [fallback] = renderedElements(props);
    expect(fallback.type).toBe('FlexWidget');
    expect(fallback.props.clickAction).toBe('REFRESH');
    const children = fallback.props.children as WidgetElement[];
    const texts = children.map((child) => child.props.text);
    expect(texts).toContain('Tap to retry');
    expect(texts).not.toContain('Tap to open app');
  });

  it('render-path no-location fallback also uses "Tap to retry" with a REFRESH action', async () => {
    hydratedLocations = [];
    const props = makeProps({ widgetAction: 'WIDGET_UPDATE' });

    await widgetTaskHandler(props);

    const [fallback] = renderedElements(props);
    expect(fallback.props.clickAction).toBe('REFRESH');
    const children = fallback.props.children as WidgetElement[];
    expect(children.map((child) => child.props.text)).toContain('Tap to retry');
  });
});

describe('review test 6 — stale cache + fetch failure', () => {
  it('renders cached weather at its original age without crashing', async () => {
    const props = makeProps({ widgetAction: 'WIDGET_UPDATE' });
    const cached = { lat: 1, lon: 2 };
    forecastState.getWeatherDataWithAge.mockResolvedValue({
      weather: cached,
      ageMinutes: 120,
    });
    forecastState.isLocationDataFresh.mockResolvedValue(false); // stale
    mockedFetchForecast.mockRejectedValue(new Error('boom'));

    await expect(widgetTaskHandler(props)).resolves.toBeUndefined();

    // Never persisted the failed fetch; only the cached data is shown.
    expect(forecastState.setWeatherData).not.toHaveBeenCalled();
    const [el] = renderedElements(props);
    expect(el.type).toBe('WeatherStandard');
    expect(el.props.weather).toBe(cached);
    expect(el.props.dataAge).toBe(120); // original age preserved
  });
});
