import {
  getCurrentPositionAsync,
  LocationObject,
  requestBackgroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { useState, useEffect } from "react";
import { Alert, Linking } from "react-native";
import { logger } from "../utils/logger";

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, []);

  return { location, locationName, errorMsg };
}

const startBackgroundTracking = async () => {
  const { status } = await requestForegroundPermissionsAsync();
  if (status == "granted") {
    try {
      await requestBackgroundPermissionsAsync();
    } catch (error) {
      logger.error("Error requesting background permissions:", error);
    }
  }
  return status;
};
