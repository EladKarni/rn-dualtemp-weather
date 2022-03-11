import { StyleSheet } from 'react-native'
import { shadowProp } from '../../Styles/BoxShadow'

export const styles = StyleSheet.create({
    card: {
        width: '100%',
        height: 265,
        borderRadius: 26,
        padding: 18,
        // boxShadow: `0px 4px 30px rgba(112, 95, 244, 0.31)`,
        ...shadowProp,
        justifyContent: 'space-between'
    }
})