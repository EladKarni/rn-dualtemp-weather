'use no memo';
import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { formatTemperature } from '../../../utils/temperature';
import { palette } from '../../../styles/Palette';

interface DualTemperatureDisplayProps {
  temp: number;
  size: 'small' | 'medium' | 'large';
  tempScale: 'C' | 'F';  // User's preferred temperature scale
  separator?: string; // default: " / "
}

const getDualTempFontSize = (size: DualTemperatureDisplayProps['size']): number => {
  switch (size) {
    case 'small': return 16;
    case 'medium': return 24;
    case 'large': return 32;
    default: return 24;
  }
};

export const DualTemperatureDisplay: React.FC<DualTemperatureDisplayProps> = ({
  temp,
  size,
  tempScale,
  separator = " / "
}) => {
  const fontSize = getDualTempFontSize(size);

  // Format both temperatures
  const tempF = formatTemperature(temp, 'F');
  const tempC = formatTemperature(temp, 'C');

  // Show preferred unit first based on user's temperature scale preference
  const dualTempText = tempScale === 'F'
    ? `${tempF}${separator}${tempC}`  // "72°F / 22°C"
    : `${tempC}${separator}${tempF}`;  // "22°C / 72°F"

  return (
    <TextWidget
      text={dualTempText}
      style={{
        fontSize,
        color: palette.textColor,
        textAlign: 'center',
      }}
    />
  );
};

export default DualTemperatureDisplay;