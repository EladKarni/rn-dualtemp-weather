import React from 'react';
import { View } from 'react-native';
import { displayWeatherIcon } from '../../utils/Images';
import { WeatherEntity } from '../../types/WeatherTypes';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { TempTextStyleTypes } from '../TempText/TempText';
import Card, { CardStyleTypes } from '../Card/Card';

import { CurrentWeatherStyles } from './CurrentWeatherCard.Styles'
import CardHeader from '../CardHeader/CardHeader';
import CardFooter from '../CardFooter/CardFooter';
import DualTempText from '../TempText/DualTempText';
import { useLanguageStore } from '../../store/useLanguageStore';

type CurrentWeatherProps = {
    temp: number;
    weather: WeatherEntity;
}

const CurrentWeatherCard = ({ temp, weather }: CurrentWeatherProps) => {
    const isRTL = useLanguageStore(state => state.isRTL);

    return (
        <>
            <Card cardType={CardStyleTypes.MAIN} >
                <CardHeader />
                <View style={[CurrentWeatherStyles.mainArea, isRTL && CurrentWeatherStyles.mainAreaRTL]}>
                    <WeatherIcon icon={displayWeatherIcon(weather?.icon)} iconSize={IconSizeTypes.LARGE} disc={weather.description} />
                    <View style={CurrentWeatherStyles.tempArea}>
                        <DualTempText
                            temp={temp}
                            tempStyleC={TempTextStyleTypes.MAIN}
                            tempStyleF={TempTextStyleTypes.SECONDARY}
                            degree
                        />
                    </View>
                </View>
                <CardFooter />
            </Card>
        </>
    )
};

export default CurrentWeatherCard;
