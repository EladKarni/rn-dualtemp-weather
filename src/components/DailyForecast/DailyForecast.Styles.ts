import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastStyles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
    },
});

export const DailyForecastItemStyles = StyleSheet.create({
    dailyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        alignItems: 'center',

    },
    dayText: {
        color: palette.grayLight,
        textAlign: 'center',
        alignContent: 'center',
        fontSize: 18
    }
})