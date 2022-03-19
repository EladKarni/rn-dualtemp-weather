import React from 'react';
import { View } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { WeatherEntity } from '../../types/WeatherTypes';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import TempText from '../TempText/TempText';
import Card from '../Card/Card';

import { CurrentWeatherStyles } from './CurrentWeatherCard.Styles'
import CurrentWeatherLoading from '../CurrentWeatherLoading/CurrentWeatherLoading';
import CardHeader from '../CardHeader/CardHeader';
import CardFooter from '../CardFooter/CardFooter';

type CurrentWeatherPropsType = {
    temp?: number;
    weather?: WeatherEntity;
}

const CurrentWeather = (props: CurrentWeatherPropsType) => {
    if (props.temp === undefined || props.weather === undefined) {
        // return <CurrentWeatherLoading date={props.date} />
        return null
    }

    return (
        <Card cardType="main" >
            <CardHeader />
            <View style={CurrentWeatherStyles.mainArea}>
                <WeatherIcon icon={displayWeatherIcon(props.weather?.icon)} w={115} h={115} disc={props.weather.description} />
                <View style={CurrentWeatherStyles.tempArea}>
                    <TempText temp={Math.round(props.temp).toString()} type="C" fs={60} lh={78} withSym={true} />
                    <TempText temp={Math.round((props.temp * 9 / 5) + 32).toString()} type="F" fs={30} lh={39} withSym={true} />
                </View>
            </View>
            <CardFooter />
        </Card>
    )
};

export default CurrentWeather;