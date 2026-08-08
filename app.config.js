export default {
  expo: {
    name: "InvestBook",
    slug: "investbook",
    version: "1.0.14",
    orientation: "portrait",
    icon: "./assets/icon.png",
plugins: [
  'expo-font',
  'expo-asset',
  'expo-splash-screen',
  'expo-status-bar',
],
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.jerryjiya.investbook",
      buildNumber: "16"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.jerryjiya.investbook",
      versionCode: 13
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      iosSubscriptions: {
        view_only: 'com.jerryjiya.investbook.viewonly.monthly',
        view_only_yearly: 'com.jerryjiya.investbook.viewonly.yearly',
        chat: 'com.jerryjiya.investbook.chat.monthly',
        chat_yearly: 'com.jerryjiya.investbook.chat.yearly'
      },
      eas: {
        projectId: "d23ce8a1-caf6-4b9f-ac3d-39a1cb4d8c5f"
      }
    }
  }
};
