import React, { useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { WeatherIconStyles } from "../WeatherIcon/WeatherIcon.Styles";
import { typography } from "../../Styles/Typography";
import { palette } from "../../Styles/Palette";
import { AppStateContext } from "../../utils/AppStateContext";
import { storeAsyncStorage } from "../../utils/AsyncStorageHelper";
import { i18n } from "../../localization/i18n";

type AppHeaderPropTypes = {
  location: string;
};

const AppHeader = ({ location }: AppHeaderPropTypes) => {
  const context = useContext(AppStateContext);
  const tempScale = context?.tempScale;
  const setTempScale = context?.updateTempScale;

  const _onPressHandler = () => {
    const savedTemp = tempScale === "F" ? "C" : "F";
    tempScale !== undefined &&
      storeAsyncStorage("@selected_temp_scale", savedTemp);
    setTempScale();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.mainHeaderTitle}>
        <Text style={[typography.headerText, styles.containerHeaderText]}>
          {i18n.t("Title")}
        </Text>
        <View style={[styles.locationHeader]}>
          <Text style={[typography.headerText, styles.locationText]}>
            {location}
          </Text>
          <Image
            source={require("../../../assets/Images/locationIcon.png")}
            style={WeatherIconStyles.iconTiny}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={_onPressHandler}
        style={styles.defaultScaleSwitch}
      >
        <Text style={styles.selectedScaleText}>
          {tempScale?.toUpperCase() || "C"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  mainHeaderTitle: {
    position: "relative",
  },
  containerHeaderText: {
    fontSize: 20,
    textAlign: "center",
  },
  locationText: {
    paddingHorizontal: 5,
  },
  locationHeader: {
    display: "flex",
    flexDirection: "row",
    margin: "auto",
    height: 30,
    marginBottom: 15,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultScaleSwitch: {
    position: "absolute",
    borderColor: palette.primaryLight,
    borderWidth: 5,
    borderRadius: 15,
    paddingVertical: 5,
    width: 50,
    top: 4,
    right: 20,
  },
  selectedScaleText: {
    color: palette.textColor,
    fontWeight: "bold",
    fontSize: 26,
    textAlign: "center",
  },
});

export default AppHeader;
