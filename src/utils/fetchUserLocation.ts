import * as Location from 'expo-location';
import { logger } from './logger';

export const fetchGPSLocation = async () : Promise<Location.LocationObject> => {
  let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      let location = await Location.getCurrentPositionAsync({});
      logger.debug("Location fetched:", location);
      return location;
};