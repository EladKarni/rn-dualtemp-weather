import {
  getCurrentPositionAsync,
  LocationObject,
  requestForegroundPermissionsAsync,
} from "expo-location";
import { useState, useEffect } from "react";

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission not granted");
        return;
      }

      let location = await getCurrentPositionAsync({});
      console.log(location, "Location fetched");
      setLocation(location);
    };

    fetchLocation();
  }, []);

  return { location, errorMsg };
}
