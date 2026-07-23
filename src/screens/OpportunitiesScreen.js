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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { fetchAllOpportunities } from '../services/scraperService';

// Format price with full numbers and commas (no abbreviations)
const formatPrice = (price) => {
  if (!price || price === 0) return 'N/A';
  
  // If price is a number, format with commas
  if (typeof price === 'number') {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  
  // If price is a string, try to parse it
  const numPrice = parseFloat(String(price).replace(/[$,]/g, ''));
  if (isNaN(numPrice) || numPrice === 0) return 'N/A';
  
  return `$${numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Short format for compact displays (if needed)
const formatPriceShort = (price) => {
  if (!price || price === 0) return 'N/A';
  
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  } else {
    return `$${price.toLocaleString()}`;
  }
};

export default function OpportunitiesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState({ businesses: [], realEstate: [] });
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async (location = searchLocation) => {
    try {
      setLoading(true);
      setError(null);
      
      // If no location is specified, search nationwide
      let searchParams = {
        keyword: '',
        location: '',
        city: '',
        state: '',
        propertyType: 'all',
        limit: 100,
        nationwide: true, // Enable nationwide search
      };
      
      // If location is specified, use it
      if (location && location.trim()) {
        const locationParts = location.split(',').map(s => s.trim());
        if (locationParts.length === 2) {
          searchParams.city = locationParts[0];
          searchParams.state = locationParts[1];
          searchParams.location = location;
          searchParams.nationwide = false;
        } else {
          searchParams.location = location;
          searchParams.nationwide = false;
        }
      }
      
      console.log('🔍 Searching with params:', searchParams);
      const results = await fetchAllOpportunities(searchParams);
      
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

  // Filter items based on active tab
  const getFilteredItems = () => {
    const allItems = [...(opportunities.businesses || []), ...(opportunities.realEstate || [])];
    
    if (activeTab === 'all') return allItems;
    if (activeTab === 'businesses') return opportunities.businesses || [];
    if (activeTab === 'realestate') return opportunities.realEstate || [];
    return allItems;
  };

  const filteredItems = getFilteredItems();

  const renderItem = ({ item }) => {
    // Use priceDisplay if available, otherwise format the price
    const displayPrice = item.priceDisplay || formatPrice(item.price);
    
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('DealDetail', { deal: item })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title || 'Opportunity'}
            </Text>
            <Text style={styles.cardPrice}>{displayPrice}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {item.category || item.propertyType || 'Deal'}
          </Text>
          <View style={styles.cardDetails}>
            <Text style={styles.cardLocation}>
              📍 {item.location || item.address || item.city || 'N/A'}
            </Text>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>
                {item.source || 'Listing'}
              </Text>
            </View>
          </View>
          {item.source === 'Mock Data' && (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>📊 Sample Data</Text>
            </View>
          )}
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchOpportunities(searchLocation)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location (e.g., Austin, TX) or leave empty for nationwide"
            value={searchLocation}
            onChangeText={setSearchLocation}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({opportunities.businesses?.length + opportunities.realEstate?.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'businesses' && styles.tabButtonActive]}
            onPress={() => setActiveTab('businesses')}
          >
            <Text style={[styles.tabText, activeTab === 'businesses' && styles.tabTextActive]}>
              💼 Businesses ({opportunities.businesses?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'realestate' && styles.tabButtonActive]}
            onPress={() => setActiveTab('realestate')}
          >
            <Text style={[styles.tabText, activeTab === 'realestate' && styles.tabTextActive]}>
              🏢 Real Estate ({opportunities.realEstate?.length || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultCountContainer}>
          <Text style={styles.resultCountText}>
            Showing {filteredItems.length} results
            {searchLocation ? ` in ${searchLocation}` : ' nationwide'}
          </Text>
        </View>

        {/* List */}
        <FlatList
          data={filteredItems}
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
              <Text style={styles.emptySubtext}>Try adjusting your search or location</Text>
            </View>
          }
        />
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
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
  searchButtonText: {
    fontSize: 18,
    color: 'white',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontSize: 13,
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  resultCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  resultCountText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
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
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 12,
    color: '#999',
  },
  sourceBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sourceText: {
    fontSize: 10,
    color: '#666',
  },
  mockBadge: {
    marginTop: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  mockBadgeText: {
    fontSize: 10,
    color: '#92400e',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
});
