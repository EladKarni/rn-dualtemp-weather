import { StyleSheet } from 'react-native';
import { headerText } from '../../Styles/Typography';

export const TempTextStyles = StyleSheet.create({
    temp: {
        ...headerText,
        textAlign: "right",
    },
    tempLastLetter: {
        textAlignVertical: 'top',
        paddingHorizontal: 2,
    },
});