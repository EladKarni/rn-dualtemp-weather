import { View, Text } from "react-native";
import { DailyForecastExtendedItemStyles } from "./DailyForecastExtendedItemStyles.Styles";
import WeatherIcon, { IconSizeTypes } from "../WeatherIcon/WeatherIcon";
import { displayWeatherIcon } from "../../utils/Images";
import { i18n } from "../../localization/i18n";
import { useTimeFormatting } from "../../utils/dateFormatting";
import { useLanguageStore } from "../../store/useLanguageStore";

type SunInfoProps = {
  time: number;
  type: 'sunrise' | 'sunset';
};

const SunInfo = ({ time, type }: SunInfoProps) => {
  const iconType = type === 'sunrise' ? '01d' : 'sunset';
  const translationKey = type.charAt(0).toUpperCase() + type.slice(1);
  const isRTL = useLanguageStore((state) => state.isRTL);
  const { formatSunTime } = useTimeFormatting();

  return (
    <View style={[  DailyForecastExtendedItemStyles.InfoSectionTextUnit, isRTL && DailyForecastExtendedItemStyles.InfoSectionTextRTL ]}>
      <WeatherIcon
        icon={displayWeatherIcon(iconType)}
        iconSize={IconSizeTypes.TINY}
      />
      <Text
        style={[DailyForecastExtendedItemStyles.InfoSectionTextLG, isRTL && DailyForecastExtendedItemStyles.InfoSectionTextRTL]}
        allowFontScaling={false}
      >
        {i18n.t(translationKey)}
      </Text>
      <Text
        style={[DailyForecastExtendedItemStyles.InfoSectionTextLG, isRTL && DailyForecastExtendedItemStyles.InfoSectionTextRTL]}
        allowFontScaling={false}
      >
        {formatSunTime(time)}
      </Text>
    </View>
  );
};

export default SunInfo;