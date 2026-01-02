import React, { useContext } from 'react';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import moment from 'moment';
import { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';
import DualTempText from '../TempText/DualTempText';
import { AppStateContext } from '../../utils/AppStateContext';
import PopType from "../PopType/PopType";
import { i18n } from "../../localization/i18n";

interface HourlyForecastItemProps {
  temp: number;
  dt: number;
  icon: string;
  pop: number;
  desc: string;
  wind: number;
  percType?: string;
}

const HourlyForecastItem = ({
  temp,
  dt,
  icon,
  pop,
  desc,
  wind,
  percType,
}: HourlyForecastItemProps) => {
  const context = useContext(AppStateContext);
  const tempScale = context?.tempScale ?? 'C';
  const wind_speed =
    tempScale === "C"
      ? `${(wind * 3.6).toFixed(0)}`
      : `${(wind * 2.23694).toFixed(0)}`;
  const wind_speed_scale =
    tempScale === "C" ? i18n.t("SpeedInfo") : i18n.t("SpeedInfoImp");
  return (
    <Card cardType={CardStyleTypes.HOURLY}>
      <View style={HourlyForecastItemStyles.HourlyItem}>
        <Text style={HourlyForecastItemStyles.HourText}>
          {moment.unix(dt).format("LT").toUpperCase()}
        </Text>
        <PopType pop={pop} percType={percType} />
        <View style={HourlyForecastItemStyles.HourWindInfo}>
          <Text style={HourlyForecastItemStyles.HourText}>{wind_speed}</Text>
          <Text style={HourlyForecastItemStyles.HourText}>
            {wind_speed_scale}
          </Text>
        </View>
        <WeatherIcon
          icon={displayWeatherIcon(icon)}
          iconSize={IconSizeTypes.MEDIUM}
        />
        <View style={styles.temp}>
          <DualTempText
            temp={temp}
            tempStyleC={TempTextStyleTypes.HOURLY}
            degree
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
    temp: {
        marginTop: 5
    },
});

export default HourlyForecastItem;
