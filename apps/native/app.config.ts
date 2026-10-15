import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_PRODUCTION = process.env.APP_VARIANT === "production";

const APP_ID = IS_PRODUCTION ? "com.alrisali.app" : "com.alrisali.app.dev";
// The Hot Updater channel a build checks; `bun run ota:deploy` targets it.
const OTA_CHANNEL = IS_PRODUCTION ? "production" : "development";
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

/**
 * Android draws Gatherings' maps with Google Maps, which needs an API key at
 * build time. Without one the build still succeeds; Android maps stay blank.
 */
const googleMapsAndroid = (): { googleMaps?: { apiKey: string } } => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  return apiKey ? { googleMaps: { apiKey } } : {};
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
    infoPlist: {
      // The Prayer Assistant's Camera and Head Height modes (VisionCamera has
      // no config plugin of its own).
      NSCameraUsageDescription:
        "يرى الرسالي وضعيتك أثناء الصلاة ليتابع أركانها، والمعاينة مخفية فلا ترى نفسك، ولا يُحفظ شيء من الصور. Al-Risali watches your posture during Salah to follow its Positions; the preview stays hidden so you don't watch yourself, and no image is kept.",
    },
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
    permissions: [
      // Reminders fire at the Prayer Time itself; without it Android may
      // deliver them minutes late (features/reminders asks for it).
      "android.permission.SCHEDULE_EXACT_ALARM",
      // The Prayer Assistant's Camera and Head Height modes see the Believer.
      "android.permission.CAMERA",
    ],
    config: googleMapsAndroid(),
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
      "expo-notifications",
      {
        // Reminders are local notifications (ADR-0003); these are the tones
        // and the Adhan voice they can play (features/reminders).
        sounds: [
          "./assets/sounds/chime.wav",
          "./assets/sounds/bell.wav",
          "./assets/sounds/adhan.wav",
        ],
      },
    ],
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
    // Gatherings' venue maps: Apple Maps on iOS, Google Maps on Android. No
    // location permission: the maps show venues, never the Believer.
    "expo-maps",
    // VisionCamera's GPU Resizer needs Android 8 (API 26). It also compiles a
    // Metal shader on iOS: every Mac that builds needs Xcode's Metal
    // Toolchain (`xcodebuild -downloadComponent MetalToolchain`).
    ["expo-build-properties", { android: { minSdkVersion: 26 } }],
    ["@hot-updater/expo", { channel: OTA_CHANNEL }],
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
        // Recite-Along by voice and the Prayer Assistant's Sound mode
        // (Takbir). Listening happens only while the screen is open.
        microphonePermission:
          "يستمع الرسالي إلى تلاوتك ليُتابع الكلمات معك، وإلى تكبيرك ليُتابع صلاتك. Al-Risali listens to your recitation to follow the words with you, and to your Takbir to follow your Salah.",
        speechRecognitionPermission:
          "يتعرّف الرسالي على كلماتك العربية ليُتابع النص معك ويسمع تكبيرك في الصلاة. Al-Risali recognises your Arabic words to follow the text with you and to hear your Takbir in Salah.",
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
  extra: {
    ...config.extra,
    // Links EAS Build and Submit to the Expo project.
    ...(process.env.EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
      : {}),
  },
});

export default appConfig;
