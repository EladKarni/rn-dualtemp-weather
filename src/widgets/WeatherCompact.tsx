'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { getActualDimensions, calculateOptimalFontSize } from './utils/widgetLayoutUtils';
import { celsiusToFahrenheit } from '../utils/temperature';
import { WeatherIcon } from './components/shared/WeatherIcon';
import { palette } from '../styles/Palette';

interface WeatherCompactProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Optional: Widget width in pixels (unused, but accepted for compatibility)
  height?: number;  // Optional: Widget height in pixels (unused, but accepted for compatibility)
}

// Helper function to format temperature with conversion (input is Celsius)
const formatTempForAbbreviation = (tempCelsius: number, scale: 'C' | 'F'): string => {
  const value = scale === 'F'
    ? Math.round(celsiusToFahrenheit(tempCelsius))
    : Math.round(tempCelsius);
  const unit = scale === 'F' ? '°F' : '°C';

  return `${value}${unit}`;
};

export function WeatherCompact({
  weather,
  lastUpdated,
  locationName
}: WeatherCompactProps) {
  // Use dimension-aware processing for true 1x1 behavior
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'compact',
    widgetName: 'WeatherCompact' // Pass widget name for dimension-aware processing
  });

  // Determine user's preferred scale for primary display
  const primaryScale = tempScale;
  const secondaryScale = primaryScale === 'F' ? 'C' : 'F';

  // Format temperatures for 1x1 space (abbreviated)
  const primaryTemp = formatTempForAbbreviation(processedData.temp, primaryScale);
  const secondaryTemp = formatTempForAbbreviation(processedData.temp, secondaryScale);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.primaryColor,
        borderRadius: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: getActualDimensions('WeatherCompact').width === 1 && getActualDimensions('WeatherCompact').height === 1 ? 4 : 8,
      }}
      clickAction="REFRESH"
    >
      {/* Primary Temperature - User's preferred scale, prominent at top */}
      <TextWidget
        text={primaryTemp}
        style={{
          fontSize: calculateOptimalFontSize('WeatherCompact', 'primary-temp'),
          color: palette.textColor,
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      />

      {/* Weather Icon - Visual divider in center */}
      <WeatherIcon weatherId={processedData.weatherId} size="small" />

      {/* Secondary Temperature - Supporting scale at bottom */}
      <TextWidget
        text={secondaryTemp}
        style={{
          fontSize: calculateOptimalFontSize('WeatherCompact', 'secondary-temp'),
          color: palette.highlightColor,
          textAlign: 'center',
        }}
      />
    </FlexWidget>
  );
}

export default WeatherCompact;