import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WeatherCompact } from './WeatherCompact';
import { WeatherStandard } from './WeatherStandard';
import { WeatherExtended } from './WeatherExtended';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { useLocationStore, GPS_LOCATION_ID } from '../store/useLocationStore';
import { useForecastStore } from '../store/useForecastStore';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import { fetchForecast } from '../utils/fetchWeather';
import { palette } from '../styles/Palette';
import type { Weather } from '../types/WeatherTypes';

const nameToWidget = {
  WeatherCompact: WeatherCompact,
  WeatherStandard: WeatherStandard,
  WeatherExtended: WeatherExtended,
};

type WidgetName = keyof typeof nameToWidget;

// Shared styles for fallback/error widgets
const fallbackContainerStyle = {
  height: 'match_parent' as const,
  width: 'match_parent' as const,
  backgroundColor: palette.primaryDark,
  borderRadius: 16,
  padding: 16,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

const fallbackTitleStyle = {
  fontSize: 14,
  color: palette.highlightColor,
  textAlign: 'center' as const,
};

const fallbackSubtitleStyle = {
  fontSize: 12,
  color: palette.textColorSecondary,
  textAlign: 'center' as const,
};

/**
 * Renders a fallback widget with title and subtitle
 */
function renderFallbackWidget(
  renderWidget: WidgetTaskHandlerProps['renderWidget'],
  title: string,
  subtitle: string
): void {
  renderWidget(
    <FlexWidget style={fallbackContainerStyle} clickAction="REFRESH">
      <TextWidget text={title} style={fallbackTitleStyle} />
      <TextWidget text={subtitle} style={fallbackSubtitleStyle} />
    </FlexWidget>
  );
}

/**
 * Renders a loading/refreshing widget
 */
function renderLoadingWidget(
  renderWidget: WidgetTaskHandlerProps['renderWidget'],
  message: string
): void {
  renderWidget(
    <FlexWidget style={fallbackContainerStyle} clickAction="REFRESH">
      <TextWidget text={message} style={fallbackTitleStyle} />
    </FlexWidget>
  );
}

interface WidgetRenderContext {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width: number;
  height: number;
}

/**
 * Renders the appropriate widget component based on widget name
 */
function renderWeatherWidgetComponent(
  renderWidget: WidgetTaskHandlerProps['renderWidget'],
  widgetName: WidgetName,
  context: WidgetRenderContext
): void {
  const WidgetComponent = nameToWidget[widgetName];

  renderWidget(
    <WidgetComponent
      weather={context.weather}
      lastUpdated={context.lastUpdated}
      locationName={context.locationName}
      width={context.width}
      height={context.height}
    />
  );
}

interface FetchWeatherResult {
  weather: Weather | null;
  locationName: string;
  error?: Error;
}

/**
 * Fetches weather data for the GPS location, using cache when fresh
 */
async function fetchWeatherForWidget(): Promise<FetchWeatherResult> {
  // Initialize database (widgets run outside React context)
  await useForecastStore.getState().initializeDatabase();

  const weatherStore = useForecastStore.getState();
  const locationStore = useLocationStore.getState();

  const gpsLocation = locationStore.savedLocations.find(
    loc => loc.id === GPS_LOCATION_ID
  );

  if (!gpsLocation) {
    return { weather: null, locationName: '', error: new Error('No GPS location found') };
  }

  // Check if we have fresh cached data
  let weather = await weatherStore.getWeatherData(GPS_LOCATION_ID);
  const isFresh = await weatherStore.isLocationDataFresh(GPS_LOCATION_ID);

  // Fetch fresh data if needed
  if (!weather || !isFresh) {
    logger.debug('Fetching fresh data for widget:', GPS_LOCATION_ID);
    weather = await fetchForecast(
      i18n.locale,
      gpsLocation.latitude,
      gpsLocation.longitude
    );

    // Store for future use
    if (weather) {
      await weatherStore.setWeatherData(GPS_LOCATION_ID, weather);
    }
  }

  return { weather, locationName: gpsLocation.name };
}

/**
 * Handles widget rendering with weather data fetching
 */
async function handleWidgetRender(
  props: WidgetTaskHandlerProps,
  widgetName: WidgetName
): Promise<void> {
  try {
    const { weather, locationName, error } = await fetchWeatherForWidget();

    if (error || !weather) {
      logger.warn('No weather data available for widget:', error?.message);
      renderFallbackWidget(props.renderWidget, 'Weather data unavailable', 'Tap to open app');
      return;
    }

    renderWeatherWidgetComponent(props.renderWidget, widgetName, {
      weather,
      lastUpdated: new Date(),
      locationName,
      width: props.widgetInfo.width,
      height: props.widgetInfo.height,
    });
  } catch (error) {
    logger.error('Widget render failed:', error);
    renderFallbackWidget(props.renderWidget, 'Unable to load weather', 'Tap to open app');
  }
}

/**
 * Handles manual refresh from widget tap
 */
async function handleWidgetRefresh(props: WidgetTaskHandlerProps): Promise<void> {
  try {
    // Initialize database
    await useForecastStore.getState().initializeDatabase();

    const weatherStore = useForecastStore.getState();
    const locationStore = useLocationStore.getState();

    const gpsLocation = locationStore.savedLocations.find(
      loc => loc.id === GPS_LOCATION_ID
    );

    if (!gpsLocation) {
      logger.warn('No active location found for widget refresh');
      renderFallbackWidget(props.renderWidget, 'Weather data unavailable', 'Tap to retry');
      return;
    }

    // Show refreshing state
    renderLoadingWidget(props.renderWidget, 'Refreshing...');

    // Perform refresh
    await weatherStore.refreshWeather(
      GPS_LOCATION_ID,
      i18n.locale,
      gpsLocation.latitude,
      gpsLocation.longitude
    );

    // Get fresh data and re-render widget
    const freshWeather = await weatherStore.getWeatherData(GPS_LOCATION_ID);

    if (!freshWeather) {
      renderFallbackWidget(props.renderWidget, 'Weather data unavailable', 'Tap to retry');
      return;
    }

    const widgetName = props.widgetInfo.widgetName as WidgetName;
    if (nameToWidget[widgetName]) {
      renderWeatherWidgetComponent(props.renderWidget, widgetName, {
        weather: freshWeather,
        lastUpdated: new Date(),
        locationName: gpsLocation.name,
        width: props.widgetInfo.width,
        height: props.widgetInfo.height,
      });
      logger.debug(`${widgetName} widget refreshed and re-rendered successfully`);
    }
  } catch (error) {
    logger.error('Manual widget refresh failed:', error);
    renderFallbackWidget(props.renderWidget, 'Unable to refresh', 'Tap to retry');
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName as WidgetName;

  logger.debug(`Widget action: ${props.widgetAction}, widget name: ${widgetName}`);

  const Widget = nameToWidget[widgetName];

  if (!Widget) {
    logger.error(`No widget found with name: ${widgetName}`);
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      logger.debug(`Handling ${widgetName} widget addition`);
      await handleWidgetRender(props, widgetName);
      break;

    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      logger.debug(`Handling ${widgetName} widget update/resize`);
      await handleWidgetRender(props, widgetName);
      break;

    case 'WIDGET_CLICK':
      // OPEN_APP action is handled automatically by library
      if (props.clickAction === 'REFRESH') {
        await handleWidgetRefresh(props);
      }
      break;

    case 'WIDGET_DELETED':
      // No cleanup needed - data stays in store
      break;

    default:
      break;
  }
}
