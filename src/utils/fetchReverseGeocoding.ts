const requestOptions = {
  method: 'GET',
};

export const fetchReverseGeocoding = async (lat: number, long: number, url: string) => {
    return fetch(`${url}get-location?lat=${lat}&long=${long}`, requestOptions)
        .then(response => response.json())
        .then(result => result.features[0].properties)
        .catch(error => console.log('error', error));
}