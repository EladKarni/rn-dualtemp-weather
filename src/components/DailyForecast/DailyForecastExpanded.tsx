import { View, Text, Image, ActivityIndicator } from "react-native";
import { DailyForecastExtendedItemStyles } from "./DailyForecastExtendedItemStyles.Styles";
import { DailyEntity } from "../../types/WeatherTypes";
import React, { useContext, useEffect, useRef, useState } from "react";
import { LineChart } from "react-native-chart-kit";
import { palette } from "../../Styles/Palette";
import moment from "moment";
import WeatherIcon, { IconSizeTypes } from "../WeatherIcon/WeatherIcon";
import { displayWeatherIcon } from "../../utils/Images";
import DailyExpandedFeelInfo from "./DailyExpandedFeelInfo";
import { AppStateContext } from "../../utils/AppStateContext";
import { i18n } from "../../localization/i18n";
import { getLocales } from "expo-localization";
import { TextDirection } from "../../Styles/TextDirection";

type DailyForecastItemExpandedPropTypes = {
  day: DailyEntity;
};

const DailyForecastExpanded = ({ day }: DailyForecastItemExpandedPropTypes) => {
  const [gifURL, setGifURL] = useState<string>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const rng = Math.floor(Math.random() * 100);

  const btsNames = {
    Sunday: "Jungkook",
    Monday: "V",
    Tuesday: "Jimin",
    Wednesday: "SUGA",
    Thursday: "Jin",
    Friday: "RM",
    Saturday: "j-hope",
  };

  const todayString = moment.unix(day.dt).format("dddd");
  const requestURL = `https://api.giphy.com/v1/gifs/search?api_key=Hx1CI4vtmPQOXYjHiRq0IKKlxEpX1Mlm&q=BTS%20${btsNames[todayString]}&limit=1`;

  useEffect(() => {
    const giphyCall = async () => {
      const respons = await fetch(requestURL);
      const giphyResp = await respons.json();
      setGifURL(giphyResp.data[0].images.downsized.url);
    };
    giphyCall();
  }, []);

  return (
    <>
      <View
        style={DailyForecastExtendedItemStyles.container}
        onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}
      >
        {gifURL !== null ? (
          <Image
            source={{
              uri: gifURL,
            }}
            style={{ width: 175, height: 200 }}
          />
        ) : (
          <ActivityIndicator />
        )}

        <View style={DailyForecastExtendedItemStyles.InfoSectionContainer}>
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
            label={i18n.t("Eve")}
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
          {moment.unix(day.sunrise).format("LT")}
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
          {moment.unix(day.sunset).format("LT")}
        </Text>
      </View>
    </>
  );
};

export default DailyForecastExpanded;
