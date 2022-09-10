import { BackHandler, StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastExtendedItemStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 10
    },
    InfoSectionContainer: {
        width: '40%',
        marginLeft: -20,
        justifyContent: 'space-between',
        marginBottom: 5
    },
    InfoSectionTextUnit: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    InfoSectionText: {
        color: palette.grayLight,
        textAlign: 'left',
        alignContent: 'center',
        fontSize: 16
    },
    infoFeelTitle: {
        color: palette.grayLight,
        paddingVertical: 5,
        textAlign: 'center',
        alignContent: 'center',
        textDecorationLine: 'underline',
        fontSize: 20
    },
    infoFeelTime: {
        color: palette.grayLight,
        textAlign: 'left',
        alignContent: 'center',
        fontSize: 14,
        lineHeight: 14
    },
    tempContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    horizontalText: {
        flexDirection: 'row',
        width: 70,
        justifyContent: 'space-between'
    }
})