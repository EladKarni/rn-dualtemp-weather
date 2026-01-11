import { View, Text } from "react-native";
import { DailyForecastExtendedItemStyles } from "./DailyForecastExtendedItemStyles.Styles";
import { DailyEntity } from "../../types/WeatherTypes";
import React, { useState } from "react";
import DailyExpandedFeelInfo from "./DailyExpandedFeelInfo";
import { i18n } from "../../localization/i18n";
import TemperatureChart from "./TemperatureChart";
import SunriseSunsetCompact from "./SunriseSunsetCompact";
import { useLanguageStore } from "../../store/useLanguageStore";
import { useSettingsStore } from "../../store/useSettingsStore";

type DailyForecastItemExpandedProps = {
  day: DailyEntity;
};

const DailyForecastExpanded = ({ day }: DailyForecastItemExpandedProps) => {
  const [cardWidth, setCardWidth] = useState(0);
  const isRTL = useLanguageStore((state) => state.isRTL);
  const showSunriseSunset = useSettingsStore((state) => state.showSunriseSunset);

  return (
    <>
      <View
        style={[DailyForecastExtendedItemStyles.container, isRTL && DailyForecastExtendedItemStyles.containerRTL]}
        onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}
      >
        <TemperatureChart feelsLike={day.feels_like} cardWidth={cardWidth} />
        <View style={DailyForecastExtendedItemStyles.InfoSectionContainer}>
          <Text style={[DailyForecastExtendedItemStyles.infoFeelTitle, isRTL && DailyForecastExtendedItemStyles.infoFeelTitleRTL]}>
            {i18n.t("Feels")}
          </Text>
          <DailyExpandedFeelInfo
            temp={day.feels_like.morn}
            label={i18n.t("Morn")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.day}
            label={i18n.t("Noon")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.eve}
            label={i18n.t("Eve")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.night}
            label={i18n.t("Night")}
          />

          <Text style={[DailyForecastExtendedItemStyles.infoFeelTitle, isRTL && DailyForecastExtendedItemStyles.infoFeelTitleRTL]}>
            {i18n.t("MinMax")}
          </Text>
          <DailyExpandedFeelInfo temp={day.temp.max} label={i18n.t("Max")} />
          <DailyExpandedFeelInfo temp={day.temp.min} label={i18n.t("Min")} />
        </View>
      </View>
      {showSunriseSunset && (
        <SunriseSunsetCompact 
          sunrise={day.sunrise} 
          sunset={day.sunset} 
        />
      )}
    </>
  );
};

export default DailyForecastExpanded;
