'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Weather } from '../types/WeatherTypes';
import { processWidgetData } from './components/shared/BaseWeatherWidget';
import { DualTemperatureDisplay } from './components/shared/DualTemperatureDisplay';
import { WeatherIcon } from './components/shared/WeatherIcon';

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
  const { processedData } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: 'extended'
  });

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#3621dcff', // palette.primaryColor
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      clickAction="REFRESH"
    >
      {/* Horizontal layout matching CurrentWeatherCard: icon left, temp right */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Weather Icon on left */}
        <WeatherIcon 
          weatherId={processedData.weatherId} 
          size="large" 
        />
        
        {/* Weather Description and Dual Temperature on right */}
        <FlexWidget 
          style={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            marginLeft: 16,
          }}
        >
          <TextWidget
            text={processedData.description.charAt(0).toUpperCase() + processedData.description.slice(1)}
            style={{
              fontSize: 14,
              color: '#E5E7EB',
              marginBottom: 8,
            }}
          />
          <DualTemperatureDisplay 
            temp={processedData.temp}
            size="large"
          />
        </FlexWidget>
      </FlexWidget>

      {/* Footer */}
      <FlexWidget
        style={{
          width: 'match_parent',
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <TextWidget
          text="Tap to refresh"
          style={{
            fontSize: 10,
            color: '#6B7280',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherExtended;