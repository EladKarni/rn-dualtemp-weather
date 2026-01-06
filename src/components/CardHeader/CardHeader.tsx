import React, { useContext } from "react";
import { View, Text } from "react-native";
import { AppStateContext } from "../../utils/AppStateContext";
import { formatCurrentDate } from "../../utils/dateFormatting";

import { cardHeaderStyles } from "./CardHeader.Styles";
import { typography } from "../../styles/Typography";
import { i18n } from "../../localization/i18n";
import { useLanguageStore } from "../../store/useLanguageStore";

const CardHeader = () => {
  const context = useContext(AppStateContext);
  const isRTL = useLanguageStore((state) => state.isRTL);
  if (!context) {
    return null;
  }

  return (
    <View
      style={[
        cardHeaderStyles.cardHeader,
        isRTL && cardHeaderStyles.cardHeaderRTL,
      ]}
    >
      <Text
        style={[typography.headerText, cardHeaderStyles.todayText]}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        {i18n.t("Today")}
      </Text>
      <View style={cardHeaderStyles.dateContainer}>
        <Text
          style={[typography.headerText, cardHeaderStyles.dateText]}
          numberOfLines={2}
          adjustsFontSizeToFit={true}
        >
          {formatCurrentDate(context.date)}
        </Text>
      </View>
    </View>
  );
};

export default CardHeader;
