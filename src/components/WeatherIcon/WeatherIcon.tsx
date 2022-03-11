import { View, Text, Image, ImageSourcePropType } from 'react-native'
import React from 'react'

import { WeatherIconStyles } from './WeatherIcon.Styles'

type weatherIconPropsType = {
    icon: ImageSourcePropType;
    w: number;
    h: number;
    disc?: string;
}

const WeatherIcon = ({ icon, w, h, disc }: weatherIconPropsType) => {
    return (
        <View style={{ alignItems: 'center' }}>
            <Image source={icon} style={{ ...WeatherIconStyles.weatherPreview, width: w, height: h }} />
            {disc && <Text style={WeatherIconStyles.weatherDisc}>{disc}</Text>}
        </View>
    )
}

export default WeatherIcon