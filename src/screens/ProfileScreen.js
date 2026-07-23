import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { subscriptionService } from '../services/subscriptionService';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const subscribed = await subscriptionService.isSubscribed();
      const sub = await subscriptionService.getSubscription();
      setIsSubscribed(subscribed);
      setSubscription(sub);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getSubscriptionLabel = () => {
    if (isSubscribed) {
      return subscription?.planId === 'monthly' ? 'Monthly Premium' : 'Yearly Premium';
    }
    return 'Free';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="person-circle" size={80} color="#2563eb" />
          <Text style={styles.name}>{user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
          
          {/* ✅ Subscription Level Badge */}
          <View style={[styles.subscriptionBadge, isSubscribed ? styles.premiumBadge : styles.freeBadge]}>
            <Icon 
              name={isSubscribed ? 'star' : 'lock-closed'} 
              size={16} 
              color={isSubscribed ? '#f59e0b' : '#666'} 
            />
            <Text style={[styles.subscriptionText, isSubscribed ? styles.premiumText : styles.freeText]}>
              {getSubscriptionLabel()}
            </Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Icon name="person-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Icon name="card-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Subscription</Text>
            <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="notifications-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Notifications</Text>
            <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={24} color="#ef4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>InvestBook v1.0.0</Text>
        </View>
      </View>
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
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  freeBadge: {
    backgroundColor: '#f3f4f6',
  },
  premiumBadge: {
    backgroundColor: '#fef3c7',
  },
  subscriptionText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  freeText: {
    color: '#666',
  },
  premiumText: {
    color: '#d97706',
  },
  menu: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  logoutText: {
    color: '#ef4444',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
});
