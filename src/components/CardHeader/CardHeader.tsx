import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppStateContext } from '../../utils/AppStateContext';

import { cardHeaderStyles } from './CardHeader.Styles';
import { typography } from '../../Styles/Typography';

const CardHeader = () => {
  const context = useContext(AppStateContext);

  return (
    <View style={cardHeaderStyles.cardHeader}>
      <Text style={[typography.headerText, cardHeaderStyles.todayText]}>Today</Text>
      <Text style={[typography.headerText, cardHeaderStyles.dateText]}>{context?.date.format('MMMM Do YYYY')}</Text>
    </View>
  )
}

export default CardHeader;