import * as Location from 'expo-location';

export const fetchGPSLocation = async () : Promise<Location.LocationObject> => {
  let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log(location, "Location fetched");
      return location;
};