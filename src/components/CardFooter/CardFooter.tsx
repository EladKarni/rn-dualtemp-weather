import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useLanguageStore } from '../../store/useLanguageStore';
import { CardFooterStyles } from './CardFooter.Styles';
import { typography } from '../../Styles/Typography';
import { i18n } from "../../localization/i18n";
import "intl";
import "intl/locale-data/jsonp/he";
import { useSettingsStore } from '../../store/useSettingsStore';

const CardFooter = () => {
  const isRTL = useLanguageStore(state => state.isRTL);
  const lastTimeUpdated = useSettingsStore(state => state.lastUpdated);
  const [updatedString, setUpdatedString] = useState<string>(lastTimeUpdated ? lastTimeUpdated.fromNow() : '');

  useEffect(() => {
    if (!lastTimeUpdated) return;
    
    const updateStringFunc = setInterval(
      () => setUpdatedString(lastTimeUpdated.fromNow()),
      100
    );

    return () => clearInterval(updateStringFunc);
  }, [lastTimeUpdated]);

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