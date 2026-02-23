import React, { useState } from 'react'
import DailyForecastItem from './DailyForecastItem';
import Subtitle from '../Subtitle/Subtitle';

import { View, LayoutAnimation } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastStyles } from './DailyForecast.Styles';
import { i18n } from "../../localization/i18n";

type DailyForecastProps = {
  dailyForecast: DailyEntity[];
}

const DailyForecast = ({ dailyForecast }: DailyForecastProps) => {
  const [currentlySelectedIndex, setCurrentlySelectedIndex] = useState(0)

  const setSelectedIndex = (index: number) => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    index !== currentlySelectedIndex
      ? setCurrentlySelectedIndex(index)
      : setCurrentlySelectedIndex(NaN)
  }

  return (
    <View style={[DailyForecastStyles.container]}>
      <Subtitle text={i18n.t("DailyTitle")} />
      {dailyForecast.map((day, i) => {
        return (
          <DailyForecastItem
            day={day}
            key={day.dt}
            index={i}
            currSelected={currentlySelectedIndex}
            setSelected={setSelectedIndex}
          />
        );
      })}
    </View>
  );
}

export default DailyForecast