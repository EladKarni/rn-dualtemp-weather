import { StyleSheet } from 'react-native';

export const TempTextStyles = StyleSheet.create({
    temp: {
        textAlign: "center",
    },
    tempLastLetter: {
        textAlignVertical: 'top',
        paddingHorizontal: 2,
    },
    tempCurrentMain: {
        textAlign: 'right',
        fontSize: 60,
        lineHeight: 78
    },
    tempCurrentSecondary: {
        textAlign: 'right',
        fontSize: 30,
        lineHeight: 39
    },
    tempHourly: {
        fontSize: 14,
        lineHeight: 14,
    },
    tempDaily: {
        fontSize: 12,
        lineHeight: 16,
    }
});