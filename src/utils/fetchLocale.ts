import { getLanguage } from "react-native-localization-settings";
import { uses24HourClock } from "react-native-localize";
import { translations, i18n } from "../localization/i18n";

import moment from "moment";
import "moment/locale/he";
import "moment/locale/es";
import "moment/locale/ar";
import "moment/locale/fr";

export const fetchLocale = () => {
  const clockStyle = uses24HourClock() ? "HH:mm" : "h:mm a";
  const userLocale = getLanguage().split("-")[0];
  //If locale isn't in the translations object, it'll default to English
  const deviceLocal = translations[userLocale] ? userLocale : "en";
  i18n.locale = deviceLocal;
  moment.locale(deviceLocal);
  return moment().locale(i18n.locale);
};
