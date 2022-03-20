import React from 'react'
import { View, Text } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import Card from '../Card/Card';
import moment from 'moment'
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import { palette } from '../../Styles/Palette';

type DailyForecastItemPropTypes = {
    day: DailyEntity;
}

const DailyForecastItem = ({ day }: DailyForecastItemPropTypes) => {
    return (
        <Card cardType='daily'>
            <View style={DailyForecastItemStyles.dailyItem}>
                <Text style={DailyForecastItemStyles.dayText}>{moment.unix(day.dt).format('dddd')}</Text>
                <View style={{ flexDirection: 'row', height: 15 }}>
                    <TempText
                        temp={day.temp.day}
                        textStyleType={TempTextStyleTypes.DAILY}
                        tempType='C'
                        withSym={true}
                    />
                    <Text style={{ fontStyle: 'italic', color: `${palette.grayLight}` }}> | </Text>
                    <TempText
                        temp={day.temp.day}
                        textStyleType={TempTextStyleTypes.DAILY}
                        tempType='F'
                        withSym={true}
                    />
                </View>
                <WeatherIcon icon={displayWeatherIcon(day.weather[0].icon)} w={32.5} h={32.5} />
            </View>
        </Card>
    )
}

export default DailyForecastItem