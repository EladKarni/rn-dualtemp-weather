import React from 'react';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import moment from 'moment';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';
import DualTempText from '../TempText/DualTempText';

interface HourlyForecastItemProps {
    temp: number;
    dt: number;
    icon: string;
    pop: number;
}

const HourlyForecastItem = ({ temp, dt, icon, pop }: HourlyForecastItemProps) => {
    const downFallType = temp > 0 ? "Rain" : "Snow"

    return (
        <Card cardType={CardStyleTypes.HOURLY}>
            <View style={HourlyForecastItemStyles.HourlyItem}>
                <Text style={HourlyForecastItemStyles.HourText}>
                    {moment.unix(dt).format('HH:mm').toUpperCase()}
                </Text>
                <Text style={HourlyForecastItemStyles.HourRain}>
                    {(pop * 100).toFixed(0)}% {downFallType}
                </Text>
                <WeatherIcon icon={displayWeatherIcon(icon)} iconSize={IconSizeTypes.MEDIUM} />
                <View style={styles.temp}>
                    <DualTempText
                        temp={temp}
                        tempStyleC={TempTextStyleTypes.HOURLY}
                        degree
                    />
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    temp: {
        marginTop: 5
    },
});

export default HourlyForecastItem;
