const {
  withVarlockMetroConfig,
} = require("@varlock/expo-integration/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withUniwindConfig } = require("uniwind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);
// The Prayer Assistant's MoveNet pose model and the full Adhan recordings
// (Ogg Vorbis, previewed on the Reminder sheet) ship as assets.
config.resolver.assetExts.push("tflite", "ogg");

const uniwindConfig = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});

module.exports = withVarlockMetroConfig(uniwindConfig);
