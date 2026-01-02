import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AppStateContext } from '../../utils/AppStateContext';

import { cardHeaderStyles } from './CardHeader.Styles';
import { typography } from '../../Styles/Typography';
import { i18n } from "../../localization/i18n";

const CardHeader = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    return null;
  }

  return (
    <View style={cardHeaderStyles.cardHeader}>
      <Text style={[typography.headerText, cardHeaderStyles.todayText]}>
        {i18n.t("Today")}
      </Text>
      <Text style={[typography.headerText, cardHeaderStyles.dateText]}>
        {context.date?.format("LL") ?? ""}
      </Text>
    </View>
  );
};

export default CardHeader;