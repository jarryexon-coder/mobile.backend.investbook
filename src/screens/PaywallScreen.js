import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { subscriptionService } from '../services/subscriptionService';

export default function PaywallScreen({ navigation, route }) {
  const { onSubscribe } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const { user } = useAuth();

  const features = [
    '✅ Unlimited property views',
    '✅ Create and manage deals',
    '✅ Chat with investors',
    '✅ Full access to all listings',
    '✅ Priority support',
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const subscription = await subscriptionService.subscribe(selectedPlan);
      if (subscription) {
        Alert.alert('Success', 'Subscription activated successfully!');
        if (onSubscribe) {
          onSubscribe();
        }
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock InvestBook</Text>
        <Text style={styles.subtitle}>Get full access to all features</Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plansContainer}>
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
      </View>

      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.subscribeButtonText}>
            Subscribe Now - ${selectedPlan === 'monthly' ? '4.99' : '49.99'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={() => Alert.alert('Restore', 'Restoring purchases...')}
      >
        <Text style={styles.restoreButtonText}>Restore Purchases</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By subscribing, you agree to our Terms of Service and Privacy Policy.
        Subscription auto-renews monthly. Cancel anytime.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  featureRow: {
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  plansContainer: {
    marginBottom: 20,
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
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#2563eb',
    fontSize: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
