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
  Modal,
} from 'react-native';
import { fetchAllOpportunities } from '../services/scraperService';

// Format price with full numbers and commas (no abbreviations)
const formatPrice = (price) => {
  if (!price || price === 0) return 'N/A';
  
  if (typeof price === 'number') {
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
  
  const numPrice = parseFloat(String(price).replace(/[$,]/g, ''));
  if (isNaN(numPrice) || numPrice === 0) return 'N/A';
  
  return `$${numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Helper to get display title
const getDisplayTitle = (item) => {
  if (item.title && item.title !== 'undefined') return item.title;
  if (item.name && item.name !== 'undefined') return item.name;
  if (item.listingName && item.listingName !== 'undefined') return item.listingName;
  if (item.address && item.address !== 'undefined') {
    const addr = item.address;
    if (addr.includes(',')) {
      return addr.split(',')[0].trim();
    }
    return addr;
  }
  if (item.city && item.state) {
    return `Property in ${item.city}, ${item.state}`;
  }
  return 'Property Listing';
};

// Helper to get display location
const getDisplayLocation = (item) => {
  if (item.location && item.location !== 'undefined') return item.location;
  if (item.address && item.address !== 'undefined') return item.address;
  if (item.city && item.state) return `${item.city}, ${item.state}`;
  if (item.city && item.city !== 'undefined') return item.city;
  if (item.state && item.state !== 'undefined') return item.state;
  return 'Location N/A';
};

// Filter options
const SORT_OPTIONS = [
  { label: 'Default Order', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First', value: 'date_desc' },
  { label: 'Oldest First', value: 'date_asc' },
];

const TYPE_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Businesses', value: 'business' },
  { label: 'Properties', value: 'property' },
];

export default function OpportunitiesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState({ businesses: [], realEstate: [] });
  const [error, setError] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter states
  const [sortBy, setSortBy] = useState('default');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async (location = searchLocation) => {
    try {
      setLoading(true);
      setError(null);
      
      let searchParams = {
        keyword: '',
        location: '',
        city: '',
        state: '',
        propertyType: 'all',
        limit: 200,
        nationwide: true,
      };
      
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

  // Sort listings: real first, mock/sample last
  const sortListings = (items) => {
    return [...items].sort((a, b) => {
      // Check if item is real
      const isRealA = a.propertyId || a.listing_id || 
                     (a.id && typeof a.id === 'string' && !a.id.startsWith('mock-') && !a.id.startsWith('prop-'));
      const isRealB = b.propertyId || b.listing_id || 
                     (b.id && typeof b.id === 'string' && !b.id.startsWith('mock-') && !b.id.startsWith('prop-'));
      
      if (isRealA && !isRealB) return -1;
      if (!isRealA && isRealB) return 1;
      
      // If both are real or both are mock, check source
      const isSampleA = a.source === 'Sample Data' || a.source === 'Mock Data';
      const isSampleB = b.source === 'Sample Data' || b.source === 'Mock Data';
      
      if (!isSampleA && isSampleB) return -1;
      if (isSampleA && !isSampleB) return 1;
      
      return 0;
    });
  };

  // Filter items based on active tab and filters
  const getFilteredItems = () => {
    let allItems = [...(opportunities.businesses || []), ...(opportunities.realEstate || [])];
    
    if (activeTab === 'businesses') {
      allItems = opportunities.businesses || [];
    } else if (activeTab === 'realestate') {
      allItems = opportunities.realEstate || [];
    }
    
    // Filter by type
    if (filterType === 'business') {
      allItems = allItems.filter(item => 
        item.category || item.cashFlow || item.revenue || 
        (item.source && item.source.includes('Business'))
      );
    } else if (filterType === 'property') {
      allItems = allItems.filter(item => 
        item.propertyType || item.address || item.size || 
        (item.source && item.source.includes('Property'))
      );
    }
    
    // Filter by price range
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min) && min > 0) {
      allItems = allItems.filter(item => (item.price || 0) >= min);
    }
    if (!isNaN(max) && max > 0) {
      allItems = allItems.filter(item => (item.price || 0) <= max);
    }
    
    // Sort: real listings first, then mock/sample
    allItems = sortListings(allItems);
    
    // Apply sort order
    switch (sortBy) {
      case 'price_asc':
        allItems.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        allItems.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'date_desc':
        allItems.sort((a, b) => {
          const dateA = a.created_at || a.fetchedAt || a.details?.fetchedAt || '';
          const dateB = b.created_at || b.fetchedAt || b.details?.fetchedAt || '';
          return dateB.localeCompare(dateA);
        });
        break;
      case 'date_asc':
        allItems.sort((a, b) => {
          const dateA = a.created_at || a.fetchedAt || a.details?.fetchedAt || '';
          const dateB = b.created_at || b.fetchedAt || b.details?.fetchedAt || '';
          return dateA.localeCompare(dateB);
        });
        break;
      default:
        // Keep sorted order (real first)
        break;
    }
    
    return allItems;
  };

  const filteredItems = getFilteredItems();

  // Smart detection
  const getListingType = (item) => {
    if (item.propertyType || item.address || item.lotSize || item.buildingSize || 
        item.size || (item.priceDisplay?.includes('M') && !item.category)) {
      return { type: 'Property', emoji: '🏢' };
    }
    if (item.category || item.cashFlow || item.revenue || item.broker) {
      return { type: 'Business', emoji: '💼' };
    }
    return { type: 'Opportunity', emoji: '📋' };
  };

  const getSubtype = (item) => {
    if (item.propertyType) return item.propertyType;
    if (item.category) return item.category;
    if (item.propertySubtype) return item.propertySubtype;
    return null;
  };

  // Get sort label
  const getSortLabel = () => {
    const option = SORT_OPTIONS.find(o => o.value === sortBy);
    return option ? option.label : 'Sort';
  };

  // Get type label
  const getTypeLabel = () => {
    const option = TYPE_OPTIONS.find(o => o.value === filterType);
    return option ? option.label : 'Type';
  };

  const renderItem = ({ item }) => {
    // Get the best price display
    let displayPrice = item.priceDisplay || formatPrice(item.price);
    
    if (!displayPrice || displayPrice === 'N/A' || displayPrice === 'Price Not Disclosed') {
      if (item.priceText && item.priceText !== 'None') displayPrice = item.priceText;
      else if (item.formattedPrice) displayPrice = item.formattedPrice;
      else if (item.priceNumeric) displayPrice = `$${item.priceNumeric.toLocaleString()}`;
      else if (item.price && typeof item.price === 'number') displayPrice = `$${item.price.toLocaleString()}`;
      else if (item.country === 'GB' || item.region === 'London') displayPrice = '£ Price on Request';
      else if (item.listingType === 'For Lease' || item.listingType === 'For Rent') displayPrice = 'Lease - Price on Request';
      else displayPrice = 'Price Not Disclosed';
    }
    
    const listingInfo = getListingType(item);
    const subtype = getSubtype(item);
    const title = getDisplayTitle(item);
    const location = getDisplayLocation(item);
    
    // Check if this is a real listing
    const isReal = item.propertyId || item.listing_id || 
                  (item.id && typeof item.id === 'string' && !item.id.startsWith('mock-') && !item.id.startsWith('prop-'));
    const isSampleData = item.source === 'Sample Data' || item.source === 'Mock Data';
    
    return (
      <View style={[styles.card, !isReal && styles.mockCard]}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('DealDetail', { deal: item })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.cardPrice}>{displayPrice}</Text>
          </View>
          
          <View style={styles.cardDetails}>
            <View style={styles.typeContainer}>
              <Text style={styles.cardType}>
                {listingInfo.emoji} {listingInfo.type}
              </Text>
              {subtype && (
                <Text style={styles.cardSubtype}> • {subtype}</Text>
              )}
            </View>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>
                {isReal ? '🔹 Real' : '📊 Sample'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.cardLocation}>
            📍 {location}
          </Text>
          
          {isSampleData && !isReal && (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>📊 Sample Data</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Filter Modal
  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔍 Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      sortBy === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSortBy(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        sortBy === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Type</Text>
              <View style={styles.filterOptions}>
                {TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      filterType === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setFilterType(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterType === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min $"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                />
                <Text style={styles.priceRangeSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max $"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={() => {
                  setSortBy('default');
                  setFilterType('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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

        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>⚙️ Filters</Text>
            {(sortBy !== 'default' || filterType !== 'all' || minPrice || maxPrice) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>•</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.filterSummary}>
            {filteredItems.length} results
          </Text>
        </View>

        <FilterModal />

        <View style={styles.resultCountContainer}>
          <Text style={styles.resultCountText}>
            Showing {filteredItems.length} results
            {searchLocation ? ` in ${searchLocation}` : ' nationwide'}
            {sortBy !== 'default' && ` • ${getSortLabel()}`}
            {filterType !== 'all' && ` • ${getTypeLabel()}`}
          </Text>
        </View>

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
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
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
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterBadge: {
    marginLeft: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  filterSummary: {
    fontSize: 13,
    color: '#666',
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
  mockCard: {
    opacity: 0.8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
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
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardType: {
    fontSize: 13,
    color: '#666',
  },
  cardSubtype: {
    fontSize: 13,
    color: '#888',
  },
  cardLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    padding: 8,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
