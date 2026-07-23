import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { fetchAllOpportunities } from '../services/scraperService';

// ✅ Simple icon using emoji directly (no component needed)
const getIcon = (name) => {
  const icons = {
    'trophy': '🏆',
    'search': '🔍',
    'business': '💼',
    'person': '👤',
    'home': '🏠',
    'settings': '⚙️',
    'notifications': '🔔',
    'chevron-forward': '›',
    'close': '✕',
    'options': '⚙️',
    'location': '📍',
    'time': '⏰',
    'warning': '⚠️',
    'alert-circle': '⚠️',
    'chatbubble': '💬',
  };
  return icons[name] || '●';
};

export default function OpportunitiesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState({ businesses: [], realEstate: [] });
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('washington, dc');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async (location = searchLocation) => {
    try {
      setLoading(true);
      setError(null);
      
      const locationParts = location.split(',').map(s => s.trim());
      const city = locationParts[0] || 'washington';
      const state = locationParts[1] || 'dc';
      
      const results = await fetchAllOpportunities({
        keyword: '',
        location: location,
        city: city,
        state: state,
        propertyType: 'office',
        limit: 50,
        useMockData: true,
      });
      
      setOpportunities(results);
      console.log('📊 Results:', results.businesses?.length, 'businesses,', results.realEstate?.length, 'properties');
    } catch (error) {
      console.error('Error fetching:', error);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities(searchLocation);
  };

  const handleSearch = () => {
    fetchOpportunities(searchLocation);
  };

  const allItems = [...(opportunities.businesses || []), ...(opportunities.realEstate || [])];

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('DealDetail', { deal: item })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title || 'Opportunity'}</Text>
            <Text style={styles.cardPrice}>${(item.price || 0).toLocaleString()}</Text>
          </View>
          <Text style={styles.cardSubtitle}>{item.category || item.propertyType || 'Deal'}</Text>
          <Text style={styles.cardLocation}>{item.location || item.address || 'N/A'}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardSource}>{item.source || 'Unknown'}</Text>
            {item.cashFlow ? (
              <Text style={styles.cashFlow}>Cash Flow: ${(item.cashFlow || 0).toLocaleString()}</Text>
            ) : null}
            {item.size ? <Text style={styles.size}>{item.size}</Text> : null}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => {
            navigation.navigate('CreateDeal', { 
              property: {
                title: item.title,
                description: item.description,
                price: item.price,
                location: item.location || item.address,
                propertyType: item.propertyType || item.category,
              }
            });
          }}
        >
          <Text style={styles.chatButtonText}>💬 Start Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location (e.g., Austin, TX)"
          value={searchLocation}
          onChangeText={setSearchLocation}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>All ({allItems.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Text style={styles.tabText}>Businesses ({opportunities.businesses?.length || 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton}>
          <Text style={styles.tabText}>Real Estate ({opportunities.realEstate?.length || 0})</Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={allItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `item-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No opportunities found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  searchButtonText: {
    fontSize: 20,
    color: 'white',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: '#999',
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
  cardSource: {
    fontSize: 12,
    color: '#2563eb',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashFlow: {
    fontSize: 12,
    color: '#666',
  },
  size: {
    fontSize: 12,
    color: '#666',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
});
