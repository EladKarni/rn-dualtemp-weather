import { View, Text, Dimensions } from 'react-native'
import { DailyForecastExtendedItemStyles } from './DailyForecastExtendedItemStyles.Styles';
import { DailyEntity } from '../../types/WeatherTypes';
import React, { useState } from 'react'
import { LineChart } from 'react-native-chart-kit';
import { palette } from '../../Styles/Palette';
import moment from 'moment';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import DailyExpandedFeelInfo from './DailyExpandedFeelInfo';

type DailyForecastItemExpandedPropTypes = {
    day: DailyEntity;
}


const DailyForecastExpanded = ({ day }: DailyForecastItemExpandedPropTypes) => {

    const graphScale = ['Morning', 'Day', 'Evening', 'Night']
    const [cardWidth, setCardWidth] = useState(0)

    return (
        <>
            <View
                style={DailyForecastExtendedItemStyles.container}
                onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}
            >
                <View>
                    <LineChart
                        data={{
                            labels: graphScale,
                            datasets: [
                                {
                                    data: [day.feels_like['morn'], day.feels_like['day'], day.feels_like['eve'], day.feels_like['night']]
                                }
                            ]
                        }}
                        width={cardWidth / 1.5} // from react-native
                        height={275}
                        withVerticalLines={false}
                        yAxisSuffix="°"
                        yAxisInterval={1} // optional, defaults to 1
                        chartConfig={{
                            backgroundColor: "transparent",
                            backgroundGradientTo: "white",
                            backgroundGradientFromOpacity: 0,
                            backgroundGradientFrom: "white",
                            backgroundGradientToOpacity: 0,
                            decimalPlaces: 0, // optional, defaults to 2dp
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            propsForDots: {
                                r: "5",
                                strokeWidth: "3",
                                stroke: palette.grayLight
                            }
                        }}
                        bezier
                        style={{
                            marginBottom: -20,
                            borderRadius: 16,
                            marginLeft: -18,
                            marginRight: 24
                        }}
                    />
                </View>
                <View style={DailyForecastExtendedItemStyles.InfoSectionContainer}>
                    <View style={DailyForecastExtendedItemStyles.InfoSectionTextUnit}>
                        <WeatherIcon icon={displayWeatherIcon('01d')} iconSize={IconSizeTypes.TINY} />
                        <Text style={DailyForecastExtendedItemStyles.InfoSectionText}>
                            Sunrise:
                        </Text>
                        <Text style={DailyForecastExtendedItemStyles.InfoSectionText}>
                            {moment.unix(day.sunrise).format('hh:mm')}
                        </Text>
                    </View>
                    <View style={DailyForecastExtendedItemStyles.InfoSectionTextUnit}>
                        <WeatherIcon icon={displayWeatherIcon('sunset')} iconSize={IconSizeTypes.TINY} />
                        <Text style={DailyForecastExtendedItemStyles.InfoSectionText}>
                            Sunset:
                        </Text>
                        <Text style={DailyForecastExtendedItemStyles.InfoSectionText}>
                            {moment.unix(day.sunset).format('hh:mm')}
                        </Text>
                    </View>

                    <Text style={DailyForecastExtendedItemStyles.infoFeelTitle}>Feels Like</Text>
                    <DailyExpandedFeelInfo temp={day.feels_like.morn} label={'Morning'} />
                    <DailyExpandedFeelInfo temp={day.feels_like.day} label={'Day'} />
                    <DailyExpandedFeelInfo temp={day.feels_like.eve} label={'Even'} />
                    <DailyExpandedFeelInfo temp={day.feels_like.night} label={'Night'} />

                    <Text style={DailyForecastExtendedItemStyles.infoFeelTitle}>Min/Max</Text>
                    <DailyExpandedFeelInfo temp={day.temp.max} label={'Max'} />
                    <DailyExpandedFeelInfo temp={day.temp.min} label={'Min'} />
                </View>
            </View>
        </>
    )
}

export default DailyForecastExpanded