import { StyleSheet } from 'react-native'
import { palette } from '../../Styles/Palette'

export const styles = StyleSheet.create({
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
        width: 75,
        height: 155,
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderRadius: 60,
        margin: 7.5,
    }
})