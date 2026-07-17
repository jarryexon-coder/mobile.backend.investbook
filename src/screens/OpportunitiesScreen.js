import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { 
  fetchAllOpportunities, 
  cacheOpportunities,
  getCachedOpportunities 
} from '../services/scraperService';

const FilterModal = ({ visible, onClose, filters, onApplyFilters }) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');
  const [selectedState, setSelectedState] = useState(filters.state || 'All');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || 'All');

  const states = ['All', 'TX', 'CA', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT', 'IA', 'NV', 'AR', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'ME', 'NH', 'RI', 'MT', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY'];
  const categories = ['All', 'Technology', 'Food & Beverage', 'Retail', 'Services', 'Manufacturing', 'Educational', 'Auto & Automotive', 'Entertainment & Leisure', 'Financial', 'Healthcare', 'Real Estate', 'Construction', 'Other'];

  const applyFilters = () => {
    onApplyFilters({
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      state: selectedState,
      category: selectedCategory,
    });
    onClose();
  };

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedState('All');
    setSelectedCategory('All');
    onApplyFilters({
      minPrice: null,
      maxPrice: null,
      state: 'All',
      category: 'All',
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Opportunities</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min $"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max $"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filterLabel}>State</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {states.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={[styles.filterChip, selectedState === state && styles.filterChipActive]}
                  onPress={() => setSelectedState(state)}
                >
                  <Text style={[styles.filterChipText, selectedState === state && styles.filterChipTextActive]}>
                    {state}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.filterChip, selectedCategory === category && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === category && styles.filterChipTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function OpportunitiesScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [opportunities, setOpportunities] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isCached, setIsCached] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: null,
    maxPrice: null,
    state: 'All',
    category: 'All',
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [opportunities, filters, selectedTab, searchKeyword]);

  const loadOpportunities = async () => {
    const cachedData = await getCachedOpportunities();
    if (cachedData) {
      setOpportunities(cachedData);
      setIsCached(true);
    }
    fetchOpportunities(true);
  };

  const fetchOpportunities = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(false);
      
      const results = await fetchAllOpportunities({
        keyword: searchKeyword || '',
        location: searchLocation || '',
        city: 'washington',
        state: 'dc',
        propertyType: 'office',
        limit: 50,
        useMockData: false,
        searchType: 'For_Sale',
      });
      
      setOpportunities(results);
      setIsCached(false);
      await cacheOpportunities(results);
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    if (!opportunities) return;
    
    let data = [];
    if (selectedTab === 'all') {
      data = [...opportunities.businesses || [], ...opportunities.realEstate || []];
    } else if (selectedTab === 'business') {
      data = opportunities.businesses || [];
    } else if (selectedTab === 'realestate') {
      data = opportunities.realEstate || [];
    }

    const filtered = data.filter(item => {
      if (filters.minPrice && filters.minPrice > 0 && item.price < filters.minPrice) return false;
      if (filters.maxPrice && filters.maxPrice > 0 && item.price > filters.maxPrice) return false;
      if (filters.state !== 'All') {
        const location = (item.location || item.address || '').toLowerCase();
        if (!location.includes(filters.state.toLowerCase())) return false;
      }
      if (filters.category !== 'All') {
        const category = (item.category || item.propertyType || '').toLowerCase();
        if (!category.includes(filters.category.toLowerCase())) return false;
      }
      if (searchKeyword) {
        const title = (item.title || '').toLowerCase();
        if (!title.includes(searchKeyword.toLowerCase())) return false;
      }
      return true;
    });

    setFilteredData(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities(false);
  };

  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DealDetail', { deal: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title || 'Business for Sale'}</Text>
        <Text style={styles.cardPrice}>${(item.price || 0).toLocaleString()}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{item.category || 'Business'}</Text>
      <Text style={styles.cardLocation}>{item.location || 'N/A'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSource}>{item.source || 'BizBuySell'}</Text>
        {item.cashFlow ? (
          <Text style={styles.cardRevenue}>Cash Flow: ${(item.cashFlow || 0).toLocaleString()}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderRealEstateItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DealDetail', { deal: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title || 'Property for Sale'}</Text>
        <Text style={styles.cardPrice}>${(item.price || 0).toLocaleString()}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{item.propertyType || 'Property'}</Text>
      <Text style={styles.cardLocation}>{item.address || 'N/A'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSource}>{item.source || 'LoopNet'}</Text>
        {item.size ? <Text style={styles.cardRevenue}>{item.size}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    if (!item) return null;
    if (item.source && item.source.includes('BizBuySell')) {
      return renderBusinessItem({ item });
    }
    if (item.source && (item.source.includes('LoopNet') || item.source.includes('RapidAPI'))) {
      return renderRealEstateItem({ item });
    }
    return renderRealEstateItem({ item });
  };

  const getFilterCount = () => {
    let count = 0;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.state !== 'All') count++;
    if (filters.category !== 'All') count++;
    return count;
  };

  const totalBusinesses = opportunities?.businesses?.length || 0;
  const totalRealEstate = opportunities?.realEstate?.length || 0;
  const totalAll = totalBusinesses + totalRealEstate;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search opportunities..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={() => applyFilters()}
          returnKeyType="search"
        />
        <TouchableOpacity 
          onPress={() => setShowFilters(true)} 
          style={styles.filterIconButton}
        >
          <Icon name="options-outline" size={24} color="#2563eb" />
          {getFilterCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="location-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="City, State..."
          value={searchLocation}
          onChangeText={setSearchLocation}
          onSubmitEditing={() => applyFilters()}
          returnKeyType="search"
        />
      </View>

      {isCached && (
        <View style={styles.cacheIndicator}>
          <Icon name="time-outline" size={16} color="#666" />
          <Text style={styles.cacheText}>Showing cached results</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'all' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All ({totalAll})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'business' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('business')}
        >
          <Text style={[styles.tabText, selectedTab === 'business' && styles.tabTextActive]}>
            Businesses ({totalBusinesses})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'realestate' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('realestate')}
        >
          <Text style={[styles.tabText, selectedTab === 'realestate' && styles.tabTextActive]}>
            Real Estate ({totalRealEstate})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching opportunities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id || `item-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No opportunities found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterIconButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cacheIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f0f4f8',
    marginBottom: 4,
  },
  cacheText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  tabContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 8,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  cardRevenue: {
    fontSize: 12,
    color: '#666',
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
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 18,
    color: '#666',
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
