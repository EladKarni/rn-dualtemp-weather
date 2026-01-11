export default ({ config }) => {
  // Determine build variant from EAS_BUILD_PROFILE environment variable
  const buildProfile = process.env.EAS_BUILD_PROFILE || 'production';
  const isDevelopment = buildProfile === 'development';

  // Base configuration from app.json
  const baseConfig = { ...config };

  // Helper function to deep merge objects
  const deepMerge = (target, source) => {
    const output = { ...target };
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  };

  // Development-specific configuration overrides
  const developmentConfig = {
    name: "Dualtemp Weather Dev",
    slug: "dualtemp-weather-dev",
    icon: "./assets/icon-dev.png",
    ios: {
      bundleIdentifier: "com.ekarni.rndualtempweatherapp.dev",
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["com.ekarni.rndualtempweatherapp.dev"]
          },
          {
            CFBundleURLSchemes: ["exp+dualtemp-weather-dev"]
          }
        ]
      }
    },
    android: {
      package: "com.ekarni.rndualtempweatherapp.dev",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-dev.png",
        backgroundColor: "#1C1B4D"
      }
    }
  };

  // Merge configurations based on build profile
  let appConfig = baseConfig;
  if (isDevelopment) {
    appConfig = {
      ...baseConfig,
      ...developmentConfig,
      ios: deepMerge(baseConfig.ios || {}, developmentConfig.ios || {}),
      android: deepMerge(baseConfig.android || {}, developmentConfig.android || {}),
    };
  }

  // Add extra metadata
  const extra = {
    ...appConfig.extra,
    eas: {
      projectId: "444bda66-1ab4-4665-ba53-c2b76743a33b"
    },
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || null,
    buildProfile: buildProfile,
    isDevelopment: isDevelopment,
  };

  return {
    ...appConfig,
    extra,
    plugins: [
      ...(appConfig.plugins || []),
      "@sentry/react-native/expo",
    ],
  };
};
