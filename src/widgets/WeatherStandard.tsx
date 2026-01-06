'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { DualTemperatureDisplay } from './components/shared/DualTemperatureDisplay';
import { WeatherIcon } from './components/shared/WeatherIcon';
import { convertWindSpeed } from '../utils/temperature';

interface WeatherStandardProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

// Helper component for hourly forecast item
const HourlyItem = ({
  forecast,
  tempScale
}: {
  forecast: any;
  tempScale: 'C' | 'F';
}) => {
  // Format time using device locale
  const timeText = new Date(forecast.dt * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate wind speed
  const { value: windSpeed, unit: windUnit } = convertWindSpeed(forecast.wind_speed, tempScale);

  return (
    <FlexWidget
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
      }}
    >
      {/* Time and Precipitation */}
      <TextWidget
        text={timeText}
        style={{
          fontSize: 10,
          color: '#E5E7EB',
          marginBottom: 2,
        }}
      />

      <TextWidget
        text={`💧 ${Math.round(forecast.pop * 100)}%`}
        style={{
          fontSize: 9,
          color: '#9CA3AF',
          marginBottom: 4,
        }}
      />

      {/* Wind Speed */}
      <TextWidget
        text={`${Math.round(windSpeed)}${windUnit}`}
        style={{
          fontSize: 9,
          color: '#9CA3AF',
          marginBottom: 4,
        }}
      />

      {/* Weather Icon */}
      <WeatherIcon
        weatherId={forecast.weather[0].id}
        size="small"
      />

      {/* Dual Temperature */}
      <DualTemperatureDisplay
        temp={forecast.temp}
        size="small"
      />
    </FlexWidget>
  );
};

export function WeatherStandard({
  weather,
  lastUpdated,
  locationName
}: WeatherStandardProps) {
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'standard'
  });

  // Get forecast items - aim for 2-3 items that fit
  const forecastItems = processedData.hourlyForecast.slice(0, 2);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#3621dcff', // palette.primaryColor
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
      }}
      clickAction="REFRESH"
    >
      {/* Hourly Forecast Items */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {forecastItems.map((forecast, index) => (
          <HourlyItem
            key={forecast.dt}
            forecast={forecast}
            tempScale={tempScale}
          />
        ))}
      </FlexWidget>

      {/* Footer */}
      <FlexWidget
        style={{
          width: 'match_parent',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <TextWidget
          text="Tap to refresh"
          style={{
            fontSize: 9,
            color: '#6B7280',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}