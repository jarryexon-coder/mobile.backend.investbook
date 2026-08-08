import { Platform } from 'react-native';
import { finishTransaction, initConnection, requestSubscription } from 'react-native-iap';

const API_URL = 'https://api.invest-book.com/api';

// Create these exact auto-renewable subscriptions in App Store Connect before release.
export const IOS_SUBSCRIPTION_PRODUCTS = {
  view_only: 'com.jerryjiya.investbook.viewonly.monthly',
  view_only_yearly: 'com.jerryjiya.investbook.viewonly.yearly',
  chat: 'com.jerryjiya.investbook.chat.monthly',
  chat_yearly: 'com.jerryjiya.investbook.chat.yearly',
};

export async function purchaseIosSubscription({ planId, token }) {
  if (Platform.OS !== 'ios') {
    throw new Error('Subscriptions are currently available only on iOS.');
  }
  const sku = IOS_SUBSCRIPTION_PRODUCTS[planId];
  if (!sku) throw new Error('This subscription plan is not configured.');

  const connected = await initConnection();
  if (!connected) throw new Error('Unable to connect to the App Store.');
  const result = await requestSubscription({ sku, andDangerouslyFinishTransactionAutomaticallyIOS: false });
  const purchase = Array.isArray(result) ? result[0] : result;
  if (!purchase?.transactionReceipt) {
    throw new Error('Your purchase could not be verified.');
  }

  const response = await fetch(`${API_URL}/ios/verify-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ receipt: purchase.transactionReceipt, productId: sku }),
  });
  const data = await response.json();
  if (!response.ok || !data.isSubscribed) {
    throw new Error(data.error || 'Apple could not verify this subscription.');
  }

  await finishTransaction({ purchase, isConsumable: false });
  return data;
}
