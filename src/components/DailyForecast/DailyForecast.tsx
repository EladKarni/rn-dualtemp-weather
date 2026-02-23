import React, { useState, useRef, useCallback } from 'react'
import DailyForecastItem from './DailyForecastItem';
import Subtitle from '../Subtitle/Subtitle';

import { View, LayoutAnimation, ScrollView } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastStyles } from './DailyForecast.Styles';
import { i18n } from "../../localization/i18n";

type DailyForecastProps = {
  dailyForecast: DailyEntity[];
  scrollViewRef: React.RefObject<ScrollView>;
}

const LAYOUT_ANIMATION_DURATION = 300;
const SCROLL_TOP_OFFSET = 80;

const DailyForecast = ({ dailyForecast, scrollViewRef }: DailyForecastProps) => {
  const [currentlySelectedIndex, setCurrentlySelectedIndex] = useState(0)
  const containerY = useRef(0);
  const itemYPositions = useRef<number[]>([]);
  const pendingScrollIndex = useRef<number | null>(null);

  const handleItemLayout = useCallback((index: number, y: number) => {
    itemYPositions.current[index] = y;
    if (pendingScrollIndex.current === index) {
      const scrollY = containerY.current + y - SCROLL_TOP_OFFSET;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, scrollY), animated: true });
      pendingScrollIndex.current = null;
    }
  }, [scrollViewRef]);

  const setSelectedIndex = (index: number) => {
    LayoutAnimation.configureNext({
      duration: LAYOUT_ANIMATION_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    if (index !== currentlySelectedIndex) {
      pendingScrollIndex.current = index;
      setCurrentlySelectedIndex(index);
    } else {
      setCurrentlySelectedIndex(NaN);
    }
  }

  return (
    <View
      style={[DailyForecastStyles.container]}
      onLayout={(e) => { containerY.current = e.nativeEvent.layout.y; }}
    >
      <Subtitle text={i18n.t("DailyTitle")} />
      {dailyForecast.map((day, i) => {
        return (
          <View
            key={day.dt}
            onLayout={(e) => { handleItemLayout(i, e.nativeEvent.layout.y); }}
          >
            <DailyForecastItem
              day={day}
              index={i}
              currSelected={currentlySelectedIndex}
              setSelected={setSelectedIndex}
            />
          </View>
        );
      })}
    </View>
  );
}

export default DailyForecast