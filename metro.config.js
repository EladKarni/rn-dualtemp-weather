// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// const config = getDefaultConfig(__dirname);
const config = getSentryExpoConfig(__dirname);

config.resolver.unstable_conditionNames = [
  'require',
  'react-native',
];

module.exports = config;