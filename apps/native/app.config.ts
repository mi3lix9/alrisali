import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_PRODUCTION = process.env.APP_VARIANT === "production";

const APP_ID = IS_PRODUCTION ? "com.alrisali.app" : "com.alrisali.app.dev";
const APP_NAME = "الرسالي";

const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";

/** Google's sheet returns to the app on its reversed iOS client ID. */
const googleIosUrlScheme = (): string => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: Google Sign-In needs it for the iOS URL scheme."
    );
  }
  return `com.googleusercontent.apps.${clientId.replace(GOOGLE_CLIENT_ID_SUFFIX, "")}`;
};

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
    usesAppleSignIn: true,
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
    "expo-apple-authentication",
    [
      "expo-location",
      {
        // Foreground only: Prayer Times and the Qibla need the place, never
        // a trail of it.
        locationWhenInUsePermission:
          "يستخدم الرسالي موقعك لحساب أوقات الصلاة واتجاه القبلة. Al-Risali uses your location to calculate Prayer Times and the Qibla.",
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: googleIosUrlScheme() },
    ],
    [
      "@sentry/react-native/expo",
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        // Source maps and debug symbols upload only when a token is present.
        disableAutoUpload: !process.env.SENTRY_AUTH_TOKEN,
      },
    ],
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
    [
      "expo-speech-recognition",
      {
        // Recite-Along by voice (and later the Prayer Assistant's Takbir).
        // Listening happens only while the screen is open.
        microphonePermission:
          "يستمع الرسالي إلى تلاوتك ليُتابع الكلمات معك. Al-Risali listens to your recitation to follow the words with you.",
        speechRecognitionPermission:
          "يتعرّف الرسالي على كلماتك العربية ليُتابع النص معك. Al-Risali recognises your Arabic words to follow the text with you.",
        // Lets Android report which locales the on-device service holds.
        androidSpeechServicePackages: [
          "com.google.android.as",
          "com.google.android.googlequicksearchbox",
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});

export default appConfig;
