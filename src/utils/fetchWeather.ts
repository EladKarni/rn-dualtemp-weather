import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { fetchReverseGeocoding } from './fetchReverseGeocoding';
import Constants from 'expo-constants';

const weatherApiKey: string = Constants.expoConfig?.extra ? Constants.expoConfig?.extra.weatherAPI : ''
const url = `https://api.openweathermap.org/data/2.5/onecall?&units=metric&exclude=minutely&appid=${weatherApiKey}`;

export const fetchForecast = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
        }

        const location = await Location.getCurrentPositionAsync();

        const response = await fetch(
            `${url}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`
        );
        const data = await response.json();

        if (!response.ok) {
            Alert.alert(`Error retrieving weather data: ${data.message}`);
        } else {
            return {data: data, location: await fetchReverseGeocoding(location.coords.latitude, location.coords.longitude)};
        }
    } catch (e) {
        null
    }
};