import React from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { WeatherIconStyles } from '../WeatherIcon/WeatherIcon.Styles';
import { typography } from '../../Styles/Typography';
import { palette } from '../../Styles/Palette';

type AppHeaderPropTypes = {
    location: string;
}

const AppHeader = ({ location }: AppHeaderPropTypes) => {
  return (
    <View style={styles.headerContainer}>
        <View style={styles.mainHeaderTitle}>
          <Text style={[typography.headerText, styles.containerHeaderText]}>Weather Forecast</Text>
          <View style={styles.locationHeader}>
              <Text style={[typography.headerText, styles.locationText]}>{location}</Text>
              <Image source={require('../../../assets/Images/locationIcon.png')} style={WeatherIconStyles.iconTiny} />
          </View>
        </View>
        <TouchableOpacity onPress={() => console.log("Test")} style={styles.defaultScaleSwitch}>
          <Text style={styles.selectedScaleText}>
            C
          </Text>
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 35,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'

  },
  mainHeaderTitle: {
    position: 'relative',
  },
  containerHeaderText: {
    fontSize: 20,
    textAlign: 'center',
  },
  locationText: {
    paddingRight: 5,
  },
  locationHeader: {
    margin: 'auto',
    height: 30,
    marginBottom: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  defaultScaleSwitch: {
    position: 'absolute',
    borderColor: palette.blueLight,
    borderWidth: 5,
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    top: 38,
    right: 20,
  },
  selectedScaleText: {
    color: palette.white,
    fontWeight: 'bold',
    fontSize: 26
  }
});

export default AppHeader