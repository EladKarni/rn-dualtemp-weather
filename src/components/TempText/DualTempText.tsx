import React, { useContext } from "react";
import { Text, View } from "react-native";
import { AppStateContext } from "../../utils/AppStateContext";
import { DailyForecastItemStyles } from "../DailyForecast/DailyForecast.Styles";
import TempText, { TempTextStyleTypes } from "./TempText";

type DualTempTextProps = {
  temp: number;
  tempStyleC: TempTextStyleTypes;
  tempStyleF?: TempTextStyleTypes;
  degree?: boolean;
  divider?: boolean;
};

const DualTempText = ({
  temp,
  tempStyleC,
  tempStyleF = tempStyleC,
  degree = false,
  divider = false,
}: DualTempTextProps) => {
  const context = useContext(AppStateContext);
  const tempScale = context?.tempScale;

  return (
    <View>
      <TempText
        temp={temp}
        textStyleType={tempStyleC}
        tempType={tempScale}
        withSym={degree}
      />
      <TempText
        temp={temp}
        textStyleType={tempStyleF}
        tempType={tempScale === "C" ? "F" : "C"}
        withSym={degree}
      />
    </View>
  );
};

export default DualTempText;
