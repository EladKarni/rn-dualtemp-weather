import React from 'react';
import { View, FlatList } from 'react-native';
import Subtitle from '../Subtitle/Subtitle';
import HourlyForecastItem from './HourlyForecastItem';

import { HourlyForecastStyles } from './HourlyForecast.Styles';

import { HourlyEntity } from '../../types/WeatherTypes';
import { i18n } from "../../localization/i18n";
import { useLanguageStore } from '../../store/useLanguageStore';

type HourlyForecastProps = {
  hourlyForecast?: HourlyEntity[];
};

const HourlyForecast = (props: HourlyForecastProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);

  return (
    <View style={HourlyForecastStyles.container}>
      <Subtitle text={i18n.t("HourlyTitle")} />
      <FlatList
        horizontal
        inverted={isRTL}
        data={props.hourlyForecast}
        keyExtractor={(item, index) => index.toString()}
        renderItem={(hour) => {
          const percpType = hour.item?.snow ? "❄" : "💧";
          return (
            <HourlyForecastItem
              temp={hour.item.temp}
              dt={hour.item.dt}
              icon={hour.item.weather[0].icon}
              pop={hour.item.pop}
              desc={hour.item.weather[0].description}
              wind={hour.item.wind_speed}
              percType={percpType}
            />
          );
        }}
      />
    </View>
  );
};

export default HourlyForecast;
