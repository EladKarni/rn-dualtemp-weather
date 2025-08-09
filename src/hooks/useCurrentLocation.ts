import {
  getCurrentPositionAsync,
  LocationObject,
  requestBackgroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useState, useEffect, useRef } from "react";
import { Alert, AppState, DevSettings, Linking } from "react-native";

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        DevSettings.reload();
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      const status = await startBackgroundTracking();
      if (status === "denied") {
        setErrorMsg("Location permission not granted");
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature.",
          [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
        );
        return;
      }

      let location = await getCurrentPositionAsync({});
      const locationInfo = await reverseGeocodeAsync(location.coords);
      setLocationName(
        locationInfo[0]?.city || locationInfo[0]?.country || "Unknown Location"
      );
      setLocation(location);
    };

    fetchLocation();
  }, [appStateVisible]);

  return { location, locationName, errorMsg };
}

const startBackgroundTracking = async () => {
  const { status } = await requestForegroundPermissionsAsync();
  if (status == "granted") {
    await requestBackgroundPermissionsAsync();
  }
  return status;
};
