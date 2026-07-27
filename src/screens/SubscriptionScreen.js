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
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://investbook-production.up.railway.app/api';

const SUBSCRIPTION_TIERS = {
  view_only: {
    id: 'view_only',
    name: 'View Only',
    price: '$4.99',
    period: '/month',
    yearlyPrice: '$49.99',
    yearlyPeriod: '/year',
    description: 'Access to all property listings and deals',
    features: [
      'View all property listings',
      'Under $200k deals access',
      'Property details and insights',
      'Search and filter properties',
      'Save favorite listings',
    ],
    color: '#2563eb',
    icon: 'eye-outline',
  },
  chat: {
    id: 'chat',
    name: 'Chat & Network',
    price: '$9.99',
    period: '/month',
    yearlyPrice: '$99.99',
    yearlyPeriod: '/year',
    description: 'Everything in View Only + Connect with investors',
    features: [
      'Everything in View Only',
      'Real-time deal chat',
      'Message other investors',
      'Group deal discussions',
      'Investment collaboration tools',
      'Priority support',
    ],
    color: '#8b5cf6',
    icon: 'chatbubbles-outline',
    recommended: true,
  },
};

export default function SubscriptionScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedTier, setSelectedTier] = useState('chat');
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.isSubscribed);
        setSubscription(data);
        console.log('📊 Subscription status:', data);
      } else {
        console.log('⚠️ Could not load subscription status');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId) => {
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    setSubscribing(true);
    try {
      // First, try to create a checkout session
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: tierId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Check if we're in test mode
      if (data.test_mode) {
        // Test mode - activate without payment
        Alert.alert(
          'Test Mode',
          'Payment is not configured. Subscription will be activated for testing.',
          [
            {
              text: 'Activate Test Subscription',
              onPress: async () => {
                try {
                  const activateResponse = await fetch(`${API_URL}/test-activate`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ planId: tierId }),
                  });

                  if (activateResponse.ok) {
                    Alert.alert('Success', 'Test subscription activated!');
                    await loadSubscriptionStatus();
                    navigation.goBack();
                  } else {
                    Alert.alert('Error', 'Failed to activate test subscription');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to activate test subscription');
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Real payment flow - open Stripe Checkout
      if (data.url) {
        Alert.alert(
          'Proceed to Payment',
          `You will be redirected to Stripe to complete your subscription payment.`,
          [
            {
              text: 'Continue to Payment',
              onPress: () => {
                // Open Stripe Checkout URL
                Linking.openURL(data.url);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Could not create checkout session');
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will lose access to premium features.',
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
                setIsSubscribed(false);
                Alert.alert('Canceled', 'Your subscription has been canceled.');
                await loadSubscriptionStatus();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to cancel subscription');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const accessLevel = isSubscribed ? (subscription?.tier || subscription?.planId || 'view_only') : 'none';

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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Subscription Plans</Text>
          <Text style={styles.subtitle}>
            {isSubscribed 
              ? `You are currently on the "${SUBSCRIPTION_TIERS[accessLevel]?.name || 'View Only'}" plan`
              : 'Choose the plan that fits your needs'}
          </Text>
        </View>

        {isSubscribed && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Icon name="checkmark-circle" size={24} color="#22c55e" />
              <Text style={styles.statusText}>Active Subscription</Text>
            </View>
            <Text style={styles.statusDetail}>
              Plan: {SUBSCRIPTION_TIERS[accessLevel]?.name || 'View Only'}
            </Text>
            {subscription?.expiryDate && (
              <Text style={styles.statusDetail}>
                Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
              </Text>
            )}
            <View style={styles.accessBadge}>
              <Text style={styles.accessBadgeText}>
                {accessLevel === 'chat' ? '💬 Full Access (Chat + View)' : '👁️ View Only'}
              </Text>
            </View>
          </View>
        )}

        {!isSubscribed && (
          <View style={styles.plansContainer}>
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.planCard,
                  selectedTier === key && styles.planCardSelected,
                  tier.recommended && styles.planCardPopular,
                ]}
                onPress={() => setSelectedTier(key)}
                activeOpacity={0.8}
              >
                {tier.recommended && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Best Value</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planIcon}>
                    <Icon name={tier.icon} size={24} color={tier.color} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{tier.name}</Text>
                    <Text style={styles.planDescription}>{tier.description}</Text>
                  </View>
                </View>

                <Text style={styles.planPrice}>
                  {tier.price}
                  <Text style={styles.planPeriod}>{tier.period}</Text>
                </Text>

                <View style={styles.planFeatures}>
                  {tier.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Icon name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {selectedTier === key && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
              onPress={() => handleSubscribe(selectedTier)}
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe to {SUBSCRIPTION_TIERS[selectedTier].name}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.secureText}>
              🔒 Secured by Stripe. Cancel anytime.
            </Text>
          </View>
        )}

        {isSubscribed && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>Manage Subscription</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back-outline" size={20} color="#2563eb" />
              <Text style={[styles.actionButtonText, styles.viewButtonText]}>Back to App</Text>
            </TouchableOpacity>

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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  statusDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  accessBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  accessBadgeText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardSelected: {
    borderColor: '#2563eb',
  },
  planCardPopular: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  planDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 12,
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  planFeatures: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  selectedBadge: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
  subscribeButtonDisabled: {
    opacity: 0.6,
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
    paddingTop: 0,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  viewButton: {
    borderColor: '#2563eb',
  },
  viewButtonText: {
    color: '#2563eb',
  },
  cancelButton: {
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
