import { View, Text } from 'react-native'
import { DailyForecastExtendedItemStyles } from './DailyForecastExtendedItemStyles.Styles';
import { DailyEntity } from '../../types/WeatherTypes';
import React, { useContext, useState } from 'react'
import { LineChart } from 'react-native-chart-kit';
import { palette } from '../../Styles/Palette';
import moment from 'moment';
import WeatherIcon, { IconSizeTypes } from '../WeatherIcon/WeatherIcon';
import { displayWeatherIcon } from '../../utils/Images';
import DailyExpandedFeelInfo from './DailyExpandedFeelInfo';
import { AppStateContext } from '../../utils/AppStateContext';
import { i18n } from "../../localization/i18n";
import { getLocales } from "expo-localization";
import { TextDirection } from "../../Styles/TextDirection";

type DailyForecastItemExpandedPropTypes = {
  day: DailyEntity;
};

const DailyForecastExpanded = ({ day }: DailyForecastItemExpandedPropTypes) => {
  const graphScale = ["🌅", "🌞", "🌆", "🌃"];
  const [cardWidth, setCardWidth] = useState(0);

  const context = useContext(AppStateContext);
  const tempScale = context?.tempScale;
  const rtlStyles = {
    flex: 2,
    marginBottom: -20,
    marginLeft: -7,
    marginRight: 25,
    paddingRight: 50,
  };
  const ltrStyles = {
    flex: 2,
    marginBottom: -20,
    marginLeft: -20,
    marginRight: 25,
    paddingRight: 50,
  };
  const directionStyle =
    getLocales()[0].textDirection == "ltr" ? ltrStyles : rtlStyles;

  return (
    <>
      <View
        style={DailyForecastExtendedItemStyles.container}
        onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}
      >
        <LineChart
          data={{
            labels: graphScale,
            datasets: [
              {
                data: [
                  day.feels_like["morn"],
                  day.feels_like["day"],
                  day.feels_like["eve"],
                  day.feels_like["night"],
                ],
              },
            ],
          }}
          width={cardWidth / 1.5} // from react-native
          height={265}
          withVerticalLines={false}
          yAxisSuffix="°"
          yAxisInterval={1} // optional, defaults to 1
          fromZero
          formatYLabel={(temp) =>
            tempScale === "F"
              ? (parseInt(temp) * 1.8 + 32).toFixed(0).toString()
              : temp
          }
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientTo: "white",
            backgroundGradientFromOpacity: 0,
            backgroundGradientFrom: "white",
            backgroundGradientToOpacity: 0,
            decimalPlaces: 0, // optional, defaults to 2dp
            color: (opacity = 1) => palette.textColor,
            labelColor: (opacity = 1) => palette.textColor,
            propsForDots: {
              r: "5",
              strokeWidth: "1",
              stroke: palette.textColor,
            },
          }}
          bezier
          style={directionStyle}
        />
        <View style={DailyForecastExtendedItemStyles.InfoSectionContainer}>
          <View style={DailyForecastExtendedItemStyles.InfoSectionTextUnit}>
            <WeatherIcon
              icon={displayWeatherIcon("01d")}
              iconSize={IconSizeTypes.TINY}
            />
            <Text
              style={DailyForecastExtendedItemStyles.InfoSectionText}
              allowFontScaling={false}
            >
              {i18n.t("Sunrise")}
            </Text>
            <Text
              style={DailyForecastExtendedItemStyles.InfoSectionText}
              allowFontScaling={false}
            >
              {moment.unix(day.sunrise).format("h:mm")}
            </Text>
          </View>
          <View style={DailyForecastExtendedItemStyles.InfoSectionTextUnit}>
            <WeatherIcon
              icon={displayWeatherIcon("sunset")}
              iconSize={IconSizeTypes.TINY}
            />
            <Text
              style={DailyForecastExtendedItemStyles.InfoSectionText}
              allowFontScaling={false}
            >
              {i18n.t("Sunset")}
            </Text>
            <Text
              style={DailyForecastExtendedItemStyles.InfoSectionText}
              allowFontScaling={false}
            >
              {moment.unix(day.sunset).format("h:mm")}
            </Text>
          </View>

          <Text style={DailyForecastExtendedItemStyles.infoFeelTitle}>
            {i18n.t("Feels")}
          </Text>
          <DailyExpandedFeelInfo
            temp={day.feels_like.morn}
            label={i18n.t("Morn")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.day}
            label={i18n.t("Noon")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.eve}
            label={i18n.t("Even")}
          />
          <DailyExpandedFeelInfo
            temp={day.feels_like.night}
            label={i18n.t("Night")}
          />

          <Text style={DailyForecastExtendedItemStyles.infoFeelTitle}>
            {i18n.t("MinMax")}
          </Text>
          <DailyExpandedFeelInfo temp={day.temp.max} label={i18n.t("Max")} />
          <DailyExpandedFeelInfo temp={day.temp.min} label={i18n.t("Min")} />
        </View>
      </View>
    </>
  );
};

export default DailyForecastExpanded