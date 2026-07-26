import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_APIFY_API_TOKEN, EXPO_PUBLIC_RAPIDAPI_KEY, EXPO_PUBLIC_API_URL } from '@env';
import { generateMockBusinesses, generateMockRealEstate } from './mockDataGenerator';

// Import the JSON data directly
import listingsData from '../data/listings.json';

// Use environment variables
const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;
const RAPIDAPI_KEY = EXPO_PUBLIC_RAPIDAPI_KEY;
const API_URL = EXPO_PUBLIC_API_URL;

console.log('🔑 APIFY Token loaded:', APIFY_API_TOKEN ? '✅ Yes' : '❌ No');
console.log('🔑 API_URL:', API_URL);

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Parse price from string
const parsePrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    
    if (typeof priceString === 'string') {
        const cleaned = priceString.replace(/[$€£,]/g, '').trim();
        
        if (cleaned.toLowerCase().includes('k')) {
            const num = parseFloat(cleaned.toLowerCase().replace('k', ''));
            return isNaN(num) ? 0 : num * 1000;
        }
        
        if (cleaned.toLowerCase().includes('m')) {
            const num = parseFloat(cleaned.toLowerCase().replace('m', ''));
            return isNaN(num) ? 0 : num * 1000000;
        }
        
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    
    return 0;
};

// Format price for display
export const formatPrice = (price) => {
    if (!price || price === 0) return 'Price Not Disclosed';
    if (typeof price === 'string') {
        const cleaned = price.replace(/[$€£,]/g, '').trim();
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 0) {
            return `$${num.toLocaleString()}`;
        }
        return price;
    }
    return `$${Math.round(price).toLocaleString()}`;
};

// Clean source name
const getCleanSource = (source) => {
    if (!source) return 'Listing';
    if (source.includes('LoopNet') || source.includes('RapidAPI')) {
        return 'Property Listing';
    }
    if (source.includes('BizBuySell') || source.includes('Apify')) {
        return 'Business Listing';
    }
    if (source.includes('Mock') || source.includes('Sample')) {
        return 'Sample Data';
    }
    return source;
};

