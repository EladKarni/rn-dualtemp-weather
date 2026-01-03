import React from 'react';
import { Text } from 'react-native';

import { SubTitleStyles } from './Subtitle.Styles'
import { useLanguageStore } from '../../store/useLanguageStore';

interface TitleProps {
    text: string;
}

const Subtitle = ({ text }: TitleProps) => {
    const isRTL = useLanguageStore((state) => state.isRTL);
    return (
        <>
            <Text style={[SubTitleStyles.subtitle, isRTL && SubTitleStyles.subtitleRTL]}>{text}</Text>
        </>
    );
};

export default Subtitle;
