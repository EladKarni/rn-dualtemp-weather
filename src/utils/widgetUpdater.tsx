import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { WeatherCompact } from '../widgets/WeatherCompact';
import { WeatherStandard } from '../widgets/WeatherStandard';
import { WeatherExtended } from '../widgets/WeatherExtended';
import { useForecastStore } from '../store/useForecastStore';
import { useLocationStore, GPS_LOCATION_ID } from '../store/useLocationStore';
import { logger } from './logger';
import { updateIOSWidgetData } from './iosWidgetStorage';
import React from 'react';

/**
 * Request immediate update of all weather widgets
 * Call this when settings change that affect widget display
 */
export const updateAllWeatherWidgets = async () => {
  try {
    // Get weather data from store
    const weatherStore = useForecastStore.getState();
    const locationStore = useLocationStore.getState();

    const gpsLocation = locationStore.savedLocations.find(
      (loc) => loc.id === GPS_LOCATION_ID
    );

    if (!gpsLocation) {
      logger.warn('No GPS location found for widget update');
      return;
    }

    const weather = await weatherStore.getWeatherData(GPS_LOCATION_ID);

    if (!weather) {
      logger.warn('No weather data found for widget update');
      return;
    }

    const lastUpdated = new Date();

    if (Platform.OS === 'ios') {
      // Update iOS widgets via App Groups
      await updateIOSWidgetData(weather, gpsLocation.name);
      logger.debug('iOS widgets updated successfully');
    } else {
      // Update Android widgets via react-native-android-widget
      await Promise.all([
        requestWidgetUpdate({
          widgetName: 'WeatherCompact',
          renderWidget: (widgetInfo) => (
            <WeatherCompact
              weather={weather}
              lastUpdated={lastUpdated}
              locationName={gpsLocation.name}
            />
          ),
        }),
        requestWidgetUpdate({
          widgetName: 'WeatherStandard',
          renderWidget: (widgetInfo) => (
            <WeatherStandard
              weather={weather}
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
              weather={weather}
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
