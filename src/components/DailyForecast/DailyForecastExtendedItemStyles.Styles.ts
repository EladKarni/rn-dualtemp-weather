import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastExtendedItemStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingTop: 5
    },
    InfoSectionContainer: {
        flex: 2,
        justifyContent: 'space-between',
    },
    InfoSectionTextUnit: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    InfoSectionText: {
        color: palette.textColor,
        alignContent: 'center',
        fontSize: 16
    },
    SunMoonSectionText: {
        color: palette.textColor,
        alignContent: 'center',
        fontSize: 18
    },
    infoFeelTitle: {
        color: palette.textColor,
        paddingVertical: 5,
        textAlign: 'center',
        alignContent: 'center',
        textDecorationLine: 'underline',
        fontSize: 20
    },
    infoFeelTime: {
        color: palette.textColor,
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
    },
    SectionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    Flex1: {
        flex: 1
    }
})