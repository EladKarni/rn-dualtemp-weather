import React, { useContext } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { WeatherIconStyles } from '../WeatherIcon/WeatherIcon.Styles';
import { typography } from '../../Styles/Typography';
import { palette } from '../../Styles/Palette';
import { AppStateContext } from '../../utils/AppStateContext';

type AppHeaderPropTypes = {
    location: string;
}

const AppHeader = ({ location }: AppHeaderPropTypes) => {
  const context = useContext(AppStateContext);  
  const tempScale = context?.tempScale;
  const setTempScale = context?.setTempScale;
  
  const _onPressHandler = () => {
    setTempScale && setTempScale(tempScale === 'C' ? 'F' : 'C')
  }

  return (
    <View style={styles.headerContainer}>
        <View style={styles.mainHeaderTitle}>
          <Text style={[typography.headerText, styles.containerHeaderText]}>Weather Forecast</Text>
          <View style={styles.locationHeader}>
              <Text style={[typography.headerText, styles.locationText]}>{location}</Text>
              <Image source={require('../../../assets/Images/locationIcon.png')} style={WeatherIconStyles.iconTiny} />
          </View>
        </View>
        <TouchableOpacity onPress={_onPressHandler} style={styles.defaultScaleSwitch}>
          <Text style={styles.selectedScaleText}>
            {tempScale?.toUpperCase()}
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
    paddingVertical: 5,
    width: 50,
    top: 38,
    right: 20
  },
  selectedScaleText: {
    color: palette.white,
    fontWeight: 'bold',
    fontSize: 26,
    textAlign: 'center'
  }
});

export default AppHeader