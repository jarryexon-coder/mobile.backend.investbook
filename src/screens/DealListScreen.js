import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { searchProperties, cacheListings } from '../services/api';
import { getSafeImageUrl, getPlaceholderImage } from '../utils/imageUtils';

const DealCard = ({ deal, onPress }) => {
  const imageUrl = getSafeImageUrl(deal);
  const placeholderUrl = getPlaceholderImage(deal);
  const hasRealImage = imageUrl && !imageUrl.includes('unsplash.com');
  
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(deal)}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl || placeholderUrl }}
          style={styles.cardImage}
          resizeMode="cover"
          onError={(e) => {
            // If image fails, use placeholder
            e.target.source = { uri: placeholderUrl };
          }}
        />
        {hasRealImage && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>● Live</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {deal.title || deal.name || 'Property'}
        </Text>
        <Text style={styles.cardPrice}>{deal.price || 'Contact for price'}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          {deal.city || deal.address || 'Location available'}
        </Text>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{deal.propertyType || 'Commercial'}</Text>
          </View>
          {deal.source && deal.source !== 'Mock Data' && (
            <View style={[styles.tag, styles.sourceTag]}>
              <Text style={[styles.tagText, styles.sourceTagText]}>{deal.source}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DealListScreen({ navigation }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDeals, setFilteredDeals] = useState([]);

  const loadDeals = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const results = await searchProperties('', 'United States');
      
      // Cache the results
      await cacheListings(results);
      
      setDeals(results);
      setFilteredDeals(results);
      console.log(`📊 Loaded ${results.length} deals`);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDeals(deals);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = deals.filter(deal => {
        const searchable = [
          deal.title,
          deal.name,
          deal.address,
          deal.city,
          deal.propertyType,
          deal.category,
          deal.description,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(query);
      });
      setFilteredDeals(filtered);
    }
  }, [searchQuery, deals]);

  const handleRefresh = useCallback(() => {
    loadDeals(true);
  }, []);

  const renderDeal = ({ item }) => (
    <DealCard deal={item} onPress={(deal) => navigation.navigate('DealDetail', { deal })} />
  );

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
          <Text style={styles.headerTitle}>Investment Properties</Text>
          <Text style={styles.headerSubtitle}>{filteredDeals.length} deals available</Text>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredDeals}
          renderItem={renderDeal}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="business-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No properties found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
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
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
    gap: 6,
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
