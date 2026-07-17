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
    >
      {tempType?.toUpperCase() !== "F"
        ? Math.round(temp)
        : Math.round(celsiusToFahrenheit(temp))}
      {withSym ? "°" : null}
      <Text style={TempTextStyles.tempLastLetter}>{tempType}</Text>
    </Text>
  );
};

export default TempText;
