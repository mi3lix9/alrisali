import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_PRODUCTION = process.env.APP_VARIANT === "production";

const APP_ID = IS_PRODUCTION ? "com.alrisali.app" : "com.alrisali.app.dev";
const APP_NAME = "الرسالي";

const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: "alrisali",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "alrisali",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_ID,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: APP_ID,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    // Arabic-first: every launch is right-to-left natively. An English
    // launch flips the layout back in JS (shared/lib/app-providers.tsx); a JS
    // `I18nManager.forceRTL` would be overwritten by this on every launch.
    ["expo-localization", { supportsRTL: true, forcesRTL: true }],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});

export default appConfig;
