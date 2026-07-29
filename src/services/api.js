import AsyncStorage from '@react-native-async-storage/async-storage';
import listingsData from '../data/listings.json';

// Format listings consistently
const formatListing = (item) => ({
  id: item.propertyId || item.id || Math.random().toString(36).substr(2, 9),
  title: item.name || item.title || 'Property',
  price: item.price || 'Contact for price',
  priceDisplay: item.priceDisplay || item.price || 'Contact for price',
  address: item.address || '',
  city: item.city || '',
  state: item.state || '',
  propertyType: item.propertyType || 'Commercial',
  description: item.description || item.summary || '',
  images: item.images || [],
  imageUrl: item.imageUrl || item.image || item.photo || '',
  photo: item.photo || '',
  broker: item.brokerName || item.broker || '',
  brokerName: item.brokerName || item.broker || '',
  brokerCompany: item.brokerCompany || '',
  brokerPhone: item.brokerPhone || '',
  brokerEmail: item.brokerEmail || '',
  url: item.listingUrl || item.url || '',
  listingUrl: item.listingUrl || item.url || '',
  source: 'LoopNet',
  sourceType: item.sourceType || 'listingWeb',
  propertyFacts: item.propertyFacts || {},
  cashFlow: item.cashFlow || '',
  revenue: item.revenue || '',
  yearBuilt: item.yearBuilt || '',
  lotSize: item.lotSize || '',
  squareFeet: item.squareFeet || '',
  capRate: item.capRate || '',
  propertySubtype: item.propertySubtype || '',
  buildingClass: item.buildingClass || '',
  numberOfStories: item.numberOfStories || '',
  parkingRatio: item.parkingRatio || '',
  tenancy: item.tenancy || '',
  saleType: item.saleType || '',
  zip: item.zip || '',
  country: item.country || 'US',
  dateUpdated: item.dateUpdated || '',
});

// Get all listings from cache or JSON
export const getAllListings = async () => {
  try {
    // Try cache first
    const cached = await AsyncStorage.getItem('listings_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.length > 0) {
        console.log(`📦 Using cached listings: ${parsed.length}`);
        return parsed;
      }
    }
    
    // If no cache, use JSON data
    console.log('📦 Loading from JSON...');
    const formatted = listingsData.map(formatListing);
    
    // Save to cache for next time
    await AsyncStorage.setItem('listings_cache', JSON.stringify(formatted));
    console.log(`💾 Cached ${formatted.length} listings`);
    
    return formatted;
  } catch (error) {
    console.error('❌ Error loading listings:', error);
    // Fallback: try JSON directly
    try {
      return listingsData.map(formatListing);
    } catch (e) {
      console.error('❌ JSON fallback failed:', e);
      return [];
    }
  }
};

// Search properties with filtering
export const searchProperties = async (query = '', location = 'United States') => {
  console.log(`🔍 Searching properties in: ${location}`);
  
  try {
    // Get all listings from cache
    const allListings = await getAllListings();
    
    // Filter based on query and location
    let results = allListings;
    
    if (query && query.trim() !== '') {
      const searchTerm = query.toLowerCase().trim();
      results = results.filter(item => {
        const searchable = [
          item.title,
          item.name,
          item.address,
          item.city,
          item.state,
          item.propertyType,
          item.category,
          item.description,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(searchTerm);
      });
    }
    
    if (location && location !== 'United States') {
      results = results.filter(item => 
        item.city?.toLowerCase().includes(location.toLowerCase()) ||
        item.state?.toLowerCase().includes(location.toLowerCase()) ||
        item.country?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    console.log(`✅ Found ${results.length} properties`);
    return results;
    
  } catch (error) {
    console.error('❌ Search error:', error);
    return [];
  }
};

// Get property by ID
export const getPropertyById = async (id) => {
  try {
    const allListings = await getAllListings();
    return allListings.find(item => item.id === id) || null;
  } catch (error) {
    console.error('❌ Error getting property:', error);
    return null;
  }
};

// Get properties by type
export const getPropertiesByType = async (type) => {
  try {
    const allListings = await getAllListings();
    if (!type || type === 'all') return allListings;
    return allListings.filter(item => 
      item.propertyType?.toLowerCase().includes(type.toLowerCase())
    );
  } catch (error) {
    console.error('❌ Error filtering by type:', error);
    return [];
  }
};

// Export cache functions
export const cacheListings = async (listings) => {
  try {
    await AsyncStorage.setItem('listings_cache', JSON.stringify(listings));
    console.log(`💾 Cached ${listings.length} listings`);
  } catch (error) {
    console.error('❌ Cache error:', error);
  }
};

export default {
  getAllListings,
  searchProperties,
  getPropertyById,
  getPropertiesByType,
  cacheListings,
};
// Replace the @env imports with:
import { API_URL, APIFY_API_TOKEN, RAPIDAPI_KEY } from '../utils/env';

// Instead of:
// import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_APIFY_API_TOKEN, EXPO_PUBLIC_RAPIDAPI_KEY } from '@env';
