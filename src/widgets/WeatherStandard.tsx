'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { TemperatureDisplay } from './components/shared/TemperatureDisplay';
import { WeatherMetrics } from './components/shared/WeatherMetrics';
import { WeatherIcon } from './components/shared/WeatherIcon';
import { ForecastRow } from './components/shared/ForecastRow';

interface WeatherStandardProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

export function WeatherStandard({
  weather,
  lastUpdated,
  locationName
}: WeatherStandardProps) {
  const { processedData, layout, lastUpdatedText, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'standard'
  });

  // Get first 2 hourly forecast items
  const forecastItems = processedData.hourlyForecast.slice(0, 2);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1C1B4D',
        borderRadius: 16,
        padding: layout.spacing.padding,
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
          text={locationName}
          style={{
            fontSize: layout.fonts.location,
            color: '#E5E7EB', // 80% white
          }}
        />
        <TextWidget
          text={`Updated: ${lastUpdatedText}`}
          style={{
            fontSize: layout.fonts.smallText,
            color: '#9CA3AF', // 60% white
          }}
        />
      </FlexWidget>

      {/* Current weather section */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <TextWidget
            text={processedData.description.charAt(0).toUpperCase() + processedData.description.slice(1)}
            style={{
              fontSize: layout.fonts.text,
              color: '#E5E7EB', // 80% white
              marginBottom: layout.spacing.small,
            }}
          />
          <TemperatureDisplay 
            temp={processedData.temp}
            scale={tempScale}
            size="medium"
          />
        </FlexWidget>
        
        <WeatherIcon weatherId={processedData.weatherId} size="large" />
      </FlexWidget>

      {/* Weather metrics */}
      <WeatherMetrics
        humidity={processedData.humidity}
        windSpeed={processedData.windSpeed.value}
        tempScale={tempScale}
        size="medium"
      />

      {/* Mini forecast */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}
      >
        {forecastItems.map((forecast, index) => (
          <ForecastRow
            key={forecast.dt}
            forecast={forecast}
            tempScale={tempScale}
            size="small"
          />
        ))}
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
            fontSize: layout.fonts.smallText,
            color: '#6B7280', // 40% white
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherStandard;