import React from 'react'
import { View, Text, StyleSheet, Linking, Image } from 'react-native'
import { palette } from '../../Styles/Palette';

const AppFooter = () => {
  return (
    <View style={styles.footerContainer}>
        <Text style={styles.geoapifyText}>
            <Text>Reverse geocoding powered by </Text>
            <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.geoapify.com/')}>Geoapify</Text>
        </Text>
        <Text style={styles.openweatherText}>
            <Text >Weather data provided by </Text>
            <Text style={styles.linkText} onPress={() => Linking.openURL('https://openweathermap.org/')}>OpenWeather</Text>
        </Text>
        <Image source={require('../../../assets/Images/OpenWeatherLogo.png')} style={styles.weatherLogo} />
    </View>
  )
}

const styles = StyleSheet.create({
    footerContainer: {
        alignItems: 'center',
        paddingVertical: 5
    },
    geoapifyText: {
        color: palette.grayLight,
        textAlign: 'center'
    },
    openweatherText: {
        color: palette.grayLight,
        textAlign: 'center'
    },
    linkText: {
        color: palette.blueLight,
        textAlign: 'center'
    },
    weatherLogo: {
        width: 150,
        height: 100
    }
});

export default AppFooter