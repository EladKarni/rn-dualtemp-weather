import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { WeatherCompact } from './WeatherCompact';
import { WeatherStandard } from './WeatherStandard';
import { WeatherExtended } from './WeatherExtended';
import { useLocationStore } from '../store/useLocationStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Weather } from '../types/WeatherTypes';
import { logger } from '../utils/logger';
import { updateIOSWidgetData } from './utils/iosWidgetStorage';
import { resolveWidgetLocation } from './utils/widgetDataUtils';
import React from 'react';

/**
 * Ensure the three persisted stores are hydrated from AsyncStorage before the
 * headless widget context reads them.
 *
 * Widgets run in a fresh headless JS task where Zustand's `persist` rehydration
 * is still in flight. Reading `savedLocations` / `i18n.locale` / settings before
 * that async read resolves produces false "no location" renders and wrong-unit
 * output (review finding 5). Only these three stores are persisted;
 * `useForecastStore` (SQLite-backed) and `useModalStore` have no `.persist` API
 * and must not be passed through here.
 *
 * `useSettingsStore` is included because widgets read settings headlessly —
 * `BaseWeatherWidget` reads `tempScale`, and the widget clock-format path reads
 * `clockFormat` — so its hydration must be guaranteed too.
 *
 * WAIT for hydration — never force a re-run in a context that may be live.
 * `updateAllWeatherWidgets` also executes in the MAIN app context (fired by
 * `setWeatherData` after every fetch), and `persist.rehydrate()` there replaces
 * newer in-memory state with the persisted snapshot. That rollback blanked the
 * "Last Updated" footer for a fresh install's entire first process (the
 * persisted value was still null) and silently rewound it after every fetch
 * (2026-07-28 debugging). The forced `rehydrate()` survives only as a bounded
 * fallback for a headless context whose automatic hydration never completes.
 */
const HYDRATION_WAIT_TIMEOUT_MS = 3000;

interface PersistLike {
  hasHydrated: () => boolean;
  onFinishHydration: (cb: () => void) => () => void;
  rehydrate: () => Promise<unknown> | unknown;
}

const ensureStoreHydrated = async (
  persistApi: PersistLike,
  forceRefresh: boolean
): Promise<void> => {
  // A headless render must re-read storage even when this context is already
  // hydrated. Its JS context can outlive a preference change made in the app —
  // hydration happened once, `hasHydrated()` stays true forever, and the task
  // keeps serving the snapshot it started with. Observed on-device: changing the
  // widget colour then resizing a widget re-rendered it in the PREVIOUS colour,
  // while a widget the app had repainted showed the new one. Force-stopping
  // "fixed" it only by destroying the stale context.
  if (forceRefresh) {
    await persistApi.rehydrate();
    return;
  }

  if (persistApi.hasHydrated()) {
    return;
  }

  const completed = await new Promise<boolean>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      unsubscribe?.();
      resolve(false);
    }, HYDRATION_WAIT_TIMEOUT_MS);
    unsubscribe = persistApi.onFinishHydration(() => {
      clearTimeout(timer);
      unsubscribe?.();
      resolve(true);
    });
    // Hydration may have finished between the check above and subscribing
    if (persistApi.hasHydrated()) {
      clearTimeout(timer);
      unsubscribe();
      resolve(true);
    }
  });

  if (!completed) {
    await persistApi.rehydrate();
  }
};

/**
 * @param forceRefresh Re-read persisted state even if this context already
 *   hydrated. Pass `true` ONLY from the headless widget task, where nothing
 *   mutates these stores so their in-memory copy is never authoritative. Must
 *   stay `false` in the main app context: `updateAllWeatherWidgets` runs there
 *   too, and `rehydrate()` would replace newer in-memory state with the
 *   persisted snapshot — the rollback documented above.
 */
