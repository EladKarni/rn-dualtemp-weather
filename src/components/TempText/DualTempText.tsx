import { Text } from 'react-native'
import React from 'react'
import { DailyForecastItemStyles } from '../DailyForecast/DailyForecast.Styles'
import TempText, { TempTextStyleTypes } from './TempText'

type DualTempTextProps = {
    temp: number;
    tempStyleC: TempTextStyleTypes;
    tempStyleF?: TempTextStyleTypes;
    degree?: boolean;
    divider?: boolean;
}


const DualTempText = ({ temp, tempStyleC, tempStyleF = tempStyleC, degree = false, divider = false }: DualTempTextProps) => {
    return (
        <>
            <TempText
                temp={temp}
                textStyleType={tempStyleC}
                tempType='C'
                withSym={degree}
            />
            {divider && <Text style={DailyForecastItemStyles.tempDivider}> | </Text>}
            <TempText
                temp={temp}
                textStyleType={tempStyleF}
                tempType='F'
                withSym={degree}
            />
        </>
    )
}

export default DualTempText