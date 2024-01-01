export default ({ config }) => {
  const extra = {
    ...config.extra,
    weatherAPI: process.env.OPEN_WEATHER_API ?? "",
    revGeoAPI: process.env.REVERSE_GEO_API ?? "",
    eas: {
      projectId: ""
    }
  };

  return {
    name: "DualTemp Weather",
    ...config,
    extra,
  };
};