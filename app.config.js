import 'dotenv/config';

export default {
  expo: {
    name: 'InvestBook',
    slug: 'investbook',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.jerryjiya.investbook',
      buildNumber: '1.0.13'  // <- Set to 13
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.jerryjiya.investbook',
      versionCode: 13  // <- Set to 13
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'd23ce8a1-caf6-4b9f-ac3d-39a1cb4d8c5f'
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      apifyApiToken: process.env.EXPO_PUBLIC_APIFY_API_TOKEN,
      apifyApiTokenFallback: process.env.EXPO_PUBLIC_APIFY_API_TOKEN_FALLBACK,
      rapidApiKey: process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    }
  }
};
