import { useLocationStore } from '../store/useLocationStore';
import { useForecastStore } from '../store/useForecastStore';
import { resolveWidgetLocation } from './utils/widgetDataUtils';
import { updateAllWeatherWidgets } from './widgetUpdater';
import { logger } from '../utils/logger';

/**
 * Repaints the home-screen widgets when the location they RESOLVE to changes
 * (a manual-cities-only user switches the active city, or the GPS entry
 * appears/disappears). setWeatherData only reaches the widgets when data is
 * actually fetched — switching onto a city whose forecast is still fresh in
 * the query cache fetches nothing, and the updater's payload-mismatch skip
 * suppresses the previous city's writes, so without this the widget freezes on
 * the old city (iOS never self-fetches; Android waits out its 30-minute cycle).
 *
 * Lives in its own module because widgetUpdater must not import the forecast
 * store and the location store must not import widgetUpdater (require cycles);
 * this module sits above both. Wired once at app startup (App.tsx).
 *
 * @returns The store unsubscribe function.
 */
export const startWidgetLocationSync = (): (() => void) =>
  useLocationStore.subscribe((state, prevState) => {
    const resolved = resolveWidgetLocation(
      state.savedLocations,
      state.activeLocationId,
    );
    const prevResolved = resolveWidgetLocation(
      prevState.savedLocations,
      prevState.activeLocationId,
    );

    if (!resolved || resolved.id === prevResolved?.id) {
      return;
    }

    useForecastStore
      .getState()
      .getWeatherData(resolved.id)
      .then((weather) => {
        if (weather) {
          return updateAllWeatherWidgets(weather, resolved.id);
        }
        // No cached weather for the new resolution yet — the fetch that
        // produces it repaints via setWeatherData.
        return undefined;
      })
      .catch((error) => {
        logger.error('Widget location sync failed:', error);
      });
  });
