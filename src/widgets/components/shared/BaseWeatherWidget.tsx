'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { processWeatherData, getWeatherIcon } from '../../utils/widgetDataUtils';
import { Weather } from '../../../types/WeatherTypes';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getLayoutConfig, WidgetSize } from '../../utils/widgetLayoutUtils';

interface BaseWeatherWidgetProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  size: WidgetSize;
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
  size
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

  return {
    processedData,
    layout,
    lastUpdatedText,
    locationName: originalLocationName,
    weatherIcon: getWeatherIcon(processedData.weatherId),
    tempScale,
  };
};

export default processWidgetData;