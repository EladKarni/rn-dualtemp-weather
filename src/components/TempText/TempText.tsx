import { View, Text } from 'react-native'
import React from 'react'
import { TempTextStyles } from './TempText.Styles'

type TempTextPropsType = {
    withSym: boolean;
    temp: string;
    type?: string;
    fs: number;
    lh: number;
}

const TempText = (props: TempTextPropsType) => {
    return (
        <Text style={{ ...TempTextStyles.temp, fontSize: props.fs, lineHeight: props.lh }}>
            {props.temp}
            {props.withSym ? '°' : null}
            <Text style={TempTextStyles.tempLastLetter}>{props?.type}</Text>
        </Text>
    )
}

export default TempText