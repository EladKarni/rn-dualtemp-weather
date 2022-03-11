import { ImageStyle, StyleSheet, TextStyle } from 'react-native';
import { headerText } from '../../Styles/Typography';

type Style = {
    weatherPreview: ImageStyle;
    weatherDisc: TextStyle;
};

export const WeatherIconStyles = StyleSheet.create<Style>({
    weatherPreview: {
        resizeMode: 'contain',
    },
    weatherDisc: {
        ...headerText,
        textTransform: 'capitalize',
        textAlign: 'center'
    },
});