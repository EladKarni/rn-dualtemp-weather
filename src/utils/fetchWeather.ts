import { Alert } from 'react-native';
import * as Location from 'expo-location';

const openWeatherKey = `646fbf920b1e674d7c20911ce0f3b779`;
const url = `https://api.openweathermap.org/data/2.5/onecall?&units=metric&exclude=minutely&appid=${openWeatherKey}`;

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
            return data;
        }
    } catch (e) {
        null
    }
};