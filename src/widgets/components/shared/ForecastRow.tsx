'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { HourlyEntity } from '../../../types/WeatherTypes';
import { formatTemperature } from '../../../utils/temperature';
import { WeatherIcon } from './WeatherIcon';
import { palette } from '../../../styles/Palette';
import { formatTime } from '../../../utils/dateFormatting';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface ForecastRowProps {
  forecast: HourlyEntity;
  tempScale: 'C' | 'F';
  size: 'small' | 'medium' | 'large' | 'extended';
}

const getForecastFontSize = (size: ForecastRowProps['size']): number => {
  switch (size) {
    case 'small': return 10;
    case 'medium': return 12;
    case 'large': return 14;
    case 'extended': return 12;
    default: return 12;
  }
};

const getIconSize = (size: ForecastRowProps['size']): 'small' | 'medium' | 'large' => {
  switch (size) {
    case 'small': return 'small';
    case 'medium': return 'medium';
    case 'large': return 'large';
    case 'extended': return 'medium';
    default: return 'medium';
  }
};

export const ForecastRow: React.FC<ForecastRowProps> = ({
  forecast,
  tempScale,
  size
}) => {
  const fontSize = getForecastFontSize(size);
  const iconSize = getIconSize(size);
  // Honor the user's clock-format preference (settings store hydrated in the
  // widget context by the store-hydration gate).
  const time = formatTime(forecast.dt, useSettingsStore.getState().clockFormat);

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
      }}
    >
      <TextWidget
        text={time}
        style={{
          fontSize: fontSize - 2,
          color: palette.textColorSecondary,
          marginBottom: 4,
        }}
      />
      <WeatherIcon weatherId={forecast.weather[0].id} size={iconSize} />
      <TextWidget
        text={formatTemperature(Math.round(forecast.temp), tempScale)}
        style={{
          fontSize,
          color: palette.textColor,
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
};

export default ForecastRow;