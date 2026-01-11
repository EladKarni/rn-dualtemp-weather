'use no memo';
import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { formatTemperature } from '../../../utils/temperature';
import { palette } from '../../../styles/Palette';

interface TemperatureDisplayProps {
  temp: number;
  scale: 'C' | 'F';
  size: 'small' | 'medium' | 'large' | 'extended';
}

const getTempFontSize = (size: TemperatureDisplayProps['size']): number => {
  switch (size) {
    case 'small': return 20;
    case 'medium': return 32;
    case 'large': return 40;
    case 'extended': return 40;
    default: return 32;
  }
};

export const TemperatureDisplay: React.FC<TemperatureDisplayProps> = ({ 
  temp, 
  scale, 
  size 
}) => {
  const fontSize = getTempFontSize(size);
  const tempFormatted = formatTemperature(temp, scale);

  return (
    <TextWidget
      text={tempFormatted}
      style={{
        fontSize,
        color: palette.textColor,
      }}
    />
  );
};

export default TemperatureDisplay;