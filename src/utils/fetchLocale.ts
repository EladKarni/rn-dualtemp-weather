import moment from "moment";
import { getLanguage } from "react-native-localization-settings";
import { uses24HourClock } from "react-native-localize";
import { translations, i18n } from "../localization/i18n";

export const fetchLocale = () => {
    const clockStyle = uses24HourClock() ? "HH:mm" : "h:mm a";
    moment().format(clockStyle);
    const userLocale = getLanguage().split("-")[0];
    //If locale isn't in the translations object, it'll default to English
    const deviceLocal = translations[userLocale] ? userLocale : "en";
    i18n.locale = deviceLocal;
    moment.locale(deviceLocal);
    return moment();
  };