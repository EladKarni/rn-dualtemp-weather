import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastStyles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
    },
});

export const DailyForecastItemStyles = StyleSheet.create({
    dailyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    dailyItemExpanded: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 15,
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
    },
    descriptionText: {
        color: palette.grayLight,
        textTransform: 'capitalize',
        fontSize: 12
    },
    rainChancesText: {
        color: palette.grayLight,
        fontSize: 12
    },
    expandedTempAreaContainer: {
        height: '100%',
        justifyContent: 'space-between'
    },
    sideBySideTempContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    sideBySideTempText: {
        color: palette.grayLight,
        paddingRight: 5
    },
    sunCycleContainer: {
        justifyContent: 'flex-start'
    },
    sunCycleText: {
        color: palette.grayLight,
        fontSize: 16
    },
})