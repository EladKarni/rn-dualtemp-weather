'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { getActualDimensions, calculateOptimalFontSize } from './utils/widgetLayoutUtils';
import { formatTemperature } from '../utils/temperature';

interface WeatherCompactProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

// Helper function to format temperature for abbreviation
const formatTempForAbbreviation = (temp: number, scale: 'C' | 'F'): string => {
  const value = Math.round(temp);
  const unit = scale === 'F' ? '°F' : '°C';

  // Handle very long temperatures (like -15°F or -26°C)
  if (Math.abs(value) >= 100) {
    return `${value}${unit}`; // No abbreviation for 3+ digit temps
  }

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

  // Get actual dimensions to ensure true 1x1 layout
  const dimensions = getActualDimensions('WeatherCompact');

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
        backgroundColor: '#3621dcff', // palette.primaryColor - matches app theme
        borderRadius: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: getActualDimensions('WeatherCompact').width === 1 && getActualDimensions('WeatherCompact').height === 1 ? 4 : 8, // Minimal padding for true 1x1
      }}
      clickAction="REFRESH"
    >
      {/* Stacked Temperature Layout - Primary prominent, secondary supporting */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Primary Temperature - User's preferred scale, more prominent */}
        <TextWidget
          text={primaryTemp}
          style={{
            fontSize: calculateOptimalFontSize('WeatherCompact', 'primary-temp'),        // Optimized for 1x1 space
            color: '#FFFFFF',    // White for primary text - matches app theme
            fontWeight: 'bold',     // Prominent weight
            textAlign: 'center',
            marginBottom: 1,      // Small gap to slash
          }}
        />

        {/* Slash Separator */}
        <TextWidget
          text="/"
          style={{
            fontSize: calculateOptimalFontSize('WeatherCompact', 'slash'),        // Optimized for 1x1
            color: '#E5E7EB',    // Light gray - subtle contrast
            textAlign: 'center',
            marginVertical: 1    // Small vertical spacing
          }}
        />

        {/* Secondary Temperature */}
        <TextWidget
          text={secondaryTemp}
          style={{
            fontSize: calculateOptimalFontSize('WeatherCompact', 'secondary-temp'),        // Optimized for 1x1
            color: '#E5E7EB',    // Light gray - supporting color
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherCompact;