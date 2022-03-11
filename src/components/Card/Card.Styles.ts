import { StyleSheet } from 'react-native'
import { shadowProp } from '../../Styles/BoxShadow'

export const styles = StyleSheet.create({
    card: {
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 25,
        ...shadowProp,
    }
})