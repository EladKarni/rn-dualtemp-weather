import { View, Text } from 'react-native'
import React from 'react'
import { TempTextStyles } from './TempText.Styles'
import { typography } from '../../Styles/Typography';

type TempTextPropsType = {
    textStyleType: TempTextStyleTypes;
    withSym: boolean;
    temp: number;
    tempType?: string;
}

export enum TempTextStyleTypes {
    MAIN = 'tempCurrentMain',
    SECONDARY = 'tempCurrentSecondary',
    HOURLY = 'tempHourly',
    DAILY = 'tempDaily'
}

const TempText = ({ temp, withSym, tempType, textStyleType }: TempTextPropsType) => {
    return (
        <Text style={[typography.headerText, TempTextStyles.temp, TempTextStyles[textStyleType]]}>
            {tempType?.toUpperCase() !== 'F' ? Math.round(temp) : Math.round((temp * 9 / 5) + 32)}
            {withSym ? '°' : null}
            <Text style={TempTextStyles.tempLastLetter}>{tempType}</Text>
        </Text >
    )
}

export default TempText