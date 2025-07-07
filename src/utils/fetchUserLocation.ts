import * as Location from 'expo-location';


const sleep = (ms: number | undefined) => new Promise((r) => setTimeout(r, ms));

export const fetchGPSLocation = async () : Promise<Location.LocationObject> => {
  let location;
  let tries = 0;
  const MAX_NUMBER_OF_TRIES = 2;
  do {
    location = await Promise.race([
      sleep(5000),
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      }),
    ]);
    if (location) return Promise.resolve(location);

    tries++;
  } while (!location && tries < MAX_NUMBER_OF_TRIES);

  await Location.getLastKnownPositionAsync();
  location = await Promise.race([
    sleep(5000),
    Location.getLastKnownPositionAsync(),
  ]);

  if (location) return Promise.resolve(location);

  console.log(location, "Location not found after 2 tries");

  return Promise.reject("Unable to determin location");
};