/**
 * Worker E — location-switch race (finding 9).
 *
 * Drives the hook through an A -> B switch while the SQLite cache reads are still
 * in flight and asserts:
 *   - B never shows A's cached weather (synchronous guard),
 *   - A's read that lands AFTER the switch is discarded (cancelled flag),
 *   - B's cache paints once B's own read resolves.
 *
 * fetchForecast resolves to null so the active query settles (no perpetual-pending
 * leak) while `activeWeather` still routes through the SQLite-cache fallback under
 * test (`activeData ?? cachedActiveWeather` — null is nullish, so the cache wins).
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Weather } from '../../types/WeatherTypes';
import type { SavedLocation } from '../../store/useLocationStore';
import { useForecastStore } from '../../store/useForecastStore';
import { useMultiLocationWeather } from '../useMultiLocationWeather';

jest.mock('../../utils/fetchWeather', () => ({
  fetchForecast: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../../localization/i18n', () => ({ i18n: { locale: 'en' } }));
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    exception: jest.fn(),
    trace: jest.fn(),
    setTag: jest.fn(),
  },
}));
jest.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: (selector: (s: { setLastUpdated: (v: string) => void }) => unknown) =>
    selector({ setLastUpdated: jest.fn() }),
}));
jest.mock('../../store/useForecastStore', () => ({
  useForecastStore: { getState: jest.fn() },
  initializeForecastStore: jest.fn(() => Promise.resolve()),
}));

// Per-location resolvers so each SQLite read can be landed on demand.
const deferredResolvers: Record<string, (weather: Weather | null) => void> = {};
const getWeatherData = jest.fn(
  (locationId: string) =>
    new Promise<Weather | null>(resolve => {
      deferredResolvers[locationId] = resolve;
    })
);

const makeWeather = (lat: number): Weather => ({ lat } as unknown as Weather);
const makeLocation = (id: string): SavedLocation => ({
  id,
  name: id,
  latitude: 1,
  longitude: 2,
  addedAt: 0,
  isGPS: false,
});

describe('useMultiLocationWeather — location-switch race (finding 9)', () => {
  let client: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    for (const key of Object.keys(deferredResolvers)) {
      delete deferredResolvers[key];
    }
    getWeatherData.mockClear();
    (useForecastStore.getState as jest.Mock).mockReturnValue({
      getWeatherData,
      setWeatherData: jest.fn(() => Promise.resolve()),
    });
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    client.clear();
  });

  it('discards the previous location read and never paints it under the new one', async () => {
    const saved = [makeLocation('A'), makeLocation('B')];

    const { result, rerender, unmount } = renderHook(
      ({ activeId }: { activeId: string }) =>
        useMultiLocationWeather(saved, activeId, true),
      { initialProps: { activeId: 'A' }, wrapper }
    );

    // A's cache read is in flight; nothing painted yet.
    expect(result.current.activeWeather).toBeFalsy();
    expect(deferredResolvers.A).toBeDefined();

    // Switch to B before A's read resolves.
    act(() => {
      rerender({ activeId: 'B' });
    });

    // B's read is now in flight; A's cache must NOT show for B.
    expect(result.current.activeWeather).toBeFalsy();
    expect(deferredResolvers.B).toBeDefined();

    // A's late read lands AFTER the switch -> must be discarded.
    await act(async () => {
      deferredResolvers.A(makeWeather(11));
    });
    expect(result.current.activeWeather).toBeFalsy();

    // B's own read lands -> B's cache paints.
    await act(async () => {
      deferredResolvers.B(makeWeather(22));
    });
    expect(result.current.activeWeather).toEqual(makeWeather(22));

    // Deterministic teardown inside the test: unmount removes the observers, then
    // clear() destroys the queries and cancels their (1h) gc timers so no timer
    // survives into jest's post-run exit check.
    unmount();
    client.clear();
  });
});
