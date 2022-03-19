import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppStateContext } from '../../../App';
import { CardFooterStyles } from './CardFooter.Styles';

const CardFooter = () => {
    const context = useContext(AppStateContext);

    return (
        <View style={CardFooterStyles.cardFooter}>
            <Text style={CardFooterStyles.footerText}>Last Updated: {context?.date.format('HH:mm')}</Text>
        </View>
    )
}

export default CardFooter;