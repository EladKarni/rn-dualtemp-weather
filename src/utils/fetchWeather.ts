import { Alert } from "react-native";
import * as Location from "expo-location";
import { fetchReverseGeocoding } from "./fetchReverseGeocoding";
import { fetchGPSLocation } from "./fetchUserLocation";
import { Weather } from "../types/WeatherTypes";

export const base_url = `https://open-weather-proxy-pi.vercel.app/api/v1/`;

export const fetchForecast = async (locale: string, positionData: Location.LocationObject) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
    }

    const response = await fetch(
      `${base_url}get-weather?lat=${positionData.coords.latitude}&long=${positionData.coords.longitude}&lang=${locale}`
    );

    const data = await response.json();

    if (!response.ok) {
      Alert.alert(`Error retrieving weather data: ${data.message}`);
    } else {
      return data as Weather;
    }
  } catch (e) {
    null;
  }
};
