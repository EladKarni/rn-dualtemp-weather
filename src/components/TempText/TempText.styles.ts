import { StyleSheet } from 'react-native';

export const TempTextStyles = StyleSheet.create({
    temp: {
        textAlign: "center",
        // A reading is "28°C" left-to-right whatever the UI language, so pin the
        // run's direction rather than letting it inherit the paragraph's. Belt
        // and braces alongside rendering the unit letter in the same Text run:
        // the letter used to be a nested <Text> with its own padding, and an
        // inline span inside a right-aligned parent gets laid out past the
        // measured bounds once the paragraph resolves RTL — on a Hebrew device
        // the trailing C was simply clipped away, silently.
        writingDirection: "ltr",
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