import React from 'react'
import DailyForecastItem from './DailyForecastItem';
import Subtitle from '../Subtitle/Subtitle';

import { View } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastStyles } from './DailyForecast.Styles';

type DailyForecastPropTypes = {
    dailyForecast: DailyEntity[];
}

const DailyForecast = ({ dailyForecast }: DailyForecastPropTypes) => {
    return (
        <View style={DailyForecastStyles.container}>
            <Subtitle text={'Daily Forecast'} />
            {dailyForecast.map((day) => {
                return <DailyForecastItem day={day} key={day.dt} />
            })}
        </View>
    )
}

export default DailyForecast