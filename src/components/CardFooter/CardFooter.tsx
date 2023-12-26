import React, { useContext, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { CardFooterStyles } from './CardFooter.Styles';
import { AppStateContext } from '../../utils/AppStateContext';
import { typography } from '../../Styles/Typography';
import { i18n } from "../../localization/i18n";
import "intl";
import "intl/locale-data/jsonp/he";

const CardFooter = () => {
  const context = useContext(AppStateContext);

  const [updatedString, setUpdatedString] = useState<string>();

  useEffect(() => {
    // console.log(
    //   new Intl.DateTimeFormat("he", {
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric",
    //   }).format(new Date(context?.date.fromNow()))
    // );
    const updateStringFunc = setInterval(
      () => setUpdatedString(context?.date.fromNow()),
      100
    );

    return () => clearInterval(updateStringFunc);
  }, [updatedString, context]);

  return (
    <View style={CardFooterStyles.cardFooter}>
      <Text style={[typography.headerText, CardFooterStyles.footerText]}>
        {i18n.t("Updated")}
        {updatedString}
      </Text>
    </View>
  );
};

export default CardFooter;