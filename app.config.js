export default ({ config }) => {
  // Determine build variant from EAS_BUILD_PROFILE environment variable
  const buildProfile = process.env.EAS_BUILD_PROFILE || 'production';
  const isDevelopment = buildProfile === 'development';
  const isPreview = buildProfile === 'preview';

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

  // Preview-specific configuration overrides. Android-only on purpose: iOS is
  // left untouched so a preview build can never disturb the production iOS
  // config (a distinct bundle id would also drag in a second App Group for the
  // widget). The distinct package makes the build install alongside production,
  // and Android's per-package AsyncStorage isolates its data for free.
  // `slug` is intentionally NOT overridden: EAS validates it against
  // extra.eas.projectId, and it has no on-device effect.
  const previewConfig = {
    name: "Dualtemp Weather Preview",
    android: {
      package: "com.ekarni.rndualtempweatherapp.preview",
      icon: "./assets/icon-preview.png",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-preview.png",
        backgroundColor: "#1C1B4D"
      }
    }
  };

  // Widget labels live in the react-native-android-widget plugin config in
  // app.json. With two variants installed, the launcher's widget picker shows
  // both sets, so the preview labels get a prefix to stay distinguishable.
  // deepMerge copies arrays wholesale instead of merging elements, so the
  // plugins array is rewritten explicitly rather than merged.
  const withPreviewWidgetLabels = (plugins = []) =>
    plugins.map(entry => {
      if (!Array.isArray(entry) || entry[0] !== 'react-native-android-widget') {
        return entry;
      }
      const [pluginName, pluginConfig] = entry;
      return [pluginName, {
        ...pluginConfig,
        widgets: (pluginConfig.widgets || []).map(widget => ({
          ...widget,
          label: `[Preview] ${widget.label}`,
        })),
      }];
    });

  // Merge configurations based on build profile
  let appConfig = baseConfig;
  if (isDevelopment) {
    appConfig = {
      ...baseConfig,
      ...developmentConfig,
      ios: deepMerge(baseConfig.ios || {}, developmentConfig.ios || {}),
      android: deepMerge(baseConfig.android || {}, developmentConfig.android || {}),
    };
  } else if (isPreview) {
    appConfig = {
      ...baseConfig,
      ...previewConfig,
      android: deepMerge(baseConfig.android || {}, previewConfig.android || {}),
      plugins: withPreviewWidgetLabels(baseConfig.plugins),
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
    // NOTE: @sentry/react-native/expo is already registered (parameterized) in
    // app.json's plugins array. Do NOT re-add it here — appending it again
    // double-registers the config plugin. Plugins flow through via ...appConfig.
  };
};
