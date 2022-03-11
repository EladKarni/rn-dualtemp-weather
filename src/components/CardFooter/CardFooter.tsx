import React from 'react';
import { View, Text } from 'react-native';
import { CardFooterStyles } from './CardFooter.Styles';


const CardFooter = () => {
    return (
        <View style={CardFooterStyles.cardFooter}>
            <Text style={CardFooterStyles.footerText}>Loading Location...</Text>
        </View>
    )
}

export default CardFooter;