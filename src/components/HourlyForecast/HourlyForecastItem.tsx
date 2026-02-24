import React from 'react';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';
import DualTempText from '../TempText/DualTempText';
import { useTimeFormatting } from '../../utils/dateFormatting';
import HourlyForecastExpanded from './HourlyForecastExpanded';
import { useLanguageStore } from '../../store/useLanguageStore';

interface HourlyForecastItemProps {
  temp: number;
  dt: number;
  icon: string;
  pop: number;
  wind: number;
  percType?: string;
  precipAmount?: number;
  feelsLike: number;
  humidity: number;
  uvi: number;
  index: number;
  currSelected: number;
  setSelected: (index: number) => void;
}

const HourlyForecastItem = ({
  temp,
  dt,
  icon,
  pop,
  wind,
  percType,
  precipAmount,
  feelsLike,
  humidity,
  uvi,
  index,
  currSelected,
  setSelected,
}: HourlyForecastItemProps) => {
  const { formatTime } = useTimeFormatting();
  const isRTL = useLanguageStore((state) => state.isRTL);
  const isExpanded = index === currSelected;

  return (
    <Card cardType={isExpanded ? CardStyleTypes.HOURLYXL : CardStyleTypes.HOURLY}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setSelected(index)}
        style={
          isExpanded
            ? [HourlyForecastItemStyles.HourlyItemExpanded, isRTL && HourlyForecastItemStyles.HourlyItemExpandedRTL]
            : HourlyForecastItemStyles.HourlyItem
        }
      >
        <View style={isExpanded ? HourlyForecastItemStyles.HourlyItemLeft : HourlyForecastItemStyles.HourlyItem}>
          <Text style={HourlyForecastItemStyles.HourText}>
            {formatTime(dt)}
          </Text>
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
        {isExpanded && (
          <HourlyForecastExpanded
            feelsLike={feelsLike}
            humidity={humidity}
            uvi={uvi}
            wind={wind}
            pop={pop}
            percType={percType}
            precipAmount={precipAmount}
          />
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
    temp: {
        marginTop: 5
    },
});

export default HourlyForecastItem;
