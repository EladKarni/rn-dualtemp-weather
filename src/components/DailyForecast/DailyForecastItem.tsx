import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import Card, { CardStyleTypes } from '../Card/Card';
import moment from 'moment'
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import DailyForecastExpanded from './DailyForecastExpanded';
import DualTempText from '../TempText/DualTempText';
import PopType from "../PopType/PopType";

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
  const percpType = day?.snow ? "❄" : "💧";

  return (
    <Card
      cardType={
        index === currSelected ? CardStyleTypes.DAILYXL : CardStyleTypes.DAILY
      }
    >
      <TouchableOpacity onPress={() => setSelected(index)} style={{paddingHorizontal: 10, paddingBottom: 10}}>
        <View style={DailyForecastItemStyles.dailyItemHeader}>
          <Text style={DailyForecastItemStyles.dayText}>
            {moment.unix(day.dt).format("dddd")}
          </Text>
          <View style={DailyForecastItemStyles.tempIconContainer}>
            <PopType pop={day.pop} percType={percpType} />
            <View style={DailyForecastItemStyles.tempContainer}>
              <DualTempText
                temp={day.temp.day}
                tempStyleC={TempTextStyleTypes.DAILY}
                degree
                divider
              />
            </View>
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

export default DailyForecastItem