'use no memo';
import { processWeatherData, getWeatherIcon } from '../../utils/widgetDataUtils';
import { Weather } from '../../../types/WeatherTypes';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getLayoutConfig, getActualDimensions, WidgetSize } from '../../utils/widgetLayoutUtils';

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
  // Get user's temperature scale preference (direct store access)
  const tempScale = useSettingsStore.getState().tempScale;
  
  // Process weather data
  const processedData = processWeatherData(weather, tempScale);
  const layout = getLayoutConfig(size);
  
  // Format last updated time
  const lastUpdatedText = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

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