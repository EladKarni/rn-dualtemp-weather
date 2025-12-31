import { getLanguage } from "react-native-localization-settings";
import { uses24HourClock } from "react-native-localize";
import { translations, i18n } from "../localization/i18n";
import { useLanguageStore } from "../store/useLanguageStore";

import moment from "moment";
import "moment/locale/he";
import "moment/locale/es";
import "moment/locale/ar";
import "moment/locale/fr";
import "moment/locale/zh-cn";

export const fetchLocale = () => {
  const clockStyle = uses24HourClock() ? "HH:mm" : "h:mm a";
  const deviceLanguage = getLanguage().split("-")[0];

  // Check if user has manually selected a language
  const selectedLanguage = useLanguageStore.getState().selectedLanguage;
  const userLocale = selectedLanguage || deviceLanguage;

  // If locale isn't in the translations object, it'll default to English
  const locale = translations[userLocale] ? userLocale : "en";
  i18n.locale = locale;
  moment.locale(locale === "zh" ? "zh-cn" : locale);
  return moment().locale(i18n.locale);
};
