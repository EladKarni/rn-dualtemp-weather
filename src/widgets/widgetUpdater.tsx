import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { WeatherCompact } from './WeatherCompact';
import { WeatherStandard } from './WeatherStandard';
import { WeatherExtended } from './WeatherExtended';
import { useLocationStore, GPS_LOCATION_ID } from '../store/useLocationStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Weather } from '../types/WeatherTypes';
import { logger } from '../utils/logger';
import { updateIOSWidgetData } from './utils/iosWidgetStorage';
import React from 'react';

/**
 * Ensure the three persisted stores are hydrated from AsyncStorage before the
 * headless widget context reads them.
 *
 * Widgets run in a fresh headless JS task where Zustand's `persist` rehydration
 * is still in flight. Reading `savedLocations` / `i18n.locale` / settings before
 * that async read resolves produces false "no location" renders and wrong-unit
 * output (review finding 5). Awaiting `rehydrate()` on each persisted store
 * closes that race. Only these three stores are persisted; `useForecastStore`
 * (SQLite-backed) and `useModalStore` have no `.persist` API and must not be
 * passed through here.
 *
 * `useSettingsStore` is included because widgets read settings headlessly —
 * `BaseWeatherWidget` reads `tempScale`, and the widget clock-format path reads
 * `clockFormat` — so its hydration must be guaranteed too.
 */
export const ensureStoresHydrated = async (): Promise<void> => {
  await Promise.all([
    useLocationStore.persist.rehydrate(),
    useLanguageStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
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
 *   the settings UI passes the cached GPS weather. Because the payload is passed
 *   in, this module never imports the forecast store — that breaks the
 *   `useForecastStore <-> widgetUpdater` require cycle. A missing or non-Weather
 *   value (e.g. a segment string forwarded by a naive callback) is ignored.
 */
export const updateAllWeatherWidgets = async (weather?: Weather) => {
  try {
    // Hydrate persisted stores before reading savedLocations / locale / settings
    // in this (potentially headless) context.
    await ensureStoresHydrated();

    const locationStore = useLocationStore.getState();

    const gpsLocation = locationStore.savedLocations.find(
      (loc) => loc.id === GPS_LOCATION_ID
    );

    if (!gpsLocation) {
      logger.warn('No GPS location found for widget update');
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
      await updateIOSWidgetData(weatherData, gpsLocation.name);
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
              locationName={gpsLocation.name}
            />
          ),
        }),
        requestWidgetUpdate({
          widgetName: 'WeatherStandard',
          renderWidget: (widgetInfo) => (
            <WeatherStandard
              weather={weatherData}
              lastUpdated={lastUpdated}
              locationName={gpsLocation.name}
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
              locationName={gpsLocation.name}
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
