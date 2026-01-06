'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetSize } from '../../utils/widgetLayoutUtils';

interface WeatherIconProps {
  weatherId: number;
  size: 'small' | 'medium' | 'large';
}

const getIconSize = (size: WeatherIconProps['size']): number => {
  switch (size) {
    case 'small': return 16;
    case 'medium': return 24;
    case 'large': return 32;
    default: return 24;
  }
};

export const WeatherIcon: React.FC<WeatherIconProps> = ({ weatherId, size }) => {
  const iconMap: Record<number, string> = {
    // Clear sky
    800: '☀️',
    // Few clouds
    801: '⛅',
    // Scattered clouds
    802: '☁️',
    // Broken clouds
    803: '☁️',
    // Overcast clouds
    804: '☁️',
    // Rain
    500: '🌦️',
    501: '🌧️',
    502: '🌧️',
    503: '🌧️',
    504: '🌧️',
    // Drizzle
    300: '🌦️',
    301: '🌦️',
    302: '🌦️',
    313: '🌦️',
    314: '🌦️',
    321: '🌦️',
    // Thunderstorm
    200: '⛈️',
    201: '⛈️',
    202: '⛈️',
    210: '⛈️',
    211: '⛈️',
    212: '⛈️',
    221: '⛈️',
    230: '⛈️',
    231: '⛈️',
    232: '⛈️',
    // Snow
    600: '🌨️',
    601: '🌨️',
    602: '❄️',
    611: '🌨️',
    612: '🌨️',
    613: '🌨️',
    615: '❄️',
    616: '❄️',
    620: '🌨️',
    621: '🌨️',
    622: '❄️',
    // Atmosphere
    701: '🌫️',
    711: '🌫️',
    721: '🌫️',
    731: '🌪️',
    741: '🌫️',
    751: '🌫️',
    761: '🌪️',
    762: '🌪️',
    771: '🌪️',
  };
  
  // Get first digit for general category
  const category = Math.floor(weatherId / 100);
  const icon = iconMap[weatherId] || iconMap[category * 100] || '🌤️';
  const iconSize = getIconSize(size);

  return (
    <TextWidget
      text={icon}
      style={{
        fontSize: iconSize,
        textAlign: 'center',
      }}
    />
  );
};

export default WeatherIcon;