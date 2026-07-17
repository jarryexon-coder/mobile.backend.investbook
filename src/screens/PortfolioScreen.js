import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function PortfolioScreen({ navigation }) {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      try {
        const [portfolioRes, holdingsRes] = await Promise.all([
          axios.get(`${API_URL}/portfolio/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/portfolio/holdings`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setPortfolio(portfolioRes.data);
        setHoldings(holdingsRes.data);
      } catch (apiError) {
        // Fallback to mock data if API fails
        console.log('Using mock portfolio data');
        setPortfolio({
          totalValue: 125000,
          roi: 12.5,
          totalInvested: 110000,
          totalReturns: 15000,
          investedDeals: 8,
          activeDeals: 6,
        });
        setHoldings([
          {
            id: 1,
            title: 'Tech Startup Fund',
            amount: 25000,
            returns: 3200,
            roi: 12.8,
            industry: 'Technology',
            status: 'Active',
          },
          {
            id: 2,
            title: 'Green Energy Project',
            amount: 18000,
            returns: 2100,
            roi: 11.7,
            industry: 'Green Energy',
            status: 'Active',
          },
          {
            id: 3,
            title: 'Real Estate REIT',
            amount: 32000,
            returns: 2100,
            roi: 6.6,
            industry: 'Real Estate',
            status: 'Completed',
          },
          {
            id: 4,
            title: 'Healthcare Innovation',
            amount: 15000,
            returns: 1800,
            roi: 12.0,
            industry: 'Healthcare',
            status: 'Active',
          },
        ]);
      }
    } catch (error) {
      console.log('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const getStatusColor = (status) => {
    return status === 'Active' ? '#22c55e' : '#94a3b8';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
        <Text style={styles.summaryValue}>${portfolio?.totalValue?.toLocaleString()}</Text>
        
        <View style={styles.roiContainer}>
          <View style={styles.roiItem}>
            <Text style={styles.roiLabel}>ROI</Text>
            <Text style={[styles.roiValue, { color: portfolio?.roi >= 0 ? '#22c55e' : '#ef4444' }]}>
              {portfolio?.roi > 0 ? '+' : ''}{portfolio?.roi}%
            </Text>
          </View>
          <View style={styles.roiItem}>
            <Text style={styles.roiLabel}>Total Returns</Text>
            <Text style={[styles.roiValue, { color: portfolio?.totalReturns >= 0 ? '#22c55e' : '#ef4444' }]}>
              ${portfolio?.totalReturns?.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{portfolio?.investedDeals}</Text>
            <Text style={styles.statLabel}>Invested Deals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{portfolio?.activeDeals}</Text>
            <Text style={styles.statLabel}>Active Deals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${portfolio?.totalInvested?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Invested</Text>
          </View>
        </View>
      </View>

      {/* Holdings */}
      <View style={styles.holdingsSection}>
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        
        {holdings.length > 0 ? (
          holdings.map((holding) => (
            <TouchableOpacity
              key={holding.id}
              style={styles.holdingCard}
              onPress={() => navigation.navigate('DealDetail', { deal: holding })}
            >
              <View style={styles.holdingHeader}>
                <Text style={styles.holdingTitle}>{holding.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(holding.status) }]}>
                  <Text style={styles.statusText}>{holding.status}</Text>
                </View>
              </View>
              
              <View style={styles.holdingDetails}>
                <View style={styles.holdingDetail}>
                  <Text style={styles.holdingLabel}>Invested</Text>
                  <Text style={styles.holdingValue}>${holding.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.holdingDetail}>
                  <Text style={styles.holdingLabel}>Returns</Text>
                  <Text style={[styles.holdingValue, { color: holding.returns >= 0 ? '#22c55e' : '#ef4444' }]}>
                    ${holding.returns.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.holdingDetail}>
                  <Text style={styles.holdingLabel}>ROI</Text>
                  <Text style={[styles.holdingValue, { color: holding.roi >= 0 ? '#22c55e' : '#ef4444' }]}>
                    {holding.roi}%
                  </Text>
                </View>
              </View>
              
              <Text style={styles.holdingIndustry}>{holding.industry}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="wallet-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No holdings yet</Text>
            <Text style={styles.emptySubtext}>Start investing to see your portfolio</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 4,
  },
  roiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  roiItem: {
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 12,
    color: '#666',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  holdingsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  holdingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holdingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  holdingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  holdingDetail: {
    alignItems: 'center',
  },
  holdingLabel: {
    fontSize: 12,
    color: '#666',
  },
  holdingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 2,
  },
  holdingIndustry: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
