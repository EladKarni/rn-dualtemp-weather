'use no memo';
import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { formatTemperature } from '../../../utils/temperature';

interface DualTemperatureDisplayProps {
  temp: number;
  size: 'small' | 'medium' | 'large';
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
  separator = " / "
}) => {
  const fontSize = getDualTempFontSize(size);
  
  // Format both temperatures
  const tempF = formatTemperature(temp, 'F');
  const tempC = formatTemperature(temp, 'C');
  
  // Combine: "72°F / 22°C"
  const dualTempText = `${tempF}${separator}${tempC}`;

  return (
    <TextWidget
      text={dualTempText}
      style={{
        fontSize,
        color: '#FFFFFF',
        textAlign: 'center',
      }}
    />
  );
};

export default DualTemperatureDisplay;