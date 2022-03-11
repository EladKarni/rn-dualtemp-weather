import React from 'react';
import { Text } from 'react-native';

import { SubTitleStyles } from './Subtitle.Styles'

interface TitleProps {
    text: string;
}

const Subtitle = ({ text }: TitleProps) => {
    return (
        <>
            <Text style={SubTitleStyles.subtitle}>{text}</Text>
        </>
    );
};

export default Subtitle;
