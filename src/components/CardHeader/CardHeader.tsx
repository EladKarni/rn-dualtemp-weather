import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppStateContext } from '../../../App';

import { cardHeaderStyles } from './CardHeader.Styles';

const CardHeader = () => {
  const context = useContext(AppStateContext);

  return (
    <View style={cardHeaderStyles.cardHeader}>
      <Text style={cardHeaderStyles.todayText}>Today</Text>
      <Text style={cardHeaderStyles.dateText}>{context?.date.format('MMMM Do YYYY')}</Text>
    </View>
  )
}

export default CardHeader;