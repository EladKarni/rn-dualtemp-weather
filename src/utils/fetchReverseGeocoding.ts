
import Constants from 'expo-constants';

const geoApiKey: string = Constants.expoConfig?.extra ? Constants.expoConfig?.extra.revGeoAPI : ''

const requestOptions = {
  method: 'GET',
};

export const fetchReverseGeocoding = async (lat: number, long: number) => {
    return fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${long}&apiKey=${geoApiKey}`, requestOptions)
        .then(response => response.json())
        .then(result => result.features[0].properties)
        .catch(error => console.log('error', error));
}