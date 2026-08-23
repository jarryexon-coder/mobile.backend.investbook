import Constants from 'expo-constants';

/**
 * Safely get environment variables that work in both development and production
 */
export const getEnv = (key) => {
  // Try to get from Constants first (production builds)
  const fromConstants = Constants.expoConfig?.extra?.[key];
  if (fromConstants !== undefined && fromConstants !== null) {
    return fromConstants;
  }
  
  // Fallback to process.env (development)
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess !== null) {
    return fromProcess;
  }
  
  console.warn(`⚠️ Environment variable ${key} not found`);
  return null;
};

// Export commonly used variables
export const API_URL = getEnv('apiUrl') || getEnv('EXPO_PUBLIC_API_URL') || 'https://api.invest-book.com/api';
export const APIFY_API_TOKEN = getEnv('apifyApiToken') || getEnv('EXPO_PUBLIC_APIFY_API_TOKEN');
export const RAPIDAPI_KEY = getEnv('rapidApiKey') || getEnv('EXPO_PUBLIC_RAPIDAPI_KEY');
export const STRIPE_PUBLISHABLE_KEY = getEnv('stripePublishableKey') || getEnv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');

export default {
  API_URL,
  APIFY_API_TOKEN,
  RAPIDAPI_KEY,
  STRIPE_PUBLISHABLE_KEY,
  getEnv,
};
