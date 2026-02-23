import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { DailyEntity } from "../../types/WeatherTypes";
import { DailyForecastItemStyles } from "./DailyForecast.Styles";
import Card, { CardStyleTypes } from "../Card/Card";
import WeatherIcon, { IconSizeTypes } from "../WeatherIcon/WeatherIcon";
import { displayWeatherIcon } from "../../utils/Images";
import { TempTextStyleTypes } from "../TempText/TempText";
import DailyForecastExpanded from "./DailyForecastExpanded";
import DualTempText from "../TempText/DualTempText";
import PopType from "../PopType/PopType";
import { formatDayName } from "../../utils/dateFormatting";
import { useLanguageStore } from "../../store/useLanguageStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { getPrecipitationAmount } from "../../utils/temperature";

type DailyForecastItemPropTypes = {
  day: DailyEntity;
  index: number;
  currSelected: number;
  setSelected: (index: number) => void;
};

const DailyForecastItem = ({
  day,
  index,
  setSelected,
  currSelected,
}: DailyForecastItemPropTypes) => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const precipUnit = useSettingsStore((state) =>
    state.getEffectivePrecipUnit(),
  );
  const percpType = day?.snow ? "❄" : "💧";
  const precipAmount = getPrecipitationAmount(day.rain, day.snow, false);

  return (
    <Card
      cardType={
        index === currSelected ? CardStyleTypes.DAILYXL : CardStyleTypes.DAILY
      }
    >
      <TouchableOpacity
        onPress={() => setSelected(index)}
        style={DailyForecastItemStyles.container}
      >
        <View
          style={[
            DailyForecastItemStyles.dailyItemHeader,
            isRTL && DailyForecastItemStyles.dailyItemHeaderRTL,
          ]}
        >
          <Text style={DailyForecastItemStyles.dayText}>
            {formatDayName(day.dt)}
          </Text>
          <View
            style={[
              DailyForecastItemStyles.tempIconContainer,
              isRTL && DailyForecastItemStyles.tempIconContainerRTL,
            ]}
          >
            <PopType
              pop={day.pop}
              percType={percpType}
              precipAmount={precipAmount}
              precipUnit={precipUnit}
            />
            {/* <View style={DailyForecastItemStyles.tempContainer}> */}
            <DualTempText
              temp={day.temp.day}
              tempStyleC={TempTextStyleTypes.DAILY}
              degree
            />
            {/* </View> */}
            <WeatherIcon
              icon={displayWeatherIcon(day.weather[0].icon)}
              iconSize={IconSizeTypes.SMALL}
            />
          </View>
        </View>
        {index === currSelected && <DailyForecastExpanded day={day} />}
      </TouchableOpacity>
    </Card>
  );
};

export default DailyForecastItem;
