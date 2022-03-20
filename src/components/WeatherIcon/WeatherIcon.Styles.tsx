import { ImageStyle, StyleSheet, TextStyle } from 'react-native';
import { typography } from '../../Styles/Typography';

type Style = {
    weatherPreview: ImageStyle;
    weatherDisc: TextStyle;
};

export const WeatherIconStyles = StyleSheet.create<Style>({
    weatherPreview: {
        resizeMode: 'contain',
        alignContent: 'center',
    },
    weatherDisc: {
        ...typography.headerText,
        textTransform: 'capitalize',
        textAlign: 'center'
    },
});