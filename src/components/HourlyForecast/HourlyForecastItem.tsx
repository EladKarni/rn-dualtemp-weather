import React, { useContext } from 'react';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';
import DualTempText from '../TempText/DualTempText';
import { AppStateContext } from '../../utils/AppStateContext';
import PopType from "../PopType/PopType";
import { useTimeFormatting } from '../../utils/dateFormatting';
import { convertWindSpeed } from '../../utils/temperature';

interface HourlyForecastItemProps {
  temp: number;
  dt: number;
  icon: string;
  pop: number;
  wind: number;
  percType?: string;
}

const HourlyForecastItem = ({
  temp,
  dt,
  icon,
  pop,
  wind,
  percType,
}: HourlyForecastItemProps) => {
  const context = useContext(AppStateContext);
  const tempScale = (context?.tempScale ?? 'C') as 'C' | 'F';
  const { formatTime } = useTimeFormatting();

  // Use centralized wind speed conversion
  const { value: windSpeedValue, unit: windSpeedUnit } = convertWindSpeed(wind, tempScale);
  const wind_speed = windSpeedValue.toFixed(0);
  const wind_speed_scale = windSpeedUnit;
  return (
    <Card cardType={CardStyleTypes.HOURLY}>
      <View style={HourlyForecastItemStyles.HourlyItem}>
        <Text style={HourlyForecastItemStyles.HourText}>
          {formatTime(dt)}
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
