import type { ExpoConfig } from "expo/config";

// v1.1-r2 重新引入 app.config.ts —— 只为切 dev/prod 的 `name`（app 显示名）。
//
// 字段全部沿用之前 app.json，只在两处按 process.env.APP_VARIANT 切：
//   - `name`：dev → "MealMate Dev"  /  prod 默认 → "MealMate"
//   - `extra.appVariant`：供 useStore.ts 切 STORE_KEY namespace
//
// 注意：**bundleIdentifier 仍然由 ios/mealmate.xcodeproj/project.pbxproj 决定**
//   （Debug=.dev / Release=prod），这条由 backend 维护。这里 ios.bundleIdentifier
//   只是给 expo prebuild 当 base value，不会覆盖现 pbxproj。
//
// 触发：
//   - 本地 dev: `APP_VARIANT=dev npx expo run:ios`
//   - EAS development profile: env.APP_VARIANT=dev（eas.json 配）
//   - EAS preview/production: env.APP_VARIANT=production（同上）

const VARIANT = process.env.APP_VARIANT === "dev" ? "dev" : "production";
const IS_DEV = VARIANT === "dev";
const NAME = IS_DEV ? "MealMate Dev" : "MealMate";

const config: ExpoConfig = {
  name: NAME,
  slug: "mealmate",
  version: "1.2.3",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mealmate",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.xinray.mealmate",
    buildNumber: "9",
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription:
        "mealmate 需要相机权限来记录你的三餐照片，让小伙伴知道你吃过了。",
      NSPhotoLibraryUsageDescription: "mealmate 需要访问相册以选择三餐照片。",
      // App Store 加密合规：app 不用自家加密 → 不触发出口管制问卷
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.xinray.mealmate",
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
    "expo-apple-authentication",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: "xinxiang",
  extra: {
    // useStore.ts 读这个切 STORE_KEY (mealmate-store-dev vs mealmate-store)
    appVariant: VARIANT,
    eas: {
      // 历史 eas init 生成（commit 16aa1c1），重新引入 app.config.ts 时漏了
      projectId: "ad1dcf2a-0e7e-4d2b-b637-ee2c94da6dd0",
    },
  },
};

export default config;
