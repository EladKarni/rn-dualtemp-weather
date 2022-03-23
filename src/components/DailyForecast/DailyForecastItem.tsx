import React from 'react'
import { View, Text } from 'react-native'
import { DailyEntity } from '../../types/WeatherTypes';
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import Card, { CardStyleTypes } from '../Card/Card';
import moment from 'moment'
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import { palette } from '../../Styles/Palette';

type DailyForecastItemPropTypes = {
    day: DailyEntity;
}

const DailyForecastItem = ({ day }: DailyForecastItemPropTypes) => {
    return (
        <Card cardType={CardStyleTypes.DAILY}>
            <View style={DailyForecastItemStyles.dailyItem}>
                <Text style={DailyForecastItemStyles.dayText}>{moment.unix(day.dt).format('dddd')}</Text>
                <View style={DailyForecastItemStyles.tempIconContainer}>
                    <View style={DailyForecastItemStyles.tempContainer}>
                        <TempText
                            temp={day.temp.day}
                            textStyleType={TempTextStyleTypes.DAILY}
                            tempType='C'
                            withSym={false}
                        />
                        <Text style={DailyForecastItemStyles.tempDivider}> | </Text>
                        <TempText
                            temp={day.temp.day}
                            textStyleType={TempTextStyleTypes.DAILY}
                            tempType='F'
                            withSym={false}
                        />
                    </View>
                    <WeatherIcon icon={displayWeatherIcon(day.weather[0].icon)} iconSize={IconSizeTypes.SMALL} />
                </View>
            </View>
        </Card>
    )
}

export default DailyForecastItem