export const ensureStoresHydrated = async (
  forceRefresh = false
): Promise<void> => {
  await Promise.all([
    ensureStoreHydrated(useLocationStore.persist, forceRefresh),
    ensureStoreHydrated(useLanguageStore.persist, forceRefresh),
    ensureStoreHydrated(useSettingsStore.persist, forceRefresh),
  ]);
};

/**
 * Runtime type guard. A callback such as SegmentedControl's `onAfterChange`
 * forwards its selected option value (a temp-scale string) to whatever it is
 * wired to. This guard ensures such a stray value is never mistaken for a
 * Weather payload — non-Weather input is ignored (widgets are not updated).
 */
const isWeather = (value: unknown): value is Weather =>
  typeof value === 'object' &&
  value !== null &&
  'current' in value &&
  'daily' in value;

/**
 * Request immediate update of all weather widgets.
 *
 * @param weather The weather payload to render. Callers own reading it:
 *   `useForecastStore.setWeatherData` passes the weather it just persisted, and
 *   the settings UI passes the resolved widget location's cached weather.
 *   Because the payload is passed in, this module never imports the forecast
 *   store — that breaks the `useForecastStore <-> widgetUpdater` require cycle.
 *   A missing or non-Weather value (e.g. a segment string forwarded by a naive
 *   callback) is ignored.
 * @param locationId The location the payload belongs to. Widgets always show
 *   the resolved widget location (GPS ?? active ?? first saved), so a payload
 *   for any other location — e.g. a background prefetch of a non-widget city —
 *   skips the repaint instead of mislabeling the widget with that city's
 *   temperatures under the widget location's name.
 */
export const updateAllWeatherWidgets = async (
  weather: Weather | undefined,
  locationId: string
) => {
  try {
    // Hydrate persisted stores before reading savedLocations / locale / settings
    // in this (potentially headless) context.
    await ensureStoresHydrated();

    const locationStore = useLocationStore.getState();

    const widgetLocation = resolveWidgetLocation(
      locationStore.savedLocations,
      locationStore.activeLocationId
    );

    if (!widgetLocation) {
      logger.warn('No location found for widget update');
      return;
    }

    if (locationId !== widgetLocation.id) {
      logger.debug(
        `Skipping widget update: payload is for ${locationId}, widgets show ${widgetLocation.id}`
      );
      return;
    }

    // Guard against a non-Weather value being forwarded by a callback.
    const weatherData: Weather | null = isWeather(weather) ? weather : null;

    if (!weatherData) {
      logger.warn('No weather data found for widget update');
      return;
    }

    const lastUpdated = new Date();

    if (Platform.OS === 'ios') {
      // Update iOS widgets via App Groups
      await updateIOSWidgetData(weatherData, widgetLocation.name);
      logger.debug('iOS widgets updated successfully');
    } else {
      // Update Android widgets via react-native-android-widget
      await Promise.all([
        requestWidgetUpdate({
          widgetName: 'WeatherCompact',
          renderWidget: (widgetInfo) => (
            <WeatherCompact
              weather={weatherData}
              lastUpdated={lastUpdated}
              locationName={widgetLocation.name}
            />
          ),
        }),
        requestWidgetUpdate({
          widgetName: 'WeatherStandard',
          renderWidget: (widgetInfo) => (
            <WeatherStandard
              weather={weatherData}
              lastUpdated={lastUpdated}
              locationName={widgetLocation.name}
              width={widgetInfo.width}
              height={widgetInfo.height}
            />
          ),
        }),
        requestWidgetUpdate({
          widgetName: 'WeatherExtended',
          renderWidget: (widgetInfo) => (
            <WeatherExtended
              weather={weatherData}
              lastUpdated={lastUpdated}
              locationName={widgetLocation.name}
              width={widgetInfo.width}
              height={widgetInfo.height}
            />
          ),
        }),
      ]);
      logger.debug('Android widgets updated successfully');
    }
  } catch (error) {
    logger.error('Failed to update widgets:', error);
  }
};
