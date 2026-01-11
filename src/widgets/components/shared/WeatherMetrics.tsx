'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { convertWindSpeed } from '../../../utils/temperature';
import { palette } from '../../../styles/Palette';

interface WeatherMetricsProps {
  humidity: number;
  windSpeed: number;
  tempScale: 'C' | 'F';
  size: 'small' | 'medium' | 'large' | 'extended';
}

const getMetricsFontSize = (size: WeatherMetricsProps['size']): number => {
  switch (size) {
    case 'small': return 9;
    case 'medium': return 11;
    case 'large': return 12;
    case 'extended': return 12;
    default: return 11;
  }
};

export const WeatherMetrics: React.FC<WeatherMetricsProps> = ({ 
  humidity, 
  windSpeed, 
  tempScale,
  size 
}) => {
  const fontSize = getMetricsFontSize(size);
  const wind = convertWindSpeed(windSpeed, tempScale);

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 'match_parent',
      }}
    >
      <TextWidget
        text={`💧 ${humidity}%`}
        style={{
          fontSize,
          color: palette.highlightColor,
        }}
      />
      <TextWidget
        text={`💨 ${Math.round(wind.value)} ${wind.unit}`}
        style={{
          fontSize,
          color: palette.highlightColor,
        }}
      />
    </FlexWidget>
  );
};

export default WeatherMetrics;