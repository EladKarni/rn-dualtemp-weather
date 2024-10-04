const {
  AndroidConfig,
  withAndroidManifest,
  withInfoPlist,
  XML,
} = require("expo/config-plugins");
const { mkdirSync } = require("fs");

function withIosLocalizableProject(config, languageList) {
  return withInfoPlist(config, async (config) => {
    config.modResults.CFBundleLocalizations = languageList;
    return config;
  });
};

function addAttributesToApplication(androidManifest, attributes) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  if (app?.$) {
    app.$ = { ...app.$, ...attributes };
  }

  return androidManifest;
}

function addLanguages(languages) {
  return languages.map((lang) => ({ $: { "android:name": lang } }));
}

function generateXML(langList) {
  return {
    "locale-config": {
      $: {
        "xmlns:android": "http://schemas.android.com/apk/res/android",
      },
      locale: addLanguages(langList),
    },
  };
}

async function writeXMLFiles(langs) {
  const obj = generateXML(langs);
  const dir = "android/app/src/main/res/xml";

  mkdirSync(dir, { recursive: true });
  await XML.writeXMLAsync({ path: `${dir}/locales_config.xml`, xml: obj });
}

const withRNLocalizeSettings = (expoConfig, languages) => {
  let confing = withAndroidManifest(expoConfig, (config) => {
    config.modResults = addAttributesToApplication(config.modResults, {
      "android:localeConfig": "@xml/locales_config",
    });
    writeXMLFiles(languages.langs);
    return config;
  });
  confing = withIosLocalizableProject(expoConfig, languages.langs)
  return confing
};

module.exports = withRNLocalizeSettings;
