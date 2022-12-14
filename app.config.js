export default ({ config }) => {
    const extra = {
      ...config.extra,
      weatherAPI: process.env.OPEN_WEATHER_API ?? "",
      revGeoAPI: process.env.REVERSE_GEO_API ?? "",
      eas: {
        projectId: "444bda66-1ab4-4665-ba53-c2b76743a33b"
      }
    };
  
    return {
      name: "DualTemp Weather",
      ...config,
      extra,
    };
  };