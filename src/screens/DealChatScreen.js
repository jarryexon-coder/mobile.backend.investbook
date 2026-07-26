import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchAllOpportunities } from '../services/scraperService';
import { formatPriceSmart } from '../utils/smartPriceFormatter';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

// Check if price is disclosed
const isPriceDisclosed = (item) => {
  const priceStr = String(item.price || item.priceDisplay || '');
  const isUndisclosed = 
    priceStr.includes('Not Disclosed') ||
    priceStr.includes('Contact') ||
    priceStr.includes('Request') ||
    priceStr.includes('N/A') ||
    priceStr === '' ||
    priceStr === '0' ||
    priceStr === 'undefined' ||
    priceStr === 'null' ||
    priceStr === 'Price Not Disclosed';
  
  return !isUndisclosed && (item.priceNumeric > 0 || item.price > 0);
};

// Sort function: listings with prices first, then by price
const sortListingsByPrice = (items) => {
  return [...items].sort((a, b) => {
    const hasPriceA = isPriceDisclosed(a);
    const hasPriceB = isPriceDisclosed(b);
    
    // If one has price and the other doesn't, put the one with price first
    if (hasPriceA && !hasPriceB) return -1;
    if (!hasPriceA && hasPriceB) return 1;
    
    // If both have prices, sort by price (low to high)
    if (hasPriceA && hasPriceB) {
      const priceA = a.priceNumeric || a.price || 0;
      const priceB = b.priceNumeric || b.price || 0;
      return priceA - priceB;
    }
    
    // If both don't have prices, keep original order
    return 0;
  });
};

// Memoized Opportunity Card
const OpportunityCard = React.memo(({ item, onPress }) => {
  const hasPrice = isPriceDisclosed(item);

  const displayPrice = useMemo(() => {
    if (hasPrice) {
      return formatPriceSmart(item);
    }
    return 'Price Not Disclosed';
  }, [item, hasPrice]);

  const location = useMemo(() => {
    const parts = [];
    if (item.address) parts.push(item.address);
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    return parts.length > 0 ? parts.join(', ') : 'Location available';
  }, [item]);

  const isBusiness = useMemo(() => {
    return item.category || item.cashFlow || item.revenue || item.ebitda;
  }, [item]);

  // Business details
  const businessDetails = useMemo(() => {
    const details = [];
    if (item.category) details.push(item.category);
    if (item.cashFlow) {
      const cashFlow = typeof item.cashFlow === 'number' 
        ? `$${item.cashFlow.toLocaleString()}` 
        : item.cashFlow;
      details.push(`Cash Flow: ${cashFlow}`);
    }
    if (item.revenue) {
      const revenue = typeof item.revenue === 'number' 
        ? `$${item.revenue.toLocaleString()}` 
        : item.revenue;
      details.push(`Revenue: ${revenue}`);
    }
    if (item.employees) details.push(`${item.employees} employees`);
    if (item.yearEstablished) details.push(`Est. ${item.yearEstablished}`);
    return details.length > 0 ? details.join(' • ') : null;
  }, [item]);

  // Property details
  const propertyDetails = useMemo(() => {
    const details = [];
    if (item.propertyType) details.push(item.propertyType);
    if (item.size || item.lotSize) details.push(item.size || item.lotSize);
    if (item.yearBuilt) details.push(`Built ${item.yearBuilt}`);
    if (item.buildingClass) details.push(`Class ${item.buildingClass}`);
    return details.length > 0 ? details.join(' • ') : null;
  }, [item]);

  return (
    <TouchableOpacity 
      style={[styles.card, !hasPrice && styles.cardNoPrice]} 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, isBusiness ? styles.businessBadge : styles.propertyBadge]}>
          <Text style={styles.typeBadgeText}>
            {isBusiness ? '💼 Business' : '🏢 Property'}
          </Text>
        </View>
        <Text style={[styles.cardPrice, !hasPrice && styles.priceUndisclosed]}>
          {displayPrice}
        </Text>
      </View>
      
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title || item.name || 'Listing'}
      </Text>
      
      <Text style={styles.cardLocation} numberOfLines={2}>
        📍 {location}
      </Text>
      
      {isBusiness && businessDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText} numberOfLines={2}>
            {businessDetails}
          </Text>
        </View>
      )}
      
      {!isBusiness && propertyDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText} numberOfLines={2}>
            {propertyDetails}
          </Text>
        </View>
      )}
      
      {/* Show badge for undisclosed price */}
      {!hasPrice && (
        <View style={styles.undisclosedBadge}>
          <Icon name="lock-closed" size={12} color="#92400e" />
          <Text style={styles.undisclosedBadgeText}>Contact for Price</Text>
        </View>
      )}
      
      {hasPrice && (
        <View style={styles.priceBadge}>
          <Icon name="cash-outline" size={12} color="#10b981" />
          <Text style={styles.priceBadgeText}>Price Available</Text>
        </View>
      )}
      
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.cardSource}>{item.source || 'Listing'}</Text>
          {item.broker && (
            <Text style={styles.brokerName}>• {item.broker}</Text>
          )}
        </View>
        <Icon name="chevron-forward" size={16} color="#2563eb" />
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.item?.id === nextProps.item?.id;
});

