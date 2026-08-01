import { Text } from "react-native";
import React from "react";
import { TempTextStyles } from "./TempText.styles";
import { typography } from "../../styles/Typography";
import { celsiusToFahrenheit } from "../../utils/temperature";

type TempTextPropsType = {
  textStyleType: TempTextStyleTypes;
  withSym: boolean;
  temp: number;
  tempType?: string;
};

export enum TempTextStyleTypes {
  MAIN = "tempCurrentMain",
  SECONDARY = "tempCurrentSecondary",
  HOURLY = "tempHourly",
  DAILY = "tempDaily",
}

const TempText = ({
  temp,
  withSym,
  tempType,
  textStyleType,
}: TempTextPropsType) => {
  return (
    <Text
      style={[
        typography.headerText,
        TempTextStyles.temp,
        TempTextStyles[textStyleType],
      ]}
      allowFontScaling={false}
      // A reading is always "28°C" left-to-right, whatever the UI language.
      // Without this the unit letter DISAPPEARED on Android whenever the
      // device's system language was Hebrew or Arabic: it used to be a nested
      // <Text> carrying its own padding, and an inline span inside a parent
      // with textAlign "right" gets laid out past the measured bounds once the
      // surrounding paragraph resolves right-to-left. The number and degree
      // sign survived; only the trailing C was clipped away.
      writingDirection="ltr"
    >
      {tempType?.toUpperCase() !== "F"
        ? Math.round(temp)
        : Math.round(celsiusToFahrenheit(temp))}
      {withSym ? "°" : null}
      {tempType}
    </Text>
  );
};

export default TempText;
