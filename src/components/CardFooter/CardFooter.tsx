import React, { useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppStateContext } from '../../../App';
import { CardFooterStyles } from './CardFooter.Styles';
import { Moment } from 'moment';

const CardFooter = () => {
    const context = useContext(AppStateContext);

    const [updatedString, setUpdatedString] = useState<string>()

    useEffect(() => {
        const updateStringFunc = setInterval(() => setUpdatedString(context?.date.fromNow()), 100)

        return () => clearInterval(updateStringFunc)
    }, [updatedString, context])


    return (
        <View style={CardFooterStyles.cardFooter}>
            <Text style={CardFooterStyles.footerText}>Last Updated: {updatedString}</Text>
        </View>
    )
}

export default CardFooter;