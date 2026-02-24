import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, LayoutAnimation } from 'react-native';
import Subtitle from '../Subtitle/Subtitle';
import HourlyForecastItem from './HourlyForecastItem';

import { HourlyForecastStyles } from './HourlyForecast.Styles';

import { HourlyEntity } from '../../types/WeatherTypes';
import { i18n } from "../../localization/i18n";
import { useLanguageStore } from '../../store/useLanguageStore';
import { getPrecipitationAmount } from '../../utils/temperature';

const LAYOUT_ANIMATION_DURATION = 300;

type HourlyForecastProps = {
  hourlyForecast?: HourlyEntity[];
};

const HourlyForecast = (props: HourlyForecastProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentlySelectedIndex, setCurrentlySelectedIndex] = useState(0);

  // Reset scroll position when RTL changes
  useEffect(() => {
    if (scrollViewRef.current && props.hourlyForecast && props.hourlyForecast.length > 0) {
      scrollViewRef.current.scrollTo({ x: 0, animated: false });
    }
  }, [isRTL, props.hourlyForecast]);

  const setSelectedIndex = (index: number) => {
    LayoutAnimation.configureNext({
      duration: LAYOUT_ANIMATION_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (index !== currentlySelectedIndex) {
      setCurrentlySelectedIndex(index);
    } else {
      setCurrentlySelectedIndex(NaN);
    }
  };

  return (
    <View style={HourlyForecastStyles.container}>
      <Subtitle text={i18n.t("HourlyTitle")} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={isRTL ? { flexDirection: 'row-reverse' } : undefined}
      >
        {props.hourlyForecast?.map((hour, index) => {
          const percpType = hour.snow ? "❄" : "💧";
          const precipAmount = getPrecipitationAmount(hour.rain, hour.snow, true);
          return (
            <HourlyForecastItem
              key={hour.dt}
              temp={hour.temp}
              dt={hour.dt}
              icon={hour.weather[0].icon}
              pop={hour.pop}
              wind={hour.wind_speed}
              percType={percpType}
              precipAmount={precipAmount}
              feelsLike={hour.feels_like}
              humidity={hour.humidity}
              uvi={hour.uvi}
              index={index}
              currSelected={currentlySelectedIndex}
              setSelected={setSelectedIndex}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

export default HourlyForecast;
