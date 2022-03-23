import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';


export const HourlyForecastStyles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
    },
});

export const HourlyForecastItemStyles = StyleSheet.create({
    HourlyItem: {
        justifyContent: 'space-between',
        height: '100%',
        alignContent: 'center'
    },
    HourText: {
        color: palette.white,
        textAlign: 'center'
    }
})