import { View, Text, Image, ImageSourcePropType } from 'react-native'
import React from 'react'

import { WeatherIconStyles } from './WeatherIcon.Styles'

type weatherIconPropsType = {
    icon: ImageSourcePropType;
    iconSize: IconSizeTypes;
    disc?: string;
}

export enum IconSizeTypes {
    LARGE = 'iconLarge',
    MEDIUM = 'iconMedium',
    SMALL = 'iconSmall',
    TINY = 'iconTiny'
}

const WeatherIcon = ({ icon, iconSize, disc }: weatherIconPropsType) => {
    return (
        <View style={WeatherIconStyles.weatherIconContainer}>
            <Image source={icon} style={[WeatherIconStyles.weatherPreview, WeatherIconStyles[iconSize]]} />
            {disc && <Text style={WeatherIconStyles.weatherDisc}>{disc}</Text>}
        </View>
    )
}

export default WeatherIcon