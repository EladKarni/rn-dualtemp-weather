'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatTemperature } from '../../../utils/temperature';
import { palette } from '../../../styles/Palette';

interface DualTemperatureDisplayProps {
  temp: number;
  size: 'tiny' | 'small' | 'medium' | 'large';
  tempScale: 'C' | 'F';  // User's preferred temperature scale
  /**
   * How the two scales are arranged.
   *
   * - `inline` puts them on one line joined by `separator`, with no unit
   *   letters: "22° / 72°".
   * - `stacked` puts the preferred scale on its own line above the other and
   *   letters both: "22°C" over "72°F". The letters are not optional here —
   *   without the separator between them, they are the only thing that says
   *   which reading is which.
   *
   * @default 'inline'
   */
  layout?: 'inline' | 'stacked';
  /** Only used by `inline`. */
  separator?: string; // default: " / "
  /**
   * Cap each line at one line of text. Callers that lay the reading out in a
   * sized column want this: a wrapped line breaks the row's shared baseline and
   * makes the columns look ragged, whereas a clipped one keeps the geometry
   * intact. Left unset by default because the hourly columns deliberately let
   * the reading wrap onto a second line.
   */
  maxLines?: number;
}

const getDualTempFontSize = (size: DualTemperatureDisplayProps['size']): number => {
  switch (size) {
    // `tiny` exists for the daily rows, which carry two readings plus a day,
    // an icon and sometimes UV. Inline, a dual-scale reading is nine characters
    // ("32° / 89°") and needs ~60dp at 16dp type; stacked it needs ~36dp but
    // twice the height. Either way 16dp does not fit a three-cell row.
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
  layout = 'inline',
  separator = " / ",
  maxLines
}) => {
  const fontSize = getDualTempFontSize(size);

  // formatTemperature returns the degree symbol only ("22°") — it is the shared
  // primitive the rest of the app and the width budgets are built on, so the
  // unit letter is appended here rather than added there.
  const preferredScale = tempScale;
  const otherScale = tempScale === 'F' ? 'C' : 'F';
  const preferred = formatTemperature(temp, preferredScale);
  const other = formatTemperature(temp, otherScale);

  const lineCap = maxLines ? { maxLines } : {};

  if (layout === 'stacked') {
    return (
      // A single FlexWidget, never a fragment: this renderer calls every element
      // type as a function, so a React.Fragment throws
      // "Symbol(react.fragment) is not a function" and takes the whole widget
      // down to the error view.
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
        {/* `bold` rather than a numeric weight. Below API 28 the native side
            collapses every weight >= 500 onto Typeface.BOLD anyway, and above
            it the weight resolves against whatever system font the device
            ships, so a numeric value is not a reliable "slightly bolder" — it
            is either exactly bold or unpredictable. */}
        <TextWidget
          text={`${preferred}${preferredScale}`}
          {...lineCap}
          style={{
            fontSize,
            fontWeight: 'bold',
            color: palette.textColor,
            textAlign: 'center',
          }}
        />
        <TextWidget
          text={`${other}${otherScale}`}
          {...lineCap}
          style={{
            fontSize,
            color: palette.textColor,
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    );
  }

  return (
    <TextWidget
      text={`${preferred}${separator}${other}`}
      {...lineCap}
      style={{
        fontSize,
        color: palette.textColor,
        textAlign: 'center',
      }}
    />
  );
};

export default DualTemperatureDisplay;
