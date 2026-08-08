import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPlaceholderImage,
  getSafeImageUrl,
  initImageUtils,
} from '../utils/imageUtils';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

// Memoized DealCard to prevent re-renders
const DealCard = React.memo(({ deal, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mappingReady, setMappingReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    initImageUtils()
      .catch(() => {})
      .finally(() => {
        if (isMounted) setMappingReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Prefer an image hosted by InvestBook. Direct source URLs remain a fallback
  // for a listing that has not yet been mapped.
  const imageUrl = useMemo(() => getSafeImageUrl(deal), [deal, mappingReady]);
  
  // Memoize the placeholder
  const placeholderUrl = useMemo(() => getPlaceholderImage(deal), [deal.id]);
  
  // Determine which URL to show - stable
  const displayUrl = useMemo(() => {
    if (imageError || !imageUrl) {
      return placeholderUrl;
    }
    return imageUrl;
  }, [imageError, imageUrl, placeholderUrl]);
  
  const hasRealImage = imageUrl && imageUrl !== placeholderUrl && !imageError;
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(deal)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {isLoading && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="small" color="#2563eb" />
          </View>
        )}
        <Image
          source={{ uri: displayUrl }}
          style={styles.cardImage}
          resizeMode="cover"
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setImageError(true);
          }}
        />
        {hasRealImage && !isLoading && (
          <View style={styles.liveBadge}>
            <Icon name="checkmark-circle" size={10} color="#10b981" />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {deal.title || deal.name || 'Property'}
        </Text>
        <Text style={styles.cardPrice}>{deal.priceDisplay || deal.price || 'Contact for price'}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {deal.city || deal.address || 'Location available'}
        </Text>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{deal.propertyType || 'Commercial'}</Text>
          </View>
          {deal.source && deal.source !== 'Mock Data' && deal.source !== 'Sample Data' && (
            <View style={[styles.tag, styles.sourceTag]}>
              <Text style={[styles.tagText, styles.sourceTagText]}>{deal.source}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the deal ID changes
  return prevProps.deal?.id === nextProps.deal?.id;
});

function DealsScreen({ navigation }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // The mapping connects listing IDs to images hosted by our API. Loading it
    // before cards render avoids depending on third-party image hotlinks.
    initImageUtils().catch(() => {});
  }, []);

  const loadDeals = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const cached = await AsyncStorage.getItem('listings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setDeals(parsed);
          console.log(`📊 Loaded ${parsed.length} deals from cache`);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
      
      console.log('🔄 No cache found, loading from API...');
      const { searchProperties } = await import('../services/api');
      const results = await searchProperties('', 'United States');
      
      if (results && results.length > 0) {
        setDeals(results);
        await AsyncStorage.setItem('listings_cache', JSON.stringify(results));
        console.log(`📊 Loaded ${results.length} deals from API`);
      } else {
        setDeals([]);
      }
    } catch (error) {
      console.error('❌ Error loading deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDeals();
    }, [loadDeals])
  );

  useEffect(() => {
    loadDeals();
  }, []);

  const handleRefresh = useCallback(() => {
    loadDeals(true);
  }, [loadDeals]);

  const renderDeal = useCallback(({ item }) => (
    <DealCard 
      deal={item} 
      onPress={(deal) => navigation.navigate('DealDetail', { deal })} 
    />
  ), [navigation]);

  const keyExtractor = useCallback((item, index) => {
    return item.id?.toString() || index.toString();
  }, []);

  if (loading && deals.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Deals</Text>
          <Text style={styles.headerSubtitle}>{deals.length} deals available</Text>
        </View>

        <FlatList
          data={deals}
          renderItem={renderDeal}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          maxToRenderPerBatch={10}
          windowSize={21}
          removeClippedSubviews={true}
          initialNumToRender={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="business-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No deals found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

export default withSubscription(DealsScreen, ACCESS_TYPES.VIEW_LISTINGS);

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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '500',
  },
  sourceTag: {
    backgroundColor: '#f0f0f0',
  },
  sourceTagText: {
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
  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
