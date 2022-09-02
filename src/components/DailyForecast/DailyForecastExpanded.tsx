import { View, Text, Dimensions } from 'react-native'
import { DailyForecastItemStyles } from './DailyForecast.Styles';
import { DailyEntity } from '../../types/WeatherTypes';
import React, { useState } from 'react'
import moment from 'moment';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import { LineChart } from 'react-native-chart-kit';

type DailyForecastItemExpandedPropTypes = {
    day: DailyEntity;
}


const DailyForecastExpanded = ({ day }: DailyForecastItemExpandedPropTypes) => {

    const graphScale = ['Morning', 'Day', 'Evening', 'Night']
    const [cardWidth, setCardWidth] = useState(0)

    return (
        <>
            <View onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}>
                <LineChart
                    data={{
                        labels: graphScale,
                        datasets: [
                            {
                                data: [Object.values(day.feels_like)[2], Object.values(day.feels_like)[0], Object.values(day.feels_like)[1], Object.values(day.feels_like)[3]]
                            }
                        ]
                    }}
                    width={cardWidth} // from react-native
                    height={150}
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
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#ffa726"
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>
        </>
    )
}

export default DailyForecastExpanded