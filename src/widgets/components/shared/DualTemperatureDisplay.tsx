'use no memo';
import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { formatTemperature } from '../../../utils/temperature';
import { palette } from '../../../styles/Palette';

interface DualTemperatureDisplayProps {
  temp: number;
  size: 'tiny' | 'small' | 'medium' | 'large';
  tempScale: 'C' | 'F';  // User's preferred temperature scale
  separator?: string; // default: " / "
  /**
   * Cap the reading at one line. Callers that lay the reading out in a sized
   * column want this: a wrapped reading breaks the row's shared baseline and
   * makes the columns look ragged, whereas a clipped one keeps the geometry
   * intact. Left unset by default because the hourly columns deliberately let
   * the reading wrap onto a second line.
   */
  maxLines?: number;
}

const getDualTempFontSize = (size: DualTemperatureDisplayProps['size']): number => {
  switch (size) {
    // `tiny` exists for the narrow daily rows: a dual-scale reading is nine
    // characters ("32° / 89°"), which at 16dp needs ~80dp and wraps onto two
    // lines in a two- or three-cell widget.
    case 'tiny': return 13;
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
  separator = " / ",
  maxLines
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
      {...(maxLines ? { maxLines } : {})}
      style={{
        fontSize,
        color: palette.textColor,
        textAlign: 'center',
      }}
    />
  );
};

export default DualTemperatureDisplay;