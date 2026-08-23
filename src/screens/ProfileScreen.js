import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useFocusEffect(useCallback(() => {
    checkSubscription();
  }, [token]));

  const checkSubscription = async () => {
    try {
      if (!token) return;
      const response = await fetch(`${API_URL}/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Subscription status unavailable');
      const data = await response.json();
      setIsSubscribed(Boolean(data.isSubscribed));
      setSubscription(data);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account permanently?',
      'This permanently removes your profile, messages, saved data, and access. Active subscriptions must be canceled separately in your Apple Account subscriptions.',
      [
        { text: 'Keep Account', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) throw new Error('Deletion failed');
              await logout();
              Alert.alert('Account deleted', 'Your account and associated personal data have been deleted.');
            } catch {
              Alert.alert('Unable to delete account', 'Please try again or contact support@invest-book.com.');
            }
          },
        },
      ]
    );
  };

  const getSubscriptionLabel = () => {
    if (isSubscribed) {
      const planId = subscription?.tier || subscription?.planId;
      if (planId === 'chat' || planId === 'chat_yearly') {
        return planId === 'chat_yearly' ? 'Chat & Network — Yearly' : 'Chat & Network — Monthly';
      }
      return planId === 'view_only_yearly' ? 'View Only — Yearly' : 'View Only — Monthly';
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
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
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

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
            <Icon name="shield-checkmark-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Privacy & Data</Text>
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

          <TouchableOpacity style={[styles.menuItem, styles.deleteItem]} onPress={handleDeleteAccount}>
            <Icon name="trash-outline" size={24} color="#b91c1c" />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Account</Text>
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
  deleteItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#b91c1c',
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
