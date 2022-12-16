import { StyleSheet } from 'react-native'
import { palette } from '../../Styles/Palette'

export const CardStyles = StyleSheet.create({
    card: {
        justifyContent: 'space-between',
        marginBottom: 25,
        shadowColor: palette.shadowLight,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.31,
        shadowRadius: 30,
        elevation: 10,
    },
    cardMain: {
        borderRadius: 26,
        marginHorizontal: 20,
        padding: 18,
    },
    cardHourly: {
        justifyContent: 'space-between',
        width: 65,
        height: 155,
        paddingVertical: 12,
        borderRadius: 32,
        margin: 7.5,
        shadowRadius: 15,
    },
    cardDaily: {
        height: 50,
        paddingVertical: 7.5,
        borderRadius: 15,
        marginVertical: 7.5,
        paddingHorizontal: 5,
        shadowRadius: 10
    },
    cardDailyExpanded: {
        paddingVertical: 7.5,
        borderRadius: 15,
        marginVertical: 7.5,
        paddingHorizontal: 5,
        shadowRadius: 10
    }
})