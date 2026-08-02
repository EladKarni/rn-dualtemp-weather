import { useLocationStore } from '../../store/useLocationStore';
import { useForecastStore } from '../../store/useForecastStore';
import { updateAllWeatherWidgets } from '../widgetUpdater';
import { resolveWidgetLocation } from './widgetDataUtils';
import { logger } from '../../utils/logger';

/**
 * Repaint the home-screen widgets from the app, after a setting that changes
 * how they render.
 *
 * Widgets only redraw when something asks them to: their own scheduled task is
 * half an hour away, and a tap runs the headless task rather than the app. So
 * any preference the widgets read has to push the change itself, or the user
 * changes a setting and watches nothing happen until the next refresh.
 *
 * Extracted because it was being re-implemented per setting, and the one
 * setting that forgot to implement it — language — was the one nobody noticed:
 * temperature unit and widget style both pushed, so language looked like an
 * inconsistency in the widgets rather than a missing call.
 */
export const repaintWidgetsAfterSettingChange = async (
  reason: string
): Promise<void> => {
  try {
    const locationStore = useLocationStore.getState();
    const widgetLocation = resolveWidgetLocation(
      locationStore.savedLocations,
      locationStore.activeLocationId
    );

    if (!widgetLocation) {
      logger.debug(`Skipping widget repaint after ${reason}: no widget location`);
      return;
    }

    const weather = await useForecastStore
      .getState()
      .getWeatherData(widgetLocation.id);

    if (!weather) {
      logger.debug(`Skipping widget repaint after ${reason}: no cached weather`);
      return;
    }

    await updateAllWeatherWidgets(weather, widgetLocation.id);
    logger.debug(`Widgets repainted after ${reason}`);
  } catch (error) {
    // A settings change must never fail because the widgets could not be
    // redrawn — the user's preference is already saved either way.
    logger.warn(`Failed to repaint widgets after ${reason}:`, error);
  }
};
