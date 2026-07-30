import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://investbook-production.up.railway.app/api';

export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    interval: 'month',
    priceId: 'price_monthly_001', // For Stripe/Square
  },
  YEARLY: {
    id: 'yearly',
    name: 'Yearly',
    price: 49.99,
    interval: 'year',
    priceId: 'price_yearly_001', // For Stripe/Square
  },
};

class SubscriptionService {
  constructor() {
    this.subscription = null;
  }

  // Check if user is subscribed
  async isSubscribed() {
    try {
      const subscription = await AsyncStorage.getItem('subscription');
      if (!subscription) return false;
      
      const data = JSON.parse(subscription);
      const expiryDate = new Date(data.expiryDate);
      const now = new Date();
      
      if (expiryDate > now) {
        this.subscription = data;
        return true;
      } else {
        await AsyncStorage.removeItem('subscription');
        this.subscription = null;
        return false;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Get subscription details
  async getSubscription() {
    try {
      if (this.subscription) return this.subscription;
      const subscription = await AsyncStorage.getItem('subscription');
      this.subscription = subscription ? JSON.parse(subscription) : null;
      return this.subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  // Subscribe user (for testing - in production this would call payment processor)
  async subscribe(planId) {
    try {
      const subscription = {
        planId: planId,
        subscribedAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      };
      await AsyncStorage.setItem('subscription', JSON.stringify(subscription));
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('Error subscribing:', error);
      return null;
    }
  }

  // Process payment with Square/Stripe
  async processPayment(planId, paymentToken) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/subscriptions/create`,
        {
          planId: planId,
          paymentToken: paymentToken,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success) {
        return this.subscribe(planId);
      }
      return null;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription() {
    try {
      await AsyncStorage.removeItem('subscription');
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
