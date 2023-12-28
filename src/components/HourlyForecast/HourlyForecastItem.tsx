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

interface HourlyForecastItemProps {
  temp: number;
  dt: number;
  icon: string;
  pop: number;
  desc: string;
  percType?: string;
}

const HourlyForecastItem = ({
  temp,
  dt,
  icon,
  pop,
  desc,
  percType,
}: HourlyForecastItemProps) => {
  return (
    <Card cardType={CardStyleTypes.HOURLY}>
      <View style={HourlyForecastItemStyles.HourlyItem}>
        <Text style={HourlyForecastItemStyles.HourText}>
          {moment.unix(dt).format("LT").toUpperCase()}
        </Text>
        <PopType pop={pop} percType={percType} />
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