// 🔥 Format listings from JSON data
const formatListingsFromJSON = (items) => {
    return items.map(item => {
        // Get the best title
        const title = item.name || item.title || item.address || 'Property Listing';
        
        // Get the best price
        let price = 0;
        let priceDisplay = 'Price Not Disclosed';
        
        if (item.price) {
            if (typeof item.price === 'number') {
                price = item.price;
                priceDisplay = `$${price.toLocaleString()}`;
            } else if (typeof item.price === 'string') {
                const parsed = parsePrice(item.price);
                if (parsed > 0) {
                    price = parsed;
                    priceDisplay = `$${price.toLocaleString()}`;
                } else {
                    priceDisplay = item.price;
                }
            }
        }
        
        // Check propertyFacts for price
        if (price === 0 && item.propertyFacts && item.propertyFacts.Price) {
            const parsed = parsePrice(item.propertyFacts.Price);
            if (parsed > 0) {
                price = parsed;
                priceDisplay = `$${price.toLocaleString()}`;
            }
        }
        
        // Get the best image URL
        let imageUrl = null;
        if (item.images && item.images.length > 0) {
            imageUrl = item.images[0];
        } else if (item.imageUrl) {
            imageUrl = item.imageUrl;
        } else if (item.image) {
            imageUrl = item.image;
        } else if (item.photo) {
            imageUrl = item.photo;
        }
        
        // Get location
        const location = [item.city, item.state, item.country].filter(Boolean).join(', ');
        
        return {
            id: item.propertyId || item.id || `prop-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            name: title,
            price: price,
            priceDisplay: priceDisplay,
            priceNumeric: price,
            address: item.address || '',
            city: item.city || '',
            state: item.state || '',
            country: item.country || 'US',
            location: location || 'Location N/A',
            propertyType: item.propertyType || 'Commercial',
            propertySubtype: item.propertySubtype || '',
            category: item.category || '',
            source: 'LoopNet',
            sourceType: item.sourceType || 'listingWeb',
            url: item.listingUrl || item.url || '',
            listingUrl: item.listingUrl || item.url || '',
            description: item.description || item.summary || '',
            imageUrl: imageUrl,
            photo: imageUrl,
            images: item.images || [],
            broker: item.brokerName || item.broker || '',
            brokerName: item.brokerName || item.broker || '',
            brokerCompany: item.brokerCompany || '',
            brokerPhone: item.brokerPhone || '',
            brokerEmail: item.brokerEmail || '',
            size: item.size || item.totalSize || item.buildingSize || '',
            lotSize: item.lotSize || '',
            yearBuilt: item.yearBuilt || '',
            cashFlow: item.cashFlow || 0,
            revenue: item.revenue || 0,
            propertyFacts: item.propertyFacts || {},
            buildingClass: item.buildingClass || '',
            numberOfStories: item.numberOfStories || '',
            parkingRatio: item.parkingRatio || '',
            tenancy: item.tenancy || '',
            saleType: item.saleType || '',
            zip: item.zip || '',
            dateUpdated: item.dateUpdated || '',
            hasValidId: true,
            isProperty: true,
            isBusiness: false,
            details: item,
        };
    });
};

// 🔥 Load listings from JSON (primary source)
const loadListingsFromJSON = () => {
    try {
        console.log(`📦 Loading ${listingsData.length} listings from JSON`);
        const formatted = formatListingsFromJSON(listingsData);
        return formatted;
    } catch (error) {
        console.error('❌ Error loading JSON:', error);
        return [];
    }
};

// 🔥 Get listings from AsyncStorage cache first, then JSON
const getListings = async () => {
    try {
        // Try AsyncStorage first
        const cached = await AsyncStorage.getItem('listings_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.length > 0) {
                console.log(`📦 Using cached listings: ${parsed.length} items`);
                return parsed;
            }
        }
        
        // If no cache, load from JSON and cache it
        console.log('🔄 Loading listings from JSON...');
        const listings = loadListingsFromJSON();
        
        if (listings && listings.length > 0) {
            // Save to AsyncStorage for next time
            await AsyncStorage.setItem('listings_cache', JSON.stringify(listings));
            console.log(`💾 Cached ${listings.length} listings`);
            return listings;
        }
        
        return [];
    } catch (error) {
        console.error('❌ Error getting listings:', error);
        // Fallback to JSON
        return loadListingsFromJSON();
    }
};

// Main scraper function - NOW USES LOCAL JSON
export const scrapeBizBuySell = async (keyword = '', location = '', state = '', limit = 50) => {
    console.log('🔍 Loading listings from local JSON...');
    
    try {
        // Get all listings from cache/JSON
        const allListings = await getListings();
        
        if (!allListings || allListings.length === 0) {
            console.log('⚠️ No listings found, using mock data');
            return generateMockBusinesses(location || 'United States', Math.min(limit, 20));
        }
        
        // Filter by location if provided
        let filtered = allListings;
        if (location || state) {
            const searchLocation = (location || '').toLowerCase();
            const searchState = (state || '').toLowerCase();
            
            filtered = allListings.filter(item => {
                const itemLocation = (item.city || '') + ' ' + (item.state || '') + ' ' + (item.address || '');
                return !searchLocation || itemLocation.toLowerCase().includes(searchLocation) ||
                       !searchState || (item.state || '').toLowerCase().includes(searchState);
            });
        }
        
        // Filter by keyword if provided
        if (keyword) {
            const searchKeyword = keyword.toLowerCase();
            filtered = filtered.filter(item => {
                const searchable = (item.title || '') + ' ' + (item.description || '') + ' ' + (item.propertyType || '');
                return searchable.toLowerCase().includes(searchKeyword);
            });
        }
        
        console.log(`✅ Found ${filtered.length} matching listings`);
        
        // Sort by price (low to high)
        const sorted = filtered.sort((a, b) => {
            const priceA = a.priceNumeric || a.price || 0;
            const priceB = b.priceNumeric || b.price || 0;
            return priceA - priceB;
        });
        
        // Limit results
        const results = sorted.slice(0, Math.min(limit || 50, sorted.length));
        
        // Save to AsyncStorage cache
        await AsyncStorage.setItem('cachedBusinessData', JSON.stringify(results));
        await AsyncStorage.setItem('cachedBusinessTime', Date.now().toString());
        
        return results;
        
    } catch (error) {
        console.error('❌ Error scraping:', error);
        return generateMockBusinesses(location || 'United States', Math.min(limit, 20));
    }
};

// 🔥 Main function to fetch all opportunities
export const fetchAllOpportunities = async (searchParams = {}) => {
    const {
        keyword = '',
        location = '',
        state = '',
        city = '',
        propertyType = 'all',
        limit = 200,
        searchType = 'For_Sale',
        nationwide = true,
    } = searchParams;

    const results = {
        businesses: [],
        realEstate: [],
        properties: [],
        errors: [],
        source: 'local_json',
    };

    try {
        console.log('📊 Fetching opportunities from local data...');
        
        // Get all listings
        let allListings = await getListings();
        
        if (!allListings || allListings.length === 0) {
            console.log('⚠️ No listings found, generating mock data');
            results.businesses = generateMockBusinesses(location || 'United States', 20);
            results.realEstate = generateMockRealEstate(location || 'United States', 30);
            results.source = 'mock';
            return results;
        }
        
        // Apply filters
        let filtered = allListings;
        
        // Location filter
        if (location || city || state) {
            const searchLocation = (location || city || '').toLowerCase();
            const searchState = (state || '').toLowerCase();
            
            filtered = filtered.filter(item => {
                const itemLocation = (item.city || '') + ' ' + (item.state || '') + ' ' + (item.address || '');
                if (searchLocation && !itemLocation.toLowerCase().includes(searchLocation)) return false;
                if (searchState && !(item.state || '').toLowerCase().includes(searchState)) return false;
                return true;
            });
        }
        
        // Property type filter
        if (propertyType && propertyType !== 'all') {
            filtered = filtered.filter(item => 
                (item.propertyType || '').toLowerCase().includes(propertyType.toLowerCase())
            );
        }
        
        // Keyword filter
        if (keyword) {
            const searchKeyword = keyword.toLowerCase();
            filtered = filtered.filter(item => {
                const searchable = (item.title || '') + ' ' + (item.description || '') + ' ' + (item.propertyType || '');
                return searchable.toLowerCase().includes(searchKeyword);
            });
        }
        
        console.log(`✅ Found ${filtered.length} matching listings`);
        
        // Separate into businesses and real estate
        const businesses = [];
        const realEstate = [];
        
        filtered.forEach(item => {
            // Check if it's a business listing
            const isBusiness = 
                item.category || 
                item.cashFlow || 
                item.revenue || 
                item.ebitda ||
                item.yearEstablished ||
                item.employees ||
                (item.propertyType && ['Office', 'Retail', 'Commercial'].includes(item.propertyType));
            
            if (isBusiness) {
                businesses.push(item);
            } else {
                realEstate.push(item);
            }
        });
        
        // Sort by price
        const sortByPrice = (items) => {
            return items.sort((a, b) => {
                const priceA = a.priceNumeric || a.price || 0;
                const priceB = b.priceNumeric || b.price || 0;
                return priceA - priceB;
            });
        };
        
        results.businesses = sortByPrice(businesses);
        results.realEstate = sortByPrice(realEstate);
        results.properties = sortByPrice(realEstate);
        results.source = 'local_json';
        
        console.log(`📊 Results: ${results.businesses.length} businesses, ${results.realEstate.length} properties`);
        
        // Cache results
        await AsyncStorage.setItem('cachedOpportunities', JSON.stringify(results));
        await AsyncStorage.setItem('cachedOpportunitiesTime', Date.now().toString());
        
        return results;
        
    } catch (error) {
        console.error('❌ Error fetching opportunities:', error);
        results.errors.push({ source: 'Main', error: error.message });
        
        // Try to get cached data
        try {
            const cached = await AsyncStorage.getItem('cachedOpportunities');
            if (cached) {
                const parsed = JSON.parse(cached);
                console.log(`📦 Using cached opportunities: ${parsed.businesses?.length || 0} businesses, ${parsed.realEstate?.length || 0} properties`);
                return parsed;
            }
        } catch (cacheError) {
            console.error('Cache fallback error:', cacheError);
        }
        
        // Final fallback: mock data
        console.log('⚠️ Using mock data as final fallback');
        results.businesses = generateMockBusinesses(location || 'United States', 20);
        results.realEstate = generateMockRealEstate(location || 'United States', 30);
        results.source = 'mock';
        return results;
    }
};

// Get opportunities from cache
export const getCachedOpportunities = async () => {
    try {
        const cached = await AsyncStorage.getItem('cachedOpportunities');
        const cachedTime = await AsyncStorage.getItem('cachedOpportunitiesTime');
        
        if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < CACHE_DURATION) {
                return JSON.parse(cached);
            }
        }
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
};

// Cache opportunities
export const cacheOpportunities = async (data) => {
    try {
        await AsyncStorage.setItem('cachedOpportunities', JSON.stringify(data));
        await AsyncStorage.setItem('cachedOpportunitiesTime', Date.now().toString());
        console.log('💾 Cached opportunities');
    } catch (error) {
        console.error('Cache error:', error);
    }
};

export default {
    fetchAllOpportunities,
    scrapeBizBuySell,
    getCachedOpportunities,
    cacheOpportunities,
    formatPrice,
};
