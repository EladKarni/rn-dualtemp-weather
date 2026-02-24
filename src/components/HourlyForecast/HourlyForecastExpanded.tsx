import React, { useContext } from "react";
import { View, Text } from "react-native";
import DualTempText from "../TempText/DualTempText";
import { TempTextStyleTypes } from "../TempText/TempText";
import PopType from "../PopType/PopType";
import { i18n } from "../../localization/i18n";
import { HourlyExpandedStyles } from "./HourlyForecast.Styles";
import { AppStateContext } from "../../utils/AppStateContext";
import { convertWindSpeed } from "../../utils/temperature";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLanguageStore } from "../../store/useLanguageStore";

interface HourlyForecastExpandedProps {
  feelsLike: number;
  humidity: number;
  uvi: number;
  wind: number;
  pop: number;
  percType?: string;
  precipAmount?: number;
}

const HourlyForecastExpanded = ({
  feelsLike,
  humidity,
  uvi,
  wind,
  pop,
  percType,
  precipAmount,
}: HourlyForecastExpandedProps) => {
  const context = useContext(AppStateContext);
  const tempScale = (context?.tempScale ?? "C") as "C" | "F";
  const precipUnit = useSettingsStore((state) =>
    state.getEffectivePrecipUnit(),
  );
  const isRTL = useLanguageStore((state) => state.isRTL);

  const { value: windSpeedValue, unit: windSpeedUnit } = convertWindSpeed(
    wind,
    tempScale,
  );

  return (
    <View
      style={[
        HourlyExpandedStyles.container,
        isRTL && HourlyExpandedStyles.containerRTL,
      ]}
    >
      <View style={HourlyExpandedStyles.infoRow}>
        <Text style={HourlyExpandedStyles.label}>{i18n.t("Humidity")}</Text>
        <Text style={HourlyExpandedStyles.value}>{humidity}%</Text>
      </View>

      <View style={HourlyExpandedStyles.infoRow}>
        <Text style={HourlyExpandedStyles.label}>{i18n.t("UVIndex")}</Text>
        <Text style={HourlyExpandedStyles.value}>{uvi}</Text>
      </View>

      <View style={HourlyExpandedStyles.infoRow}>
        <Text style={HourlyExpandedStyles.label}>{i18n.t("Wind")}</Text>
        <View style={HourlyExpandedStyles.windRow}>
          <Text style={HourlyExpandedStyles.value}>
            {windSpeedValue.toFixed(0)}
          </Text>
          <Text style={HourlyExpandedStyles.value}>{windSpeedUnit}</Text>
        </View>
      </View>

      <PopType
        pop={pop}
        percType={percType}
        precipAmount={precipAmount}
        precipUnit={precipUnit}
      />
    </View>
  );
};

export default HourlyForecastExpanded;
