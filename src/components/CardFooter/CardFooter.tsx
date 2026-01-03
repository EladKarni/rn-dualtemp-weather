import React, { useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLanguageStore } from '../../store/useLanguageStore';
import { CardFooterStyles } from './CardFooter.Styles';
import { AppStateContext } from '../../utils/AppStateContext';
import { typography } from '../../Styles/Typography';
import { i18n } from "../../localization/i18n";
import "intl";
import "intl/locale-data/jsonp/he";

const CardFooter = () => {
  const context = useContext(AppStateContext);
  const isRTL = useLanguageStore(state => state.isRTL);

  const [updatedString, setUpdatedString] = useState<string>();

  useEffect(() => {
    const updateStringFunc = setInterval(
      () => setUpdatedString(context?.date.fromNow()),
      100
    );

    return () => clearInterval(updateStringFunc);
  }, [updatedString, context]);

  return (
    <View style={[CardFooterStyles.cardFooter, isRTL && CardFooterStyles.cardFooterRTL]}>
      <Text style={typography.footerText} numberOfLines={1} adjustsFontSizeToFit={true}>
        <Text>
          {i18n.t("Updated")}
        </Text>
        <Text>
          {updatedString}
        </Text>
      </Text>
    </View>
  );
};

export default CardFooter;