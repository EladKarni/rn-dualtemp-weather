import { View, Text, Image, ImageSourcePropType } from 'react-native'
import React from 'react'

import { WeatherIconStyles } from './WeatherIcon.Styles'

type weatherIconPropsType = {
    icon: ImageSourcePropType;
    disc: string;
}

const WeatherIcon = (props: weatherIconPropsType) => {
    return (
        <View>
            <Image source={props.icon} style={WeatherIconStyles.weatherPreview} />
            <Text style={WeatherIconStyles.weatherDisc}>{props.disc}</Text>
        </View>
    )
}

export default WeatherIcon