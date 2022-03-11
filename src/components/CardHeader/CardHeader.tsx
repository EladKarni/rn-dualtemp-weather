import React from 'react';
import { View, Text } from 'react-native';

import { cardHeaderStyles } from './CardHeader.Styles';

type CardHeaderPropTypes = {
  date: string,
};


const CardHeader = (props: CardHeaderPropTypes) => {
  return (
    <View style={cardHeaderStyles.cardHeader}>
      <Text style={cardHeaderStyles.todayText}>Today</Text>
      <Text style={cardHeaderStyles.dateText}>{props.date}</Text>
    </View>
  )
}

export default CardHeader;