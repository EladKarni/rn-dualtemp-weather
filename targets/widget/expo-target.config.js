/** @type {import('@bacons/apple-targets').Config} */
module.exports = (config) => ({
  type: "widget",
  name: "WeatherWidget",
  icon: "../../assets/icon.png",
  deploymentTarget: "15.1",
  colors: {
    $widgetBackground: "#1C1B4D",
    $accent: "#4A90E2",
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios?.entitlements?.["com.apple.security.application-groups"] ||
      ["group.com.ekarni.rndualtempweatherapp.widget"],
  },
  frameworks: ["WidgetKit", "SwiftUI"],
});
