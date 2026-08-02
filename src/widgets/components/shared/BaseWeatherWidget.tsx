'use no memo';
import { processWeatherData, getWeatherIcon } from '../../utils/widgetDataUtils';
import { Weather } from '../../../types/WeatherTypes';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getLayoutConfig, getActualDimensions, WidgetSize } from '../../utils/widgetLayoutUtils';
import { formatTime } from '../../../utils/dateFormatting';

interface BaseWeatherWidgetProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  size: WidgetSize;
  widgetName?: string; // NEW: Optional widget name for dimension-aware processing
}

/**
 * Function that processes weather data for widgets
 * Returns processed data and layout configuration
 * Note: Widgets run outside React context, so we get store state directly
 */
export const processWidgetData = ({
  weather,
  lastUpdated,
  locationName: originalLocationName,
  size,
  widgetName
}: BaseWeatherWidgetProps) => {
  // Get user's temperature scale + clock-format preference (direct store access;
  // the settings store is hydrated in the widget context by the hydration gate).
  const { tempScale, clockFormat } = useSettingsStore.getState();

  // Process weather data
  const processedData = processWeatherData(weather, tempScale);
  const layout = getLayoutConfig(size);

  // Format last updated time, honoring the user's clock-format preference.
  const lastUpdatedText = formatTime(
    Math.floor(new Date(lastUpdated).getTime() / 1000),
    clockFormat
  );

  // Get actual widget dimensions if widget name is provided
  const dimensions = widgetName ? getActualDimensions(widgetName) : null;

  return {
    processedData,
    layout,
    lastUpdatedText,
    locationName: originalLocationName,
    weatherIcon: getWeatherIcon(processedData.weatherId),
    tempScale,
    dimensions, // NEW: Pass actual dimensions back to widgets
    widgetName, // NEW: Pass widget name for reference
  };
};

export default processWidgetData;