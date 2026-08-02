import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import moment from "moment";
import { useLanguageStore } from "../../store/useLanguageStore";
import { CardFooterStyles } from "./CardFooter.styles";
import { typography } from "../../styles/Typography";
import { i18n } from "../../localization/i18n";
import "intl";
import "intl/locale-data/jsonp/he";
import { useSettingsStore } from "../../store/useSettingsStore";

// `lastUpdated` is persisted as an ISO-8601 string (see useSettingsStore). Any
// missing or legacy (non-string) value yields an empty relative string rather
// than throwing.
const formatUpdated = (value: unknown): string =>
  typeof value === "string" && moment(value).isValid()
    ? moment(value).fromNow()
    : "";

const CardFooter = () => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const isHydrated = useSettingsStore((state) => state.isHydrated);
  const lastTimeUpdated = useSettingsStore((state) => state.lastUpdated);

  const [updatedString, setUpdatedString] = useState<string>(() =>
    formatUpdated(lastTimeUpdated)
  );

  useEffect(() => {
    // Recompute immediately when the timestamp changes (don't wait for the first
    // interval tick — this also corrects the brief post-hydration "" transient),
    // then keep the relative string fresh every second.
    setUpdatedString(formatUpdated(lastTimeUpdated));

    if (typeof lastTimeUpdated !== "string" || !moment(lastTimeUpdated).isValid())
      return;

    const updateStringFunc = setInterval(
      () => setUpdatedString(formatUpdated(lastTimeUpdated)),
      1000
    );

    return () => clearInterval(updateStringFunc);
  }, [lastTimeUpdated]);

  // Don't render until store is hydrated
  if (!isHydrated) {
    return (
      <View
        style={[
          CardFooterStyles.cardFooter,
          isRTL && CardFooterStyles.cardFooterRTL,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        CardFooterStyles.cardFooter,
        isRTL && CardFooterStyles.cardFooterRTL,
      ]}
    >
      <Text
        style={typography.footerText}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      >
        <Text>{i18n.t("Updated")}</Text>
        <Text>{updatedString}</Text>
      </Text>
    </View>
  );
};

export default CardFooter;
