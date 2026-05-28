import type { ExpoConfig } from "expo/config";

// 环境分支：APP_VARIANT 由 eas build profile 的 env 或本地 `APP_VARIANT=dev npx expo run:ios --device`
// 注入。默认 production（漏掉 env 也不会装错 bundleId）。
const VARIANT = (process.env.APP_VARIANT === "dev" ? "dev" : "production") as
  | "dev"
  | "production";

const IS_DEV = VARIANT === "dev";

const NAME = IS_DEV ? "MealMate Dev" : "MealMate";
const BUNDLE_ID = IS_DEV ? "com.xinray.mealmate.dev" : "com.xinray.mealmate";

const config: ExpoConfig = {
  name: NAME,
  slug: "mealmate",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mealmate",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    buildNumber: "1",
    infoPlist: {
      NSCameraUsageDescription:
        "mealmate 需要相机权限来记录你的三餐照片，让小伙伴知道你吃过了。",
      NSPhotoLibraryUsageDescription: "mealmate 需要访问相册以选择三餐照片。",
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: "#FFF8F1",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission: "mealmate 需要访问相册以选择三餐照片。",
        cameraPermission: "mealmate 需要相机权限来记录你的三餐照片。",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FFF8F1",
      },
    ],
    "expo-web-browser",
    "@react-native-community/datetimepicker",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // 运行时让代码读到当前 variant（useStore 用来切 AsyncStorage namespace）
    appVariant: VARIANT,
  },
};

export default config;
