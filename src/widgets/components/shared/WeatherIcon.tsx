'use no memo';
import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { getWeatherIcon } from '../../utils/widgetDataUtils';

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
  // Single source of truth for the icon mapping lives in widgetDataUtils.
  const icon = getWeatherIcon(weatherId);
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
