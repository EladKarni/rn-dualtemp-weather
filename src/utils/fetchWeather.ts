import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { fetchReverseGeocoding } from './fetchReverseGeocoding';
import { fetchGPSLocation } from './fetchUserLocation';

const base_url = `https://open-weather-proxy-pi.vercel.app/api/v1/`;

export const fetchForecast = async (locale: string) => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
        }

        const location = await fetchGPSLocation() as Location.LocationObject;

        const response = await fetch(
            `${base_url}get-weather?lat=${location.coords.latitude}&long=${location.coords.longitude}&lang=${locale}`
        );

        const data = await response.json();

        if (!response.ok) {
            Alert.alert(`Error retrieving weather data: ${data.message}`);
        } else {
            return { data: data, location: await fetchReverseGeocoding(base_url, location.coords.latitude, location.coords.longitude, locale) };
        }
    } catch (e) {
        null
    }
};