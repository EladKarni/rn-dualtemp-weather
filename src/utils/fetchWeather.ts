import { Alert } from "react-native";
import { Weather } from "../types/WeatherTypes";

export const base_url = `https://open-weather-proxy-pi.vercel.app/api/v1/`;

export const fetchForecast = async (
  locale: string,
  latitude: number,
  longitude: number
): Promise<Weather | null> => {
  try {
    const response = await fetch(
      `${base_url}get-weather?lat=${latitude}&long=${longitude}&lang=${locale}`
    );

    const data = await response.json();

    if (!response.ok) {
      Alert.alert(`Error retrieving weather data: ${data.message}`);
      return null;
    }

    return data as Weather;
  } catch (e) {
    console.log("Error fetching weather data:", e);
    Alert.alert("Error fetching weather data", "Please try again later.");
    return null;
  }
};
