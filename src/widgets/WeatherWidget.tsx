'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';

interface WeatherWidgetProps {
  weather: Weather;
  lastUpdated: Date;
  locationName?: string;
}

export function WeatherWidget({
  weather,
  lastUpdated,
  locationName
}: WeatherWidgetProps) {
  // Hardcode temp scale for now
  const tempScale = 'C';
  const temp = Math.round(weather.current.temp);
  const description = weather.current.weather[0].description;
  const locationText = locationName || 'Current Location';
  const lastUpdatedText = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1C1B4D', // Match app theme
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
      clickAction="REFRESH"
    >
      {/* Header with location and last updated */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        <TextWidget
          text={locationText}
          style={{
            fontSize: 12,
            color: '#E5E7EB', // 80% white
            fontWeight: '500'
          }}
        />
        <TextWidget
          text={`Updated: ${lastUpdatedText}`}
          style={{
            fontSize: 10,
            color: '#9CA3AF' // 60% white
          }}
        />
      </FlexWidget>

      {/* Current weather */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        <TextWidget
          text={`${temp}°${tempScale}`}
          style={{
            fontSize: 32,
            color: '#FFFFFF',
            fontWeight: '300'
          }}
        />
        <TextWidget
          text={description.charAt(0).toUpperCase() + description.slice(1)}
          style={{
            fontSize: 14,
            color: '#E5E7EB' // 80% white
          }}
        />
      </FlexWidget>

      {/* Weather details */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <TextWidget
          text={`💧 ${weather.current.humidity}%`}
          style={{
            fontSize: 11,
            color: '#D1D5DB' // 70% white
          }}
        />
        <TextWidget
          text={`💨 ${Math.round(weather.current.wind_speed * 3.6)} km/h`}
          style={{
            fontSize: 11,
            color: '#D1D5DB' // 70% white
          }}
        />
      </FlexWidget>

      {/* Footer */}
      <FlexWidget
        style={{
          width: 'match_parent',
          alignItems: 'center'
        }}
      >
        <TextWidget
          text="Tap to refresh"
          style={{
            fontSize: 10,
            color: '#6B7280' // 40% white
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherWidget;