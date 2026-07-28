import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WeatherCompact } from './WeatherCompact';
import { WeatherStandard } from './WeatherStandard';
import { WeatherExtended } from './WeatherExtended';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { useLocationStore, GPS_LOCATION_ID, type SavedLocation } from '../store/useLocationStore';
import { useForecastStore } from '../store/useForecastStore';
import { i18n } from '../localization/i18n';
import { logger } from '../utils/logger';
import { fetchForecast } from '../utils/fetchWeather';
import { ensureStoresHydrated } from './widgetUpdater';
import { NoConnectionError } from '../utils/errors';
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

/**
 * Renders the weather widget matching props.widgetInfo.widgetName with the given
 * data. This is the single funnel every success / cached-fallback path goes
 * through, so those paths can't drift apart. Returns false (rendering nothing)
 * if the widget name is unknown.
 */
function renderWidgetWithData(
  props: WidgetTaskHandlerProps,
  weather: Weather,
  locationName: string,
  dataAge: number | undefined
): boolean {
  const widgetName = props.widgetInfo.widgetName as WidgetName;
  const WidgetComponent = nameToWidget[widgetName];

  if (!WidgetComponent) {
    return false;
  }

  props.renderWidget(
    <WidgetComponent
      weather={weather}
      lastUpdated={new Date()}
      locationName={locationName}
      width={props.widgetInfo.width}
      height={props.widgetInfo.height}
      dataAge={dataAge}
    />
  );
  return true;
}

/**
 * Looks up the persisted GPS location. If it's missing — a genuine no-location
 * state, since callers hydrate the stores first — reports it once (per-event
 * `flow` tag) and renders the retry fallback, returning null so the caller bails.
 */
function getGpsLocationOrWarn(
  props: WidgetTaskHandlerProps
): SavedLocation | null {
  const gpsLocation = useLocationStore
    .getState()
    .savedLocations.find((loc) => loc.id === GPS_LOCATION_ID);

  if (!gpsLocation) {
    logger.exception('Widget refresh: no GPS location found', {
      tags: { error_type: 'widget_refresh_no_location', flow: 'widget_refresh' },
      extra: { widgetName: props.widgetInfo.widgetName, locationId: GPS_LOCATION_ID },
      level: 'warning',
    });
    renderFallbackWidget(props.renderWidget, i18n.t('WidgetUnavailable'), i18n.t('WidgetTapToRetry'));
    return null;
  }

  return gpsLocation;
}

interface FetchWeatherResult {
  weather: Weather | null;
  locationName: string;
  dataAge: number | null; // Age in minutes
  error?: Error;
}

/**
 * Fetches weather data for the GPS location, using cache when fresh
 * Falls back to stale cached data if fetch fails
 */
async function fetchWeatherForWidget(): Promise<FetchWeatherResult> {
  // Hydrate persisted stores before reading savedLocations / i18n.locale — the
  // headless task starts before Zustand's async rehydration completes.
  await ensureStoresHydrated();

  // Initialize database (widgets run outside React context)
  await useForecastStore.getState().initializeDatabase();

  const weatherStore = useForecastStore.getState();
  const locationStore = useLocationStore.getState();

  const gpsLocation = locationStore.savedLocations.find(
    loc => loc.id === GPS_LOCATION_ID
  );

  if (!gpsLocation) {
    return { weather: null, locationName: '', dataAge: null, error: new Error('No GPS location found') };
  }

  // Get weather data with age for fallback logic
  const { weather: cachedWeather, ageMinutes } = await weatherStore.getWeatherDataWithAge(GPS_LOCATION_ID);
  const isFresh = await weatherStore.isLocationDataFresh(GPS_LOCATION_ID);

  let weather = cachedWeather;
  let dataAge = ageMinutes;

  // If data is stale or missing, try to fetch fresh data
  if (!isFresh) {
    try {
      logger.debug('Fetching fresh data for widget:', GPS_LOCATION_ID);
      const freshWeather = await fetchForecast(
        i18n.locale,
        gpsLocation.latitude,
        gpsLocation.longitude
      );

      // Store and use fresh data
      await weatherStore.setWeatherData(GPS_LOCATION_ID, freshWeather);
      weather = freshWeather;
      dataAge = 0; // Fresh data
    } catch (fetchError) {
      logger.warn('Failed to fetch fresh data, using cached data if available:', fetchError);
      // Keep using cached data (weather and dataAge already set)
      // Don't return error if we have cached data to fall back to
    }
  }

  return {
    weather,
    locationName: gpsLocation.name,
    dataAge,
    error: !weather ? new Error('No weather data available') : undefined
  };
}

