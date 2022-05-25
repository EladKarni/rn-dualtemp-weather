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
    },
    tempIconContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center'        
    },
    tempContainer: {
        flexDirection: 'row',
        height: 17.5,
        paddingHorizontal: 10
    },
    tempDivider: {
        fontStyle: 'italic',
        lineHeight: 17.5,
        color: palette.grayLight
    }
})