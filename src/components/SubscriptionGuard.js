import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://investbook-production.up.railway.app/api';

export const ACCESS_TYPES = {
  VIEW_LISTINGS: 'view_listings',
  CHAT: 'chat',
};

export const withSubscription = (WrappedComponent, requiredAccess = ACCESS_TYPES.VIEW_LISTINGS) => {
  return function WithSubscription(props) {
    const { user, token, isAuthenticated } = useAuth();
    const [checking, setChecking] = useState(true);
    const [accessLevel, setAccessLevel] = useState('none');
    const [showPaywall, setShowPaywall] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState(null);

    useEffect(() => {
      console.log('🔍 SubscriptionGuard mounted');
      console.log('   isAuthenticated:', isAuthenticated);
      console.log('   token exists:', !!token);
      console.log('   user:', user?.username || 'none');
      console.log('   requiredAccess:', requiredAccess);
      checkSubscription();
    }, [user, token]);

    const checkSubscription = async () => {
      console.log('🔍 Checking subscription...');
      
      if (!isAuthenticated || !token) {
        console.log('❌ Not authenticated or no token');
        setChecking(false);
        setShowPaywall(true);
        return;
      }

      try {
        // Try the main endpoint
        console.log(`📡 Trying endpoint: ${API_URL}/subscription-status`);
        const response = await fetch(`${API_URL}/subscription-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Subscription data:', data);
          setSubscriptionData(data);
          
          let level = 'none';
          if (data.isSubscribed) {
            const tier = data.tier || data.planId;
            console.log('   Tier detected:', tier);
            if (tier === 'chat' || tier === 'CHAT') {
              level = 'chat';
            } else {
              level = 'view_only';
            }
          }
          setAccessLevel(level);
          console.log('   Access level:', level);
          
          if (requiredAccess === ACCESS_TYPES.CHAT) {
            const shouldShowPaywall = level !== 'chat';
            console.log('   Chat required, show paywall:', shouldShowPaywall);
            setShowPaywall(shouldShowPaywall);
          } else {
            const shouldShowPaywall = level === 'none';
            console.log('   View required, show paywall:', shouldShowPaywall);
            setShowPaywall(shouldShowPaywall);
          }
        } else {
          console.log(`❌ Subscription status failed: ${response.status}`);
          setShowPaywall(true);
        }
      } catch (error) {
        console.error('❌ Subscription check error:', error);
        setShowPaywall(true);
      } finally {
        setChecking(false);
        console.log('🔍 Subscription check complete. showPaywall:', showPaywall);
      }
    };

    if (checking) {
      console.log('⏳ Showing loading state...');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Checking subscription...</Text>
        </View>
      );
    }

    if (showPaywall) {
      console.log('🔒 Showing paywall...');
      const isChatFeature = requiredAccess === ACCESS_TYPES.CHAT;
      const hasViewAccess = accessLevel === 'view_only' || accessLevel === 'chat';
      
      return (
        <View style={styles.paywallContainer}>
          <View style={styles.paywallCard}>
            <Text style={styles.paywallIcon}>🔒</Text>
            <Text style={styles.paywallTitle}>
              {isChatFeature ? 'Chat Feature Locked' : 'Subscription Required'}
            </Text>
            <Text style={styles.paywallSubtitle}>
              {isChatFeature 
                ? 'Upgrade to the Chat & Network plan to connect with other investors'
                : 'Upgrade to access premium features and opportunities'}
            </Text>
            
            {isChatFeature && hasViewAccess && (
              <View style={styles.upgradeNotice}>
                <Icon name="information-circle" size={20} color="#f59e0b" />
                <Text style={styles.upgradeNoticeText}>
                  You have View Only access. Upgrade to Chat & Network for full features.
                </Text>
              </View>
            )}
            
            <View style={styles.featuresList}>
              {isChatFeature ? (
                <>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>💬</Text>
                    <Text style={styles.featureText}>Real-time deal chat</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>👥</Text>
                    <Text style={styles.featureText}>Message other investors</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>🤝</Text>
                    <Text style={styles.featureText}>Group deal discussions</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>📊</Text>
                    <Text style={styles.featureText}>Investment collaboration</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✅</Text>
                    <Text style={styles.featureText}>Access to all property listings</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✅</Text>
                    <Text style={styles.featureText}>Under $200k deals</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✅</Text>
                    <Text style={styles.featureText}>Real-time notifications</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✅</Text>
                    <Text style={styles.featureText}>Unlimited deal insights</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => {
                props.navigation?.navigate('Subscription');
              }}
            >
              <Text style={styles.subscribeButtonText}>
                {isChatFeature ? 'Upgrade to Chat & Network' : 'Subscribe Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                props.navigation?.goBack();
              }}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    console.log('✅ Access granted!');
    return <WrappedComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  paywallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  paywallCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paywallIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  paywallTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  paywallSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  upgradeNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 8,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default withSubscription;
