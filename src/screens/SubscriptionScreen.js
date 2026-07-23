import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { subscriptionService } from '../services/subscriptionService';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function SubscriptionScreen({ navigation }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const subscribed = await subscriptionService.isSubscribed();
      const sub = await subscriptionService.getSubscription();
      setIsSubscribed(subscribed);
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch(`${API_URL}/subscriptions/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      Alert.alert(
        'Payment Required',
        'Complete your subscription payment to activate premium features.',
        [
          {
            text: 'Continue to Payment',
            onPress: () => activateSubscription(planId),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const activateSubscription = async (planId) => {
    try {
      const response = await fetch(`${API_URL}/subscriptions/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        await subscriptionService.subscribe(planId);
        Alert.alert('Success', 'Subscription activated successfully!');
        await loadSubscriptionStatus();
      } else {
        Alert.alert('Error', 'Failed to activate subscription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to activate subscription');
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/subscriptions/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                await subscriptionService.cancelSubscription();
                Alert.alert('Canceled', 'Your subscription has been canceled.');
                await loadSubscriptionStatus();
              } else {
                Alert.alert('Error', 'Failed to cancel subscription');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>Manage your InvestBook subscription</Text>
        </View>

        <View style={[styles.statusCard, isSubscribed ? styles.activeCard : styles.inactiveCard]}>
          <View style={styles.statusHeader}>
            <Icon 
              name={isSubscribed ? 'checkmark-circle' : 'lock-closed'} 
              size={24} 
              color={isSubscribed ? '#22c55e' : '#ef4444'} 
            />
            <Text style={styles.statusText}>
              {isSubscribed ? 'Active' : 'Inactive'}
            </Text>
          </View>
          {isSubscribed && subscription && (
            <View style={styles.statusDetails}>
              <Text style={styles.statusDetailText}>
                Plan: {subscription.planId === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
              <Text style={styles.statusDetailText}>
                Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {!isSubscribed && (
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>$4.99</Text>
              </View>
              <Text style={styles.planInterval}>per month</Text>
              {selectedPlan === 'monthly' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
                styles.planCardPopular,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Best Value</Text>
              </View>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>$49.99</Text>
              </View>
              <Text style={styles.planInterval}>per year (save $9.89)</Text>
              {selectedPlan === 'yearly' && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => handleSubscribe(selectedPlan)}
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe Now - ${selectedPlan === 'monthly' ? '4.99' : '49.99'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.secureText}>
              🔒 Secured by Stripe. Your payment information is safe.
            </Text>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelSubscription}
            >
              <Icon name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service. Subscriptions auto-renew unless canceled.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusCard: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeCard: {
    backgroundColor: '#dcfce7',
  },
  inactiveCard: {
    backgroundColor: '#fee2e2',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusDetails: {
    alignItems: 'flex-end',
  },
  statusDetailText: {
    fontSize: 13,
    color: '#666',
  },
  plansContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#2563eb',
  },
  planCardPopular: {
    borderColor: '#f59e0b',
  },
  popularBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  planInterval: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secureText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2563eb',
    marginLeft: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 40,
    lineHeight: 18,
  },
});
