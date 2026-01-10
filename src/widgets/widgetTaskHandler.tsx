import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WeatherCompact } from './WeatherCompact';
import { WeatherStandard } from './WeatherStandard';
import { WeatherExtended } from './WeatherExtended';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { useLocationStore, GPS_LOCATION_ID } from '../store/useLocationStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { useForecastStore } from '../store/useForecastStore';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import { fetchForecast } from '../utils/fetchWeather';


const nameToWidget = {
  WeatherCompact: WeatherCompact,
  WeatherStandard: WeatherStandard,
  WeatherExtended: WeatherExtended,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  logger.debug(`Widget action: ${props.widgetAction}, widget name: ${widgetInfo.widgetName}`);

  const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  if (!Widget) {
    logger.error(`No widget found with name: ${widgetInfo.widgetName}`);
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED': {
      logger.debug(`Handling ${widgetInfo.widgetName} widget addition`);
      try {
        // Initialize database if needed (widgets run outside React context)
        // Always call initializeDatabase() directly in widget context since widgets may run in separate process
        await useForecastStore.getState().initializeDatabase();

        // Get current stores state (widgets run outside React context)
        const weatherStore = useForecastStore.getState();
        const locationStore = useLocationStore.getState();

        const gpsLocation = locationStore.savedLocations.find(
          loc => loc.id === GPS_LOCATION_ID
        );

        if (!gpsLocation) {
          logger.warn('No GPS location found for widget');
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
              clickAction="REFRESH"
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
        let weather = await weatherStore.getWeatherData(GPS_LOCATION_ID);
        const isFresh = await weatherStore.isLocationDataFresh(GPS_LOCATION_ID);

        // If no fresh data, fetch it
        if (!weather || !isFresh) {
          logger.debug('Fetching fresh data for widget:', GPS_LOCATION_ID);
          weather = await fetchForecast(
            i18n.locale,
            gpsLocation.latitude,
            gpsLocation.longitude
          );

          // Store for future use
          await weatherStore.setWeatherData(GPS_LOCATION_ID, weather);
        }

        if (weather) {
          const lastUpdateDate = new Date();
          props.renderWidget(
            <Widget
              weather={weather}
              lastUpdated={lastUpdateDate}
              locationName={gpsLocation.name}
              width={widgetInfo.width}
              height={widgetInfo.height}
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
              clickAction="REFRESH"
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
        logger.error('Widget addition failed:', error);
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
            clickAction="REFRESH"
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
    }
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      if (widgetInfo.widgetName === 'WeatherCompact' || widgetInfo.widgetName === 'WeatherStandard' || widgetInfo.widgetName === 'WeatherExtended') {
        // Handle new weather widgets
        logger.debug(`Handling ${widgetInfo.widgetName} widget update`);
        try {
          // Initialize database if needed (widgets run outside React context)
          // Always call initializeDatabase() directly in widget context since widgets may run in separate process
          await useForecastStore.getState().initializeDatabase();

          // Get current stores state (widgets run outside React context)
          const weatherStore = useForecastStore.getState();
          const locationStore = useLocationStore.getState();

          const gpsLocation = locationStore.savedLocations.find(
            loc => loc.id === GPS_LOCATION_ID
          );

          if (!gpsLocation) {
            logger.warn('No GPS location found for widget');
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
                clickAction="REFRESH"
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
          let weather = await weatherStore.getWeatherData(GPS_LOCATION_ID);
          const isFresh = await weatherStore.isLocationDataFresh(GPS_LOCATION_ID);

          // If no fresh data, fetch it
          if (!weather || !isFresh) {
            logger.debug('Fetching fresh data for widget:', GPS_LOCATION_ID);
            weather = await fetchForecast(
              i18n.locale,
              gpsLocation.latitude,
              gpsLocation.longitude
            );

            // Store for future use
            await weatherStore.setWeatherData(GPS_LOCATION_ID, weather);
          }

          if (weather) {
            const lastUpdateDate = new Date();
            const WidgetComponent = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];
            props.renderWidget(
              <WidgetComponent
                weather={weather}
                lastUpdated={lastUpdateDate}
                locationName={gpsLocation.name}
                width={widgetInfo.width}
                height={widgetInfo.height}
              />
            );
          } else {
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
                clickAction="REFRESH"
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
              clickAction="REFRESH"
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
      } else {
        // Handle existing Weather widget
        try {
          // Initialize database if needed (widgets run outside React context)
          // Always call initializeDatabase() directly in widget context since widgets may run in separate process
          await useForecastStore.getState().initializeDatabase();

          // Get current stores state (widgets run outside React context)
          const weatherStore = useForecastStore.getState();
          const locationStore = useLocationStore.getState();

          const gpsLocation = locationStore.savedLocations.find(
            loc => loc.id === GPS_LOCATION_ID
          );

          if (!gpsLocation) {
            logger.warn('No GPS location found for widget');
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
                clickAction="REFRESH"
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
          let weather = await weatherStore.getWeatherData(GPS_LOCATION_ID);
          const isFresh = await weatherStore.isLocationDataFresh(GPS_LOCATION_ID);

          // If no fresh data, fetch it
          if (!weather || !isFresh) {
            logger.debug('Fetching fresh data for widget:', GPS_LOCATION_ID);
            weather = await fetchForecast(
              i18n.locale,
              gpsLocation.latitude,
              gpsLocation.longitude
            );

            // Store for future use
            await weatherStore.setWeatherData(GPS_LOCATION_ID, weather);
          }

          if (weather) {
            const lastUpdateDate = new Date();
            props.renderWidget(
              <WeatherCompact
                weather={weather}
                lastUpdated={lastUpdateDate}
                locationName={gpsLocation.name}
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
                clickAction="REFRESH"
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
              clickAction="REFRESH"
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
      }
      break;

    case 'WIDGET_CLICK':
      // OPEN_APP action is handled automatically by library
      if (props.clickAction === 'REFRESH') {
        // Manual refresh from widget
        try {
          // Initialize database if needed (widgets run outside React context)
          // Always call initializeDatabase() directly in widget context since widgets may run in separate process
          await useForecastStore.getState().initializeDatabase();

          const weatherStore = useForecastStore.getState();
          const locationStore = useLocationStore.getState();

          const gpsLocation = locationStore.savedLocations.find(
            loc => loc.id === GPS_LOCATION_ID
          );

          if (gpsLocation) {
            // Show refreshing state
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
                clickAction="REFRESH"
              >
                <TextWidget
                  text="Refreshing..."
                  style={{
                    fontSize: 14,
                    color: '#E5E7EB',
                    textAlign: 'center'
                  }}
                />
              </FlexWidget>
            );

            // Perform refresh
            await weatherStore.refreshWeather(
              GPS_LOCATION_ID,
              i18n.locale,
              gpsLocation.latitude,
              gpsLocation.longitude
            );

            // Get fresh data and re-render widget
            const freshWeather = await weatherStore.getWeatherData(GPS_LOCATION_ID);
            if (freshWeather) {
              const lastUpdateDate = new Date();
              // Re-render the appropriate widget type
              const WidgetComponent = nameToWidget[props.widgetInfo.widgetName as keyof typeof nameToWidget];
              if (WidgetComponent) {
                props.renderWidget(
                  <WidgetComponent
                    weather={freshWeather}
                    lastUpdated={lastUpdateDate}
                    locationName={gpsLocation.name}
                    width={props.widgetInfo.width}
                    height={props.widgetInfo.height}
                  />
                );
                logger.debug(`${props.widgetInfo.widgetName} widget refreshed and re-rendered successfully`);
              }
            } else {
              // Handle case where refresh succeeded but data is unavailable
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
                  clickAction="REFRESH"
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
                    text="Tap to retry"
                    style={{
                      fontSize: 12,
                      color: '#9CA3AF',
                      textAlign: 'center'
                    }}
                  />
                </FlexWidget>
              );
            }
          } else {
            logger.warn('No active location found for widget refresh');
          }
        } catch (error) {
          logger.error('Manual widget refresh failed:', error);
          // Show error state with retry option
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
              clickAction="REFRESH"
            >
              <TextWidget
                text="Unable to refresh"
                style={{
                  fontSize: 14,
                  color: '#E5E7EB',
                  textAlign: 'center'
                }}
              />
              <TextWidget
                text="Tap to retry"
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  textAlign: 'center'
                }}
              />
            </FlexWidget>
          );
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