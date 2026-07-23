import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function DealsScreen({ navigation }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/deals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeals(response.data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      // Mock data for demo
      setDeals([
        {
          id: 1,
          title: 'Tech Startup Fund',
          amount: 50000,
          roi: 12.8,
          status: 'Active',
          industry: 'Technology',
          chatEnabled: true,
        },
        {
          id: 2,
          title: 'Green Energy Project',
          amount: 75000,
          roi: 11.7,
          status: 'Active',
          industry: 'Green Energy',
          chatEnabled: true,
        },
        {
          id: 3,
          title: 'Real Estate REIT',
          amount: 120000,
          roi: 6.6,
          status: 'Completed',
          industry: 'Real Estate',
          chatEnabled: false,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeals();
  };

  const startChat = (deal) => {
    if (!deal.chatEnabled) {
      Alert.alert('Chat Unavailable', 'Chat is not available for this deal yet.');
      return;
    }
    navigation.navigate('Chat', { 
      dealId: deal.id, 
      dealTitle: deal.title 
    });
  };

  const renderDeal = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('DealDetail', { deal: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardAmount}>${item.amount?.toLocaleString()}</Text>
        </View>
        <Text style={styles.cardIndustry}>{item.industry}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardROI}>{item.roi}% ROI</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#22c55e' : '#94a3b8' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {item.chatEnabled && (
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => startChat(item)}
        >
          <Icon name="chatbubble-outline" size={20} color="#2563eb" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No deals found</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardIndustry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  cardROI: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8faff',
  },
  chatButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
