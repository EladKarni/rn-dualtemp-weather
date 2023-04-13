import { View, Text } from 'react-native'
import React from 'react'
import TempText, { TempTextStyleTypes } from '../TempText/TempText'
import { DailyForecastExtendedItemStyles } from './DailyForecastExtendedItemStyles.Styles'
import { FeelsLike } from '../../types/WeatherTypes'
import DualTempText from '../TempText/DualTempText'
type DailyExpandedFeelInfoPropTypes = {
    temp: number;
    label: string;
}
const DailyExpandedFeelInfo = ({ temp, label }: DailyExpandedFeelInfoPropTypes) => {
    return (
        <View style={DailyForecastExtendedItemStyles.tempContainer}>
            <Text style={DailyForecastExtendedItemStyles.infoFeelTime} allowFontScaling={false}>{label}: </Text>
            <View style={DailyForecastExtendedItemStyles.horizontalText}>
                <DualTempText
                    temp={temp}
                    tempStyleC={TempTextStyleTypes.DAILY}
                    degree
                />
            </View>
        </View>
    )
}

export default DailyExpandedFeelInfo