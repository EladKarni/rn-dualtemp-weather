'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { TemperatureDisplay } from './components/shared/TemperatureDisplay';
import { WeatherMetrics } from './components/shared/WeatherMetrics';
import { WeatherIcon } from './components/shared/WeatherIcon';
import { ForecastRow } from './components/shared/ForecastRow';
import { formatDayName } from '../utils/dateFormatting';

interface WeatherExtendedProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

export function WeatherExtended({
  weather,
  lastUpdated,
  locationName
}: WeatherExtendedProps) {
  const { processedData, layout, lastUpdatedText, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'extended'
  });

  // Get forecast data
  const hourlyForecast = processedData.hourlyForecast.slice(0, 6); // 6 hours
  const dailyForecast = processedData.dailyForecast.slice(0, 3); // 3 days

  // Format sunrise/sunset times
  const sunriseTime = new Date(processedData.sunrise * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunsetTime = new Date(processedData.sunset * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

      {/* Current weather - similar to todayWeatherCard */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: layout.spacing.margin,
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
            size="large"
          />
        </FlexWidget>
        
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <WeatherIcon weatherId={processedData.weatherId} size="large" />
          <FlexWidget
            style={{
              flexDirection: 'row',
              marginTop: layout.spacing.small,
            }}
          >
            <TextWidget
              text={`☀️ ${sunriseTime}`}
              style={{
                fontSize: layout.fonts.smallText,
                color: '#E5E7EB',
                marginRight: layout.spacing.margin,
              }}
            />
            <TextWidget
              text={`🌅 ${sunsetTime}`}
              style={{
                fontSize: layout.fonts.smallText,
                color: '#E5E7EB',
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Weather metrics */}
      <WeatherMetrics
        humidity={processedData.humidity}
        windSpeed={processedData.windSpeed.value}
        tempScale={tempScale}
        size="extended"
      />

      {/* Additional metrics row */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <TextWidget
          text={`🔵 ${processedData.pressure} hPa`}
          style={{
            fontSize: layout.fonts.metrics,
            color: '#D1D5DB',
          }}
        />
        <TextWidget
          text={`☀️ ${processedData.uvi}`}
          style={{
            fontSize: layout.fonts.metrics,
            color: '#D1D5DB',
          }}
        />
        <TextWidget
          text={`☁️ ${processedData.cloudCover}%`}
          style={{
            fontSize: layout.fonts.metrics,
            color: '#D1D5DB',
          }}
        />
      </FlexWidget>

      {/* 6-hour forecast */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'column'
        }}
      >
        <TextWidget
          text="Hourly Forecast"
          style={{
            fontSize: layout.fonts.smallText,
            color: '#9CA3AF',
            marginBottom: layout.spacing.margin,
          }}
        />
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          {hourlyForecast.map((forecast, index) => (
            <ForecastRow
              key={forecast.dt}
              forecast={forecast}
              tempScale={tempScale}
              size="small"
            />
          ))}
        </FlexWidget>
      </FlexWidget>

      {/* 3-day forecast - similar to DailyForecastItem style */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'column'
        }}
      >
        <TextWidget
          text="3-Day Forecast"
          style={{
            fontSize: layout.fonts.smallText,
            color: '#9CA3AF',
            marginBottom: layout.spacing.margin,
          }}
        />
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          {dailyForecast.map((day, index) => (
            <FlexWidget
              key={day.dt}
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: layout.spacing.margin,
                flex: 1,
                marginHorizontal: index > 0 ? layout.spacing.small : 0,
              }}
            >
              <TextWidget
                text={formatDayName(day.dt)}
                style={{
                  fontSize: layout.fonts.smallText,
                  color: '#E5E7EB',
                  marginBottom: layout.spacing.small,
                }}
              />
              <WeatherIcon weatherId={day.weather[0].id} size="medium" />
              <TextWidget
                text={`${Math.round(day.temp.day)}°`}
                style={{
                  fontSize: layout.fonts.text,
                  color: '#FFFFFF',
                  marginTop: layout.spacing.small,
                }}
              />
              <TextWidget
                text={`💧 ${Math.round(day.pop * 100)}%`}
                style={{
                  fontSize: layout.fonts.smallText,
                  color: '#9CA3AF',
                  marginTop: layout.spacing.small,
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
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

export default WeatherExtended;