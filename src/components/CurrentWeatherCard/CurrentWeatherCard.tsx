import React from 'react';
import { View } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { WeatherEntity } from '../../types/WeatherTypes';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import TempText from '../TempText/TempText';
import Card from '../Card/Card';

import { CurrentWeatherStyles } from './CurrentWeatherCard.Styles'
import CurrentWeatherLoading from '../CurrentWeatherLoading/CurrentWeatherLoading';

type CurrentWeatherPropsType = {
    temp?: number;
    weather?: WeatherEntity;
    date: Date;
}

const CurrentWeather = (props: CurrentWeatherPropsType) => {
    if (props.temp === undefined || props.weather === undefined) {
        return <CurrentWeatherLoading date={props.date} />
    }

    console.log(props.weather)

    return (
        <Card date={props.date.toLocaleDateString()}>
            <View style={CurrentWeatherStyles.mainArea}>
                <WeatherIcon icon={displayWeatherIcon(props.weather?.icon)} disc={props.weather.description} />
                <View style={CurrentWeatherStyles.tempArea}>
                    <TempText temp={Math.round(props.temp).toString()} type="C" fs={60} lh={78} withSym={true} />
                    <TempText temp={Math.round((props.temp * 9 / 5) + 32).toString()} type="F" fs={30} lh={39} withSym={true} />
                </View>
            </View>
        </Card>
    )
};

export default CurrentWeather;