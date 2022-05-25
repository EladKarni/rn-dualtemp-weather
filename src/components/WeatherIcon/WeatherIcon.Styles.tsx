import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { typography } from '../../Styles/Typography';

// type Style = {
//     weatherIconContainer: ViewStyle;
//     weatherPreview: ImageStyle;
//     weatherDisc: TextStyle;
// };

export const WeatherIconStyles = StyleSheet.create({
    weatherIconContainer: {
        alignItems: 'center'
    },
    weatherPreview: {
        resizeMode: 'contain',
        alignContent: 'center',
    },
    weatherDisc: {
        ...typography.headerText,
        textTransform: 'capitalize',
        textAlign: 'center'
    },
    iconLarge: {
        width: 115,
        height: 115
    },
    iconMedium: {
        width: 50,
        height: 50
    },
    iconSmall: {
        width: 35,
        height: 35
    }
});