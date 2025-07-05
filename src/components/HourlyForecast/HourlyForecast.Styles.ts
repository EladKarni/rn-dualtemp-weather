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
        alignContent: 'center',
    },
    HourText: {
        color: palette.textColor,
        textAlign: 'center'
    },
    HourWindInfo: {
        display: 'flex',
        flexDirection: 'row',
        marginHorizontal: 'auto',
        justifyContent: 'center',
        gap: 3
    }
})