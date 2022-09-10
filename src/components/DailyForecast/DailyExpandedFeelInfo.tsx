import { View, Text } from 'react-native'
import React from 'react'
import TempText, { TempTextStyleTypes } from '../TempText/TempText'
import { DailyForecastExtendedItemStyles } from './DailyForecastExtendedItemStyles.Styles'
import { FeelsLike } from '../../types/WeatherTypes'
type DailyExpandedFeelInfoPropTypes = {
    temp: number;
    label: string;
}
const DailyExpandedFeelInfo = ({ temp, label }: DailyExpandedFeelInfoPropTypes) => {
    return (
        <View style={DailyForecastExtendedItemStyles.tempContainer}>
            <Text style={DailyForecastExtendedItemStyles.infoFeelTime}>{label}: </Text>
            <View style={DailyForecastExtendedItemStyles.horizontalText}>
                <TempText
                    temp={temp}
                    textStyleType={TempTextStyleTypes.HOURLY}
                    tempType='C'
                    withSym={true}
                />
                <TempText
                    temp={temp}
                    textStyleType={TempTextStyleTypes.HOURLY}
                    tempType='F'
                    withSym={true}
                />
            </View>
        </View>
    )
}

export default DailyExpandedFeelInfo