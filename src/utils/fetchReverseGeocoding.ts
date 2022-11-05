const requestOptions = {
  method: 'GET',
};

const geoApiKey = '9eff882f351b45c2a0770b73b40fa533'

export const fetchReverseGeocoding = async (lat: number, long: number) => {
    return fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${long}&apiKey=${geoApiKey}`, requestOptions)
        .then(response => response.json())
        .then(result => result.features[0].properties)
        .catch(error => console.log('error', error));
}