/**
 * Handles widget rendering with weather data fetching
 */
async function handleWidgetRender(
  props: WidgetTaskHandlerProps
): Promise<void> {
  try {
    const { weather, locationName, dataAge, error } = await fetchWeatherForWidget();

    if (error || !weather) {
      logger.warn('No weather data available for widget:', error?.message);
      renderFallbackWidget(props.renderWidget, i18n.t('WidgetUnavailable'), i18n.t('WidgetTapToRetry'));
      return;
    }

    renderWidgetWithData(
      props,
      weather,
      locationName,
      dataAge !== null ? dataAge : undefined
    );
  } catch (error) {
    logger.error('Widget render failed:', error);
    renderFallbackWidget(props.renderWidget, i18n.t('WidgetLoadError'), i18n.t('WidgetTapToRetry'));
  }
}

/**
 * Handles manual refresh from widget tap
 */
async function handleWidgetRefresh(props: WidgetTaskHandlerProps): Promise<void> {
  // Breadcrumb: confirms the tap actually reached the headless JS task. This is
  // the decisive signal when debugging "widget not updating on click" — if this
  // never shows up (in logcat on a dev build, or as a breadcrumb on a Sentry
  // event), the click is being dropped before JS, not in our refresh logic.
  // NOTE: logger.debug is stripped in production builds, so use logger.info here
  // (it always records a Sentry breadcrumb) rather than logger.debug.
  logger.info('Widget refresh triggered (click reached headless task)', {
    widgetName: props.widgetInfo.widgetName,
    widgetId: props.widgetInfo.widgetId,
  });

  try {
    // Hydrate persisted stores before reading savedLocations / i18n.locale — the
    // headless task starts before Zustand's async rehydration completes, so
    // reading them first produces a false "no location" alarm (finding 5).
    await ensureStoresHydrated();

    // Initialize database
    await useForecastStore.getState().initializeDatabase();

    const weatherStore = useForecastStore.getState();

    const gpsLocation = getGpsLocationOrWarn(props);
    if (!gpsLocation) {
      return;
    }

    // Show refreshing state
    renderLoadingWidget(props.renderWidget, i18n.t('WidgetRefreshing'));

    // Try to perform refresh
    let refreshSucceeded = false;
    try {
      await weatherStore.refreshWeather(
        GPS_LOCATION_ID,
        i18n.locale,
        gpsLocation.latitude,
        gpsLocation.longitude
      );
      refreshSucceeded = true;
    } catch (refreshError) {
      // Always leave a breadcrumb — this is the silent failure behind "tap does
      // nothing visible" (fetch failed, we fall back to cached/unchanged data).
      logger.warn('Widget refresh fetch failed; falling back to cached data:', refreshError);

      // Offline is an expected, recoverable state (we render cached data), so it
      // must not become a Sentry event. Only report genuinely unexpected
      // refresh failures (finding 3b).
      if (!(refreshError instanceof NoConnectionError)) {
        logger.exception(
          refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
          {
            tags: { error_type: 'widget_refresh_failed', flow: 'widget_refresh' },
            extra: { widgetName: props.widgetInfo.widgetName, locationId: GPS_LOCATION_ID },
            level: 'warning',
          }
        );
      }
    }

    // Get weather data with age (fresh if refresh succeeded, or cached)
    const { weather, ageMinutes } = await weatherStore.getWeatherDataWithAge(GPS_LOCATION_ID);

    if (!weather) {
      logger.exception('Widget refresh: no weather data available after refresh', {
        tags: { error_type: 'widget_refresh_no_data', flow: 'widget_refresh' },
        extra: {
          widgetName: props.widgetInfo.widgetName,
          locationId: GPS_LOCATION_ID,
          refreshSucceeded,
        },
        level: 'warning',
      });
      renderFallbackWidget(props.renderWidget, i18n.t('WidgetUnavailable'), i18n.t('WidgetTapToRetry'));
      return;
    }

    const dataAge = refreshSucceeded
      ? 0
      : ageMinutes !== null
        ? ageMinutes
        : undefined;
    if (renderWidgetWithData(props, weather, gpsLocation.name, dataAge)) {
      logger.debug(
        refreshSucceeded
          ? `${props.widgetInfo.widgetName} widget refreshed successfully`
          : `${props.widgetInfo.widgetName} widget showing cached data after refresh failure`
      );
    }
  } catch (error) {
    logger.exception(
      error instanceof Error ? error : new Error(String(error)),
      {
        tags: { error_type: 'widget_refresh_unexpected', flow: 'widget_refresh' },
        extra: { widgetName: props.widgetInfo.widgetName, locationId: GPS_LOCATION_ID },
      }
    );

    // Try to render with cached data before showing error
    try {
      const weatherStore = useForecastStore.getState();
      const { weather, ageMinutes } = await weatherStore.getWeatherDataWithAge(GPS_LOCATION_ID);

      if (weather) {
        const locationStore = useLocationStore.getState();
        const gpsLocation = locationStore.savedLocations.find(loc => loc.id === GPS_LOCATION_ID);

        if (gpsLocation) {
          const dataAge = ageMinutes !== null ? ageMinutes : undefined;
          if (renderWidgetWithData(props, weather, gpsLocation.name, dataAge)) {
            logger.debug('Rendered widget with cached data after error');
            return;
          }
        }
      }
    } catch (fallbackError) {
      logger.error('Fallback to cached data also failed:', fallbackError);
    }

    // Final fallback: show error
    renderFallbackWidget(props.renderWidget, i18n.t('WidgetRefreshError'), i18n.t('WidgetTapToRetry'));
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName as WidgetName;

  logger.debug(`Widget action: ${props.widgetAction}, widget name: ${widgetName}`);

  const Widget = nameToWidget[widgetName];

  try {
    // Inside the try so the report this emits is flushed too — it is the one
    // path that reports without doing any work afterwards to keep the task alive.
    if (!Widget) {
      logger.error(`No widget found with name: ${widgetName}`);
      return;
    }

    switch (props.widgetAction) {
      case 'WIDGET_ADDED':
        logger.debug(`Handling ${widgetName} widget addition`);
        await handleWidgetRender(props);
        break;

      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED':
        logger.debug(`Handling ${widgetName} widget update/resize`);
        await handleWidgetRender(props);
        break;

      case 'WIDGET_CLICK':
        // Breadcrumb at the dispatch point: records that a click was delivered to
        // JS and what clickAction came with it. If clicks "do nothing", check
        // whether this shows clickAction !== 'REFRESH' (wiring/library mismatch).
        logger.info('Widget click received', {
          widgetName,
          clickAction: props.clickAction,
        });
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
  } finally {
    // Android kills the headless JS task as soon as this handler resolves, so
    // anything the handlers just captured has to be on the wire before we
    // return — otherwise widget failures, the hardest ones to reproduce by
    // hand, are also the ones least likely to reach Sentry. Never throws.
    await logger.flush();
  }
}
