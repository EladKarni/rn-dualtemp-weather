import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastExtendedItemStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 10
    },
    InfoSectionContainer: {
        width: '35%',
        marginLeft: 15,
        justifyContent: 'space-between',
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
        textAlignVertical: 'bottom',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    horizontalText: {
        width: 70,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
})