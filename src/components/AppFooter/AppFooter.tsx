import React from 'react'
import { View, Text, StyleSheet, Linking, Image } from 'react-native'
import { palette } from '../../Styles/Palette';
import { i18n } from "../../localization/i18n";

const AppFooter = () => {
  return (
    <View style={styles.footerContainer}>
      <Text style={styles.geoapifyText}>
        <Text>{i18n.t("PoweredBy")}</Text>
        <Text
          style={styles.linkText}
          onPress={() => Linking.openURL("https://www.geoapify.com/")}
        >
          {i18n.t("Geoapify")}
        </Text>
      </Text>
      <Text style={styles.openweatherText}>
        <Text>{i18n.t("ProvidedBy")}</Text>
        <Text
          style={styles.linkText}
          onPress={() => Linking.openURL("https://openweathermap.org/")}
        >
          {i18n.t("OpenWeather")}
        </Text>
      </Text>
      <Image
        source={require("../../../assets/Images/OpenWeatherLogo.png")}
        style={styles.weatherLogo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    footerContainer: {
        alignItems: 'center',
        paddingVertical: 5
    },
    geoapifyText: {
        color: palette.highlightColor,
        textAlign: 'center'
    },
    openweatherText: {
        color: palette.highlightColor,
        textAlign: 'center'
    },
    linkText: {
        color: palette.primaryLight,
        textAlign: 'center'
    },
    weatherLogo: {
        width: 150,
        height: 100
    }
});

export default AppFooter