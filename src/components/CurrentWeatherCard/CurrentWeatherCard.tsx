import React from 'react';
import { View } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { WeatherEntity } from '../../types/WeatherTypes';
import WeatherIcon from '../WeatherIcon/WeatherIcon';
import TempText, { TempTextStyleTypes } from '../TempText/TempText';
import Card from '../Card/Card';

import { CurrentWeatherStyles } from './CurrentWeatherCard.Styles'
import CurrentWeatherLoading from '../CurrentWeatherLoading/CurrentWeatherLoading';
import CardHeader from '../CardHeader/CardHeader';
import CardFooter from '../CardFooter/CardFooter';

type CurrentWeatherPropsType = {
    temp: number;
    weather: WeatherEntity;
}

const CurrentWeather = ({ temp, weather }: CurrentWeatherPropsType) => {
    return (
        <Card cardType="main" >
            <CardHeader />
            <View style={CurrentWeatherStyles.mainArea}>
                <WeatherIcon icon={displayWeatherIcon(weather?.icon)} w={115} h={115} disc={weather.description} />
                <View style={CurrentWeatherStyles.tempArea}>
                    <TempText temp={temp} tempType="C" withSym={true} textStyleType={TempTextStyleTypes.MAIN} />
                    <TempText temp={temp} tempType="F" withSym={true} textStyleType={TempTextStyleTypes.SECONDARY} />
                </View>
            </View>
            <CardFooter />
        </Card>
    )
};

export default CurrentWeather;