import React from 'react'
import { View, Text, Image, StyleSheet, Platform, StatusBar } from 'react-native'
import { WeatherIconStyles } from '../WeatherIcon/WeatherIcon.Styles';
import { typography } from '../../Styles/Typography';

type AppHeaderPropTypes = {
    location: string;
}

const AppHeader = ({ location }: AppHeaderPropTypes) => {
  return (
    <View style={styles.headerContainer}>
        <Text style={[typography.headerText, styles.containerHeaderText]}>Weather Forecast</Text>
        <View style={styles.locationHeader}>
            <Text style={[typography.headerText, styles.locationText]}>{location}</Text>
            <Image source={require('../../../assets/Images/locationIcon.png')} style={WeatherIconStyles.iconTiny} />
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 1
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
  }
  });

export default AppHeader