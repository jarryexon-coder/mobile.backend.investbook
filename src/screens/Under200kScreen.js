import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { getUnder200kListings } from '../services/enhancedScraperService';
import { formatPriceSmart } from '../utils/smartPriceFormatter';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

// Memoized Listing Card
const ListingCard = React.memo(({ item, onPress }) => {
  const displayPrice = useMemo(() => {
    return formatPriceSmart(item);
  }, [item]);

  const isBusiness = useMemo(() => item.type === 'business', [item]);

  const location = useMemo(() => {
    const parts = [];
    if (item.address) parts.push(item.address);
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    return parts.length > 0 ? parts.join(', ') : 'Location available';
  }, [item]);

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

  const propertyDetails = useMemo(() => {
    const details = [];
    if (item.propertyType) details.push(item.propertyType);
    if (item.size || item.lotSize) details.push(item.size || item.lotSize);
    if (item.yearBuilt) details.push(`Built ${item.yearBuilt}`);
    return details.length > 0 ? details.join(' • ') : null;
  }, [item]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, isBusiness ? styles.businessBadge : styles.propertyBadge]}>
          <Text style={styles.typeBadgeText}>
            {isBusiness ? '💼 Business' : '🏢 Property'}
          </Text>
        </View>
        <Text style={styles.cardPrice}>{displayPrice}</Text>
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
      
      <View style={styles.tagsContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>💰 Under $200k</Text>
        </View>
        {item.source && (
          <View style={[styles.tag, styles.sourceTag]}>
            <Text style={[styles.tagText, styles.sourceTagText]}>{item.source.replace(' (Sample)', '')}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          {item.broker && (
            <Text style={styles.brokerName}>👤 {item.broker}</Text>
          )}
        </View>
        <Icon name="chevron-forward" size={16} color="#2563eb" />
      </View>
    </TouchableOpacity>
  );
});

function Under200kScreen({ navigation }) {
  const [listings, setListings] = useState({ businesses: [], properties: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({ total: 0, businesses: 0, properties: 0 });

  const loadListings = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await getUnder200kListings();
      
      setListings({
        businesses: data.businesses || [],
        properties: data.properties || [],
      });
      
      setStats({
        total: data.total || 0,
        businesses: data.businesses?.length || 0,
        properties: data.properties?.length || 0,
      });
      
      console.log(`📊 Under $200k: ${data.businesses?.length || 0} businesses, ${data.properties?.length || 0} properties`);
    } catch (error) {
      console.error('❌ Error loading under $200k listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [loadListings])
  );

  const handleRefresh = useCallback(() => {
    loadListings(true);
  }, [loadListings]);

  const filteredItems = useMemo(() => {
    let items = [];
    if (activeTab === 'all') {
      items = [...listings.businesses, ...listings.properties];
    } else if (activeTab === 'businesses') {
      items = listings.businesses;
    } else {
      items = listings.properties;
    }
    return items.sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [listings, activeTab]);

  const renderItem = useCallback(({ item }) => (
    <ListingCard 
      item={item} 
      onPress={(deal) => navigation.navigate('DealDetail', { deal })} 
    />
  ), [navigation]);

  const keyExtractor = useCallback((item, index) => {
    return item.id?.toString() || index.toString();
  }, []);

  if (loading && filteredItems.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Finding affordable deals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>💰 Under $200k</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>{stats.total} deals</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Affordable investment opportunities</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.businesses}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.properties}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {filteredItems.length > 0 ? `$${Math.min(...filteredItems.map(i => i.price || 0)).toLocaleString()}` : '$0'}
            </Text>
            <Text style={styles.statLabel}>Lowest Price</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {['all', 'businesses', 'properties'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'businesses' ? 'Businesses' : 'Properties'}
              </Text>
              <View style={[styles.tabCount, activeTab === tab && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, activeTab === tab && styles.tabCountTextActive]}>
                  {tab === 'all' ? stats.total : tab === 'businesses' ? stats.businesses : stats.properties}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
              <Icon name="cash-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No deals under $200k found</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or check back later</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
  tabCount: {
    marginLeft: 6,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  tabCountTextActive: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
  },
  sourceTag: {
    backgroundColor: '#f0f0f0',
  },
  sourceTagText: {
    color: '#666',
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
  brokerName: {
    fontSize: 12,
    color: '#666',
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
});

// Export with subscription guard - Single default export
export default withSubscription(Under200kScreen, ACCESS_TYPES.VIEW_LISTINGS);
