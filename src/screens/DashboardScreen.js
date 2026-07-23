import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import subscriptionService from '../services/subscriptionService';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function DashboardScreen({ navigation }) {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalInvested: 0,
    completedDeals: 0,
    isSubscribed: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch deals count
      const response = await axios.get(`${API_URL}/deals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Limit to 5 for free users
      const allDeals = response.data || [];
      const isSubscribed = await subscriptionService.isSubscribed();
      const deals = isSubscribed ? allDeals : allDeals.slice(0, 5);

      setStats({
        totalDeals: deals.length || 0,
        totalInvested: 5000, // Example - would come from commitments endpoint
        completedDeals: 1,
        isSubscribed: isSubscribed,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.username}!</Text>
        <Text style={styles.subtext}>Your Investment Dashboard</Text>
        {!stats.isSubscribed && (
          <TouchableOpacity
            style={styles.upgradeBanner}
            onPress={() => navigation.navigate('Paywall')}
          >
            <Text style={styles.upgradeText}>
              🔒 Upgrade to Premium for unlimited deals
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalDeals}</Text>
          <Text style={styles.statLabel}>Available Deals</Text>
          {!stats.isSubscribed && stats.totalDeals >= 5 && (
            <Text style={styles.limitLabel}>Limited to 5</Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${stats.totalInvested}</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedDeals}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => navigation.navigate('Deals')}
      >
        <Text style={styles.quickActionText}>Browse Investment Deals →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickAction}
        onPress={() => navigation.navigate('CreateDeal')}
      >
        <Text style={styles.quickActionText}>Create New Deal →</Text>
      </TouchableOpacity>

      {!stats.isSubscribed && (
        <TouchableOpacity
          style={[styles.quickAction, styles.premiumAction]}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Text style={[styles.quickActionText, styles.premiumText]}>
            ⭐ Upgrade to Premium
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#2563eb',
    paddingTop: 60,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtext: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 5,
  },
  upgradeBanner: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  upgradeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  limitLabel: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
    fontWeight: '600',
  },
  quickAction: {
    backgroundColor: 'white',
    padding: 18,
    margin: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  premiumAction: {
    backgroundColor: '#f59e0b',
  },
  premiumText: {
    color: 'white',
  },
});
