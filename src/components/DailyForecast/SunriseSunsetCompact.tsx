import { View, Text, StyleSheet } from "react-native";
import WeatherIcon, { IconSizeTypes } from "../WeatherIcon/WeatherIcon";
import { displayWeatherIcon } from "../../utils/Images";
import { useTimeFormatting } from "../../utils/dateFormatting";
import { useLanguageStore } from "../../store/useLanguageStore";
import { palette } from "../../Styles/Palette";

type SunriseSunsetCompactProps = {
  sunrise: number;
  sunset: number;
};

const SunriseSunsetCompact = ({ sunrise, sunset }: SunriseSunsetCompactProps) => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const { formatSunTime } = useTimeFormatting();

  return (
    <View style={styles.sunriseSunsetContainer}>
      <View style={[styles.sunInfoPair, isRTL && styles.sunInfoPairRTL]}>
        <WeatherIcon 
          icon={displayWeatherIcon('sunrise')} 
          iconSize={IconSizeTypes.SMALL} 
        />
        <Text style={[styles.timeText, isRTL && styles.timeTextRTL]}>
          {formatSunTime(sunrise)}
        </Text>
      </View>
      
      <View style={[styles.sunInfoPair, isRTL && styles.sunInfoPairRTL]}>
        <WeatherIcon 
          icon={displayWeatherIcon('sunset-png')} 
          iconSize={IconSizeTypes.SMALL} 
        />
        <Text style={[styles.timeText, isRTL && styles.timeTextRTL]}>
          {formatSunTime(sunset)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sunriseSunsetContainer: {
    width: '75%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  sunInfoPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sunInfoPairRTL: {
    flexDirection: 'row-reverse',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textColor,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  timeTextRTL: {
    textAlign: 'right',
  },
});

export default SunriseSunsetCompact;