// Filter Modal Component
const FilterModal = ({ visible, onClose, filters, onApply }) => {
  const [selectedSort, setSelectedSort] = useState(filters.sort || 'price_asc');
  const [selectedProperty, setSelectedProperty] = useState(filters.propertyType || 'all');
  const [minPrice, setMinPrice] = useState(filters.minPrice ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ? String(filters.maxPrice) : '');

  const propertyTypes = [
    { label: 'All Properties', value: 'all' },
    { label: 'Office', value: 'office' },
    { label: 'Retail', value: 'retail' },
    { label: 'Industrial', value: 'industrial' },
    { label: 'Land', value: 'land' },
    { label: 'Multifamily', value: 'multifamily' },
    { label: 'Commercial', value: 'commercial' },
  ];

  const sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Newest First', value: 'date_desc' },
  ];

  const handleApply = () => {
    onApply({
      sort: selectedSort,
      propertyType: selectedProperty,
      minPrice: minPrice ? parseFloat(minPrice) : 0,
      maxPrice: maxPrice ? parseFloat(maxPrice) : 0,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedSort('price_asc');
    setSelectedProperty('all');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
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
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      selectedSort === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedSort(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSort === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.filterOptions}>
                {propertyTypes.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterChip,
                      selectedProperty === option.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedProperty(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedProperty === option.value && styles.filterChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <Text style={styles.filterSubLabel}>Leave empty for no limit</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                <Text style={styles.priceRangeSeparator}>to</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Quick price presets */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Quick Presets</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'Under $500k', value: 500000 },
                  { label: 'Under $1M', value: 1000000 },
                  { label: 'Under $5M', value: 5000000 },
                  { label: 'Under $10M', value: 10000000 },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.value}
                    style={[styles.filterChip, styles.presetChip]}
                    onPress={() => {
                      setMinPrice('');
                      setMaxPrice(String(preset.value));
                    }}
                  >
                    <Text style={styles.filterChipText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function OpportunitiesScreen({ navigation }) {
  const [opportunities, setOpportunities] = useState({ businesses: [], realEstate: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: 'price_asc',
    propertyType: 'all',
    minPrice: 0,
    maxPrice: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadOpportunities = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const results = await fetchAllOpportunities({
        keyword: searchQuery,
        location: '',
        limit: 200,
        nationwide: true,
      });
      
      setOpportunities(results);
      console.log(`📊 Loaded: ${results.businesses?.length || 0} businesses, ${results.realEstate?.length || 0} properties`);
    } catch (error) {
      console.error('❌ Error loading opportunities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleRefresh = useCallback(() => {
    loadOpportunities(true);
  }, [loadOpportunities]);

  // Filter, sort, and prioritize items with prices
  const filteredItems = useMemo(() => {
    let items = [];
    if (activeTab === 'all') {
      items = [...(opportunities.businesses || []), ...(opportunities.realEstate || [])];
    } else if (activeTab === 'businesses') {
      items = opportunities.businesses || [];
    } else {
      items = opportunities.realEstate || [];
    }

    // Apply price filter (only for items with prices)
    if (filters.minPrice > 0) {
      items = items.filter(item => {
        const price = item.priceNumeric || item.price || 0;
        return price >= filters.minPrice || price === 0;
      });
    }
    if (filters.maxPrice > 0) {
      items = items.filter(item => {
        const price = item.priceNumeric || item.price || 0;
        return price <= filters.maxPrice || price === 0;
      });
    }

    // Apply property type filter
    if (filters.propertyType !== 'all') {
      items = items.filter(item => 
        (item.propertyType || '').toLowerCase().includes(filters.propertyType)
      );
    }

    // Apply sorting - but always prioritize items with prices
    switch (filters.sort) {
      case 'price_asc':
        items.sort((a, b) => {
          const hasPriceA = isPriceDisclosed(a);
          const hasPriceB = isPriceDisclosed(b);
          
          if (hasPriceA && !hasPriceB) return -1;
          if (!hasPriceA && hasPriceB) return 1;
          
          if (hasPriceA && hasPriceB) {
            return (a.priceNumeric || a.price || 0) - (b.priceNumeric || b.price || 0);
          }
          return 0;
        });
        break;
      case 'price_desc':
        items.sort((a, b) => {
          const hasPriceA = isPriceDisclosed(a);
          const hasPriceB = isPriceDisclosed(b);
          
          if (hasPriceA && !hasPriceB) return -1;
          if (!hasPriceA && hasPriceB) return 1;
          
          if (hasPriceA && hasPriceB) {
            return (b.priceNumeric || b.price || 0) - (a.priceNumeric || a.price || 0);
          }
          return 0;
        });
        break;
      case 'date_desc':
        items.sort((a, b) => {
          const hasPriceA = isPriceDisclosed(a);
          const hasPriceB = isPriceDisclosed(b);
          
          if (hasPriceA && !hasPriceB) return -1;
          if (!hasPriceA && hasPriceB) return 1;
          
          const dateA = a.dateUpdated || a.created_at || '';
          const dateB = b.dateUpdated || b.created_at || '';
          return dateB.localeCompare(dateA);
        });
        break;
      default:
        // Default: price_asc with price priority
        items.sort((a, b) => {
          const hasPriceA = isPriceDisclosed(a);
          const hasPriceB = isPriceDisclosed(b);
          
          if (hasPriceA && !hasPriceB) return -1;
          if (!hasPriceA && hasPriceB) return 1;
          
          if (hasPriceA && hasPriceB) {
            return (a.priceNumeric || a.price || 0) - (b.priceNumeric || b.price || 0);
          }
          return 0;
        });
        break;
    }

    return items;
  }, [opportunities, activeTab, filters]);

  const renderItem = useCallback(({ item }) => (
    <OpportunityCard 
      item={item} 
      onPress={(deal) => navigation.navigate('DealDetail', { deal })} 
    />
  ), [navigation]);

  const keyExtractor = useCallback((item, index) => {
    return item.id?.toString() || index.toString();
  }, []);

  const getFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sort !== 'price_asc') count++;
    if (filters.propertyType !== 'all') count++;
    if (filters.minPrice > 0) count++;
    if (filters.maxPrice > 0) count++;
    return count;
  }, [filters]);

  // Count items with prices vs without
  const priceStats = useMemo(() => {
    let withPrice = 0;
    let withoutPrice = 0;
    filteredItems.forEach(item => {
      if (isPriceDisclosed(item)) {
        withPrice++;
      } else {
        withoutPrice++;
      }
    });
    return { withPrice, withoutPrice };
  }, [filteredItems]);

  if (loading && filteredItems.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Opportunities</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} opportunities • {priceStats.withPrice} with prices
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadOpportunities()}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterButton, getFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="options-outline" size={18} color={getFilterCount > 0 ? '#2563eb' : '#666'} />
            <Text style={[styles.filterButtonText, getFilterCount > 0 && styles.filterButtonTextActive]}>
              Filters
            </Text>
            {getFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{getFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.filterTabs}>
            {['all', 'businesses', 'realestate'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                  {tab === 'all' ? 'All' : tab === 'businesses' ? 'Businesses' : 'Properties'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FilterModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            console.log('🔍 Filters applied:', newFilters);
          }}
        />

        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          initialNumToRender={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="business-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No opportunities found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              <TouchableOpacity 
                style={styles.resetFiltersButton}
                onPress={() => {
                  setFilters({
                    sort: 'price_asc',
                    propertyType: 'all',
                    minPrice: 0,
                    maxPrice: 0,
                  });
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#e8f0fe',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#2563eb',
  },
  filterCountBadge: {
    marginLeft: 6,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardNoPrice: {
    opacity: 0.85,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  businessBadge: {
    backgroundColor: '#dbeafe',
  },
  propertyBadge: {
    backgroundColor: '#d1fae5',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  priceUndisclosed: {
    color: '#92400e',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  undisclosedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  undisclosedBadgeText: {
    fontSize: 11,
    color: '#92400e',
    marginLeft: 4,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  priceBadgeText: {
    fontSize: 11,
    color: '#10b981',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardSource: {
    fontSize: 12,
    color: '#999',
  },
  brokerName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  filterSubLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  presetChip: {
    backgroundColor: '#e8f0fe',
    borderColor: '#2563eb',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 8,
  },
  priceInputLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
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
  centered: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  resetFiltersButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetFiltersText: {
    color: 'white',
    fontWeight: '600',
  },
});

// Export with subscription guard - SINGLE default export
export default withSubscription(OpportunitiesScreen, ACCESS_TYPES.VIEW_LISTINGS);
