import React from 'react';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import moment from 'moment';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';

interface HourlyForecastItemProps {
    temp: number;
    dt: number;
    icon: string;
    pop: number;
}

const HourlyForecastItem = ({ temp, dt, icon, pop }: HourlyForecastItemProps) => {
    return (
        <Card cardType={CardStyleTypes.HOURLY}>
            <View style={HourlyForecastItemStyles.HourlyItem}>
                <Text style={HourlyForecastItemStyles.HourText}>
                    {moment.unix(dt).format('HH:mm').toUpperCase()}
                </Text>
                <Text style={HourlyForecastItemStyles.HourRain}>
                    {(pop * 100).toFixed(0)}% Rain
                </Text>
                <WeatherIcon icon={displayWeatherIcon(icon)} iconSize={IconSizeTypes.MEDIUM} />
                <View>
                    <TempText
                        temp={temp}
                        tempType="C"
                        textStyleType={TempTextStyleTypes.HOURLY}
                        withSym={true}
                    />
                    <TempText
                        temp={temp}
                        tempType="F"
                        textStyleType={TempTextStyleTypes.HOURLY}
                        withSym={true}
                    />
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    hour: {
        flex: 1,
        padding: 6,
        height: 100,
        alignItems: 'center',
        color: '#fff',
        justifyContent: 'space-between'
    },
});

export default HourlyForecastItem;
