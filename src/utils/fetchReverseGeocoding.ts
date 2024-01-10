const requestOptions = {
  method: 'GET',
};

export const fetchReverseGeocoding = async (url: string, lat: number, long: number, local: string) => {
  return fetch(`${url}get-location?lat=${lat}&long=${long}&lang=${local}`, requestOptions)
    .then(response => response.json())
    .then(result => result.features[0].properties)
    .catch(error => console.log('error', error));
}