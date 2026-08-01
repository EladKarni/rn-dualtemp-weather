/**
 * Keep the widget extension's CFBundleVersion in step with the app's.
 *
 * App Store Connect rejects an upload whose appex build number differs from
 * the containing app's:
 *
 *   ERROR ITMS-90473: CFBundleVersion Mismatch. The CFBundleVersion value
 *   '2.2.0' of extension 'DualtempWeather.app/PlugIns/WeatherWidget.appex'
 *   does not match the CFBundleVersion value '3' of its containing iOS app.
 *
 * and this project was configured so that mismatch was guaranteed rather than
 * merely possible. eas.json sets `appVersionSource: "remote"` with
 * `production.ios.autoIncrement`, so the APP's build number is issued by EAS at
 * build time. The WIDGET's came from somewhere else entirely:
 * @bacons/apple-targets reads the static config
 * (`config.ios?.buildNumber || 1`, with-widget.js:232) and bakes it into the
 * target's CURRENT_PROJECT_VERSION, which its generated Info.plist references
 * as $(CURRENT_PROJECT_VERSION). Nothing reconciled the two.
 *
 * apple-targets already solves this, but only for App Clips — the
 * EAS_BUILD_IOS_BUILD_NUMBER fallback lives in
 * createAppClipConfigurationList (configuration-list.js:414) with no
 * counterpart in createWidgetConfigurationList.
 *
 * This sets `ios.buildNumber` rather than patching the Xcode project, because
 * the project is the wrong hook: a withXcodeProject mod runs BEFORE
 * apple-targets has created the widget target, so at that point the only build
 * configurations in the pbxproj are the app's and the project-level pair —
 * there is literally nothing to patch. Writing the value into config instead
 * lets both consumers read it from the one place they each already look:
 * apple-targets for CURRENT_PROJECT_VERSION, and Expo's own withBuildNumber
 * for the app's CFBundleVersion.
 *
 * Outside EAS the variable is unset and this is a no-op — a local `expo
 * run:ios` leaves both sides on their defaults, which already agree.
 *
 * MUST be listed BEFORE "@bacons/apple-targets" in app.json, since that plugin
 * reads config.ios.buildNumber while building the target.
 */
module.exports = function withWidgetBuildNumber(config) {
  const buildNumber = process.env.EAS_BUILD_IOS_BUILD_NUMBER;
  if (!buildNumber) {
    return config;
  }

  return {
    ...config,
    ios: {
      ...config.ios,
      buildNumber,
    },
  };
};
