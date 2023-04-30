import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const DailyForecastExtendedItemStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginRight: 17,
    },
    InfoSectionContainer: {
        width: '35%',
        maxWidth: 200,
        marginLeft: 17,
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    GraphSectionContainer: {
        width: '65%',
        justifyContent: 'flex-end'
    },
    InfoSectionTextUnit: {
        maxWidth: 180,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    InfoSectionText: {
        color: palette.textColor,
        textAlign: 'left',
        marginLeft: 15,
        alignContent: 'center',
        fontSize: 16
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
        textAlign: 'right',
        fontSize: 14,
        lineHeight: 14
    },
    tempContainer: {
        textAlignVertical: 'bottom',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    horizontalText: {
        marginLeft: 15,
        width: 80,
        alignItems: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
})