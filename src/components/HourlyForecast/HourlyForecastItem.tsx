import React from 'react';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import { View, Text, StyleSheet } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import moment from 'moment';
import TempText from '../TempText/TempText';
import Card from '../Card/Card';
import { HourlyForecastItemStyles } from './HourlyForecast.Styles';

interface HourlyForecastItemProps {
    temp: number;
    dt: number;
    icon: string;
}

const HourlyForecastItem = ({ temp, dt, icon }: HourlyForecastItemProps) => {
    return (
        <Card w={80} h={160} pv={20} ph={5} br={60} m={10}>
            <View style={{ ...HourlyForecastItemStyles.HourlyItem, height: '100%', alignContent: 'center' }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>
                    {moment.unix(dt).format('h:mm ').toUpperCase()}
                </Text>
                <WeatherIcon icon={displayWeatherIcon(icon)} w={50} h={50} />
                <View>
                    <TempText
                        temp={Math.round(temp).toString()}
                        type="C"
                        fs={14}
                        lh={14}
                        withSym={true}
                    />
                    <TempText
                        temp={Math.round((temp * 9 / 5) + 32).toString()}
                        type="F"
                        fs={14}
                        lh={14}
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
