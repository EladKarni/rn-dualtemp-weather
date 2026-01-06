import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import WeatherWidget from './WeatherWidget';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { useWeatherStore } from '../store/useWeatherStore';
import { useLocationStore } from '../store/useLocationStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import { fetchForecast } from '../utils/fetchWeather';

const nameToWidget = {
  Weather: WeatherWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      try {
        // Get current stores state (widgets run outside React context)
        const weatherStore = useWeatherStore.getState();
        const locationStore = useLocationStore.getState();
        const languageStore = useLanguageStore.getState();

        const activeLocationId = locationStore.activeLocationId;
        const activeLocation = locationStore.savedLocations.find(
          loc => loc.id === activeLocationId
        );

        if (!activeLocation) {
          logger.warn('No active location found for widget');
          props.renderWidget(
            <FlexWidget
              style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#1C1B4D',
                borderRadius: 16,
                padding: 16,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              clickAction="OPEN_APP"
            >
              <TextWidget
                text="Weather data unavailable"
                style={{
                  fontSize: 14,
                  color: '#E5E7EB',
                  textAlign: 'center'
                }}
              />
              <TextWidget
                text="Tap to open app"
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  textAlign: 'center'
                }}
              />
            </FlexWidget>
          );
          return;
        }

        // Check if we have fresh data
        let weather = weatherStore.getWeatherData(activeLocationId);
        const lastUpdated = weatherStore.getLastUpdated(activeLocationId);

        // If no fresh data, fetch it
        if (!weather || !weatherStore.isLocationDataFresh(activeLocationId)) {
          logger.debug('Fetching fresh data for widget:', activeLocationId);
          weather = await fetchForecast(
            i18n.locale,
            activeLocation.latitude,
            activeLocation.longitude
          );
          
          // Store for future use
          weatherStore.setWeatherData(activeLocationId, weather);
        }

        if (weather) {
          const lastUpdateDate = lastUpdated || new Date();
          props.renderWidget(
            <WeatherWidget
              weather={weather}
              lastUpdated={lastUpdateDate}
              locationName={activeLocation.name}
            />
          );
        } else {
          // Inline error handling (no separate component needed)
          props.renderWidget(
            <FlexWidget
              style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#1C1B4D',
                borderRadius: 16,
                padding: 16,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              clickAction="OPEN_APP"
            >
              <TextWidget
                text="Weather data unavailable"
                style={{
                  fontSize: 14,
                  color: '#E5E7EB',
                  textAlign: 'center'
                }}
              />
              <TextWidget
                text="Tap to open app"
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  textAlign: 'center'
                }}
              />
            </FlexWidget>
          );
        }
      } catch (error) {
        logger.error('Widget update failed:', error);
        // Inline error handling
        props.renderWidget(
          <FlexWidget
            style={{
              height: 'match_parent',
              width: 'match_parent',
              backgroundColor: '#1C1B4D',
              borderRadius: 16,
              padding: 16,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            clickAction="OPEN_APP"
          >
            <TextWidget
              text="Unable to load weather"
              style={{
                fontSize: 14,
                color: '#E5E7EB',
                textAlign: 'center'
              }}
            />
            <TextWidget
              text="Tap to open app"
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                textAlign: 'center'
              }}
            />
          </FlexWidget>
        );
      }
      break;

    case 'WIDGET_CLICK':
      // OPEN_APP action is handled automatically by library
      if (props.clickAction === 'REFRESH') {
        // Manual refresh from widget
        try {
          const weatherStore = useWeatherStore.getState();
          const locationStore = useLocationStore.getState();
          const languageStore = useLanguageStore.getState();

          const activeLocationId = locationStore.activeLocationId;
          const activeLocation = locationStore.savedLocations.find(
            loc => loc.id === activeLocationId
          );

          if (activeLocation) {
            await weatherStore.refreshWeather(
              activeLocationId,
              i18n.locale,
              activeLocation.latitude,
              activeLocation.longitude
            );
          }
        } catch (error) {
          logger.error('Manual widget refresh failed:', error);
        }
      }
      break;

    case 'WIDGET_DELETED':
      // No cleanup needed - data stays in store
      break;

    default:
      break;
  }
}