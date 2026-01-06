'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { TemperatureDisplay } from './components/shared/TemperatureDisplay';
import { WeatherIcon } from './components/shared/WeatherIcon';

interface WeatherCompactProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

export function WeatherCompact({
  weather,
  lastUpdated,
  locationName
}: WeatherCompactProps) {
  const { processedData, layout, weatherIcon, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'compact'
  });

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1C1B4D',
        borderRadius: 16,
        padding: layout.spacing.padding,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      clickAction="REFRESH"
    >
      {/* Weather Icon */}
      <WeatherIcon weatherId={processedData.weatherId} size="large" />

      {/* Temperature */}
      <FlexWidget style={{ marginTop: layout.spacing.margin }}>
        <TemperatureDisplay 
          temp={processedData.temp}
          scale={tempScale}
          size="small"
        />
      </FlexWidget>

      {/* Location (abbreviated if needed) */}
      <TextWidget
        text={locationName.length > 12 ? locationName.substring(0, 10) + '...' : locationName}
        style={{
          fontSize: layout.fonts.location,
          color: '#E5E7EB',
          textAlign: 'center',
          marginTop: layout.spacing.small,
        }}
      />
    </FlexWidget>
  );
}

export default WeatherCompact;