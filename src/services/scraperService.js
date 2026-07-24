import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchByLocation } from './rapidApiService';
import { EXPO_PUBLIC_APIFY_API_TOKEN, EXPO_PUBLIC_RAPIDAPI_KEY, EXPO_PUBLIC_API_URL } from '@env';
import { generateMockBusinesses, generateMockRealEstate } from './mockDataGenerator';

// Use environment variables
const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;
const RAPIDAPI_KEY = EXPO_PUBLIC_RAPIDAPI_KEY;
const API_URL = EXPO_PUBLIC_API_URL;

console.log('🔑 APIFY Token loaded:', APIFY_API_TOKEN ? '✅ Yes' : '❌ No');
console.log('🔑 API_URL:', API_URL);

// ✅ Primary: memo23~loopnet-scraper-ppe - 1000+ results (NEEDS SUBSCRIPTION)
const BIZBUYSELL_ACTORS = [
    'memo23~loopnet-scraper-ppe',
    'shahidirfan~bizbuysell-scraper',
    'fatihtahta~bizbuysell-scraper',
];

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Helper to call Apify API with retry logic
const callApifyActor = async (actorId, input, retries = 2) => {
    if (!APIFY_API_TOKEN) {
        console.warn('⚠️ APIFY_API_TOKEN not set');
        return null;
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`🚀 Starting actor: ${actorId} (attempt ${attempt + 1})`);
            
            const response = await axios.post(
                `https://api.apify.com/v2/acts/${actorId}/runs`,
                input,
                {
                    params: { token: APIFY_API_TOKEN },
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    timeout: 120000,
                }
            );

            const runId = response.data.data.id;
            console.log(`✅ Run started: ${runId}`);
            
            let attempts = 0;
            const maxAttempts = 60;
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const statusRes = await axios.get(
                    `https://api.apify.com/v2/actor-runs/${runId}`,
                    { 
                        params: { token: APIFY_API_TOKEN },
                        timeout: 30000
                    }
                );
                
                const status = statusRes.data.data.status;
                console.log(`📊 Status: ${status}`);
                
                if (status === 'SUCCEEDED') {
                    const datasetId = statusRes.data.data.defaultDatasetId;
                    const resultsRes = await axios.get(
                        `https://api.apify.com/v2/datasets/${datasetId}/items`,
                        { 
                            params: { 
                                token: APIFY_API_TOKEN,
                                format: 'json',
                                limit: 1000
                            },
                            timeout: 60000
                        }
                    );
                    return resultsRes.data;
                } else if (status === 'FAILED' || status === 'ABORTED') {
                    throw new Error(`Run ${status}`);
                }
                attempts++;
            }
            
            throw new Error('Run timed out');
        } catch (error) {
            const errorMsg = error.response?.data || error.message;
            console.error(`❌ Attempt ${attempt + 1} failed:`, errorMsg);
            
            if (errorMsg?.error?.message?.includes('User was not found') || 
                errorMsg?.includes('User was not found')) {
                console.log(`⚠️ Actor ${actorId} requires subscription, skipping...`);
                return null;
            }
            
            if (attempt === retries) {
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    return null;
};

// Parse price from string
const parsePrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    
    let cleaned = String(priceString).replace(/[$€£,]/g, '').trim();
    
    if (cleaned.toLowerCase().includes('k')) {
        cleaned = cleaned.toLowerCase().replace('k', '');
        return parseFloat(cleaned) * 1000;
    }
    
    if (cleaned.toLowerCase().includes('m')) {
        cleaned = cleaned.toLowerCase().replace('m', '');
        return parseFloat(cleaned) * 1000000;
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

// Format price for display
export const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
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

// Map LoopNet data from memo23
const mapLoopNetData = (item) => {
    let price = 0;
    if (item.priceNumeric) price = parseFloat(item.priceNumeric);
    else if (item.price) price = parsePrice(item.price);
    else if (item.formattedPrice) price = parsePrice(item.formattedPrice);
    
    const location = [item.city, item.state, item.country].filter(Boolean).join(', ');
    
    return {
        id: item.propertyId || item.id || `prop-${Math.random()}`,
        title: item.title || item.name || item.address || 'Property for Sale',
        price: price,
        priceDisplay: formatPrice(price),
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        country: item.country || '',
        location: location || 'N/A',
        propertyType: item.propertyType || item.propertySubtype || 'Commercial',
        source: getCleanSource('Property Listing'),
        url: item.listingUrl || item.url || '',
        description: item.description || '',
        imageUrl: item.photo || item.images?.[0] || '',
        size: item.totalSize || item.buildingSize || item.sizeFormatted || '',
        broker: item.brokerName || '',
        brokerCompany: item.brokerCompany || '',
        brokerEmail: item.brokerEmail || '',
        brokerPhone: item.brokerPhone || '',
        yearBuilt: item.yearBuilt || '',
        lotSize: item.lotSize || '',
        zoning: item.zoning || '',
        capRate: item.capRate || '',
        details: item,
    };
};

// Map BizBuySell data
const mapBizBuySellData = (item) => {
    const price = item.price || item.asking_price || 0;
    const cashFlow = item.cash_flow || item.net_income || item.profit || 0;
    const revenue = item.gross_revenue || item.annual_revenue || item.revenue || 0;
    
    return {
        id: item.listing_id || item.id || `biz-${Math.random()}`,
        title: item.title || item.name || 'Business for Sale',
        price: parsePrice(price),
        priceDisplay: formatPrice(parsePrice(price)),
        revenue: parsePrice(revenue),
        cashFlow: parsePrice(cashFlow),
        location: item.location || item.city || `${item.city || ''}, ${item.state || ''}` || 'N/A',
        city: item.city || '',
        state: item.state || item.state_code || '',
        category: item.category || item.listing_category || item.business_type || 'Business',
        source: getCleanSource('Business Listing'),
        url: item.url || '',
        description: item.description || item.summary || '',
        broker: item.broker_name || item.broker || item.broker_company || 'N/A',
        brokerPhone: item.contact_phone || item.phone || '',
        imageUrl: item.image_url || item.image || item.images?.[0] || '',
        yearEstablished: item.year_established || '',
        employees: item.employees_full_time || item.employees_part_time || '',
        buildingSize: item.building_square_feet || '',
        details: item,
    };
};

// 🔥 NEW: Get data from backend cache
const getBackendCache = async () => {
    try {
        console.log('🌐 Checking backend cache...');
        const response = await axios.get(`${API_URL}/cache/businesses`);
        if (response.data && response.data.status === 'success' && response.data.data) {
            console.log(`✅ Backend cache has ${response.data.count} items`);
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.log('⚠️ Backend cache not available:', error.message);
        return null;
    }
};

// Get AsyncStorage cached data
const getAsyncCache = async () => {
    try {
        const cached = await AsyncStorage.getItem('cachedBusinessData');
        const cachedTime = await AsyncStorage.getItem('cachedBusinessTime');
        
        if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < CACHE_DURATION) {
                const parsed = JSON.parse(cached);
                console.log(`📦 Async cache hit: ${parsed.length} items (${Math.round(age/1000/60)} min old)`);
                return parsed;
            } else {
                console.log(`⏰ Async cache expired (${Math.round(age/1000/60)} min old)`);
            }
        }
        return null;
    } catch (error) {
        console.error('Async cache read error:', error);
        return null;
    }
};

// Save to AsyncStorage cache
const saveToAsyncCache = async (data) => {
    try {
        if (data && data.length > 0) {
            await AsyncStorage.setItem('cachedBusinessData', JSON.stringify(data));
            await AsyncStorage.setItem('cachedBusinessTime', Date.now().toString());
            console.log(`💾 Saved ${data.length} items to Async cache`);
        }
    } catch (error) {
        console.error('Async cache save error:', error);
    }
};

// Main scraper function - CHECK BACKEND CACHE FIRST
export const scrapeBizBuySell = async (keyword = '', location = '', state = '', limit = 50) => {
    console.log('🔍 Checking backend cache first...');
    
    // 1️⃣ FIRST: Check backend cache (has 1063 listings!)
    const backendData = await getBackendCache();
    if (backendData && backendData.length > 0) {
        console.log(`📦 Using backend cache: ${backendData.length} results`);
        // Also save to Async cache for offline use
        await saveToAsyncCache(backendData);
        return backendData.slice(0, limit);
    }
    
    // 2️⃣ SECOND: Check AsyncStorage cache
    console.log('🔄 Backend cache empty, checking AsyncStorage...');
    const asyncData = await getAsyncCache();
    if (asyncData && asyncData.length > 0) {
        console.log(`📦 Using Async cache: ${asyncData.length} results`);
        return asyncData.slice(0, limit);
    }
    
    // 3️⃣ THIRD: Try actors
    console.log('🔄 No cache found, trying actors...');
    
    const baseUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
    const searchParams = [];
    if (keyword) searchParams.push(`q=${encodeURIComponent(keyword)}`);
    if (location) searchParams.push(`location=${encodeURIComponent(location)}`);
    if (state) searchParams.push(`state=${encodeURIComponent(state)}`);
    
    const url = searchParams.length > 0 ? `${baseUrl}?${searchParams.join('&')}` : baseUrl;
    
    const input = {
        startUrls: [{ url: url }],
        results_wanted: Math.min(limit, 50),
        max_pages: 2,
        searchType: 'For_Sale',
        us: true,
        uk: false,
        detailed: true,
        brokers: false,
    };

    let allResults = [];
    
    for (const actorId of BIZBUYSELL_ACTORS) {
        try {
            console.log(`🔍 Trying actor: ${actorId}`);
            const results = await callApifyActor(actorId, input);
            
            if (results && results.length > 0) {
                console.log(`✅ ${actorId} returned ${results.length} results`);
                
                let mappedResults;
                if (actorId === 'memo23~loopnet-scraper-ppe') {
                    mappedResults = results.map(mapLoopNetData);
                } else {
                    mappedResults = results.map(mapBizBuySellData);
                }
                
                const filtered = mappedResults.filter(item => item && item.title && item.title !== '');
                allResults = [...allResults, ...filtered];
                
                if (allResults.length >= limit) {
                    console.log(`✅ Got ${allResults.length} results`);
                    await saveToAsyncCache(allResults);
                    return allResults.slice(0, limit);
                }
            }
        } catch (error) {
            console.log(`❌ ${actorId} failed:`, error.message);
        }
    }
    
    // 4️⃣ LAST: Use mock data
    console.log('⚠️ No data available, generating mock data...');
    const mockData = generateMockBusinesses(location || 'United States', limit);
    await saveToAsyncCache(mockData);
    return mockData;
};

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
        source: 'unknown',
    };

    // Fetch businesses with caching
    try {
        console.log('🔍 Fetching business listings...');
        let searchLocation = location || city || '';
        let searchState = state || '';
        
        if (!searchLocation && !searchState && nationwide) {
            searchLocation = 'United States';
            console.log('📍 Searching nationwide for businesses');
        }
        
        const data = await scrapeBizBuySell(keyword, searchLocation, searchState, Math.min(limit, 50));
        
        if (data && data.length > 0) {
            // IMPROVED CLASSIFICATION: Better separation of businesses and properties
            const businesses = [];
            const properties = [];
            
            data.forEach(item => {
                // Check if it's a business (has business-specific fields)
                const isBusiness = 
                    item.category || 
                    item.cashFlow || 
                    item.revenue || 
                    item.ebitda ||
                    item.broker ||
                    (item.source && item.source.includes('Business')) ||
                    (item.title && (
                        item.title.includes('Business') || 
                        item.title.includes('Company') || 
                        item.title.includes('Agency') ||
                        item.title.includes('Franchise') ||
                        item.title.includes('for Sale') && item.buildingSize
                    ));
                
                // Check if it's a property (has property-specific fields)
                const isProperty = 
                    item.propertyType || 
                    item.address || 
                    item.size || 
                    item.lotSize ||
                    item.buildingSize ||
                    item.totalSize ||
                    (item.source && item.source.includes('Property')) ||
                    (item.title && (
                        item.title.includes('Building') || 
                        item.title.includes('Property') || 
                        item.title.includes('Land') ||
                        item.title.includes('Warehouse') ||
                        item.title.includes('Office') ||
                        item.title.includes('Retail')
                    ));
                
                // Classify based on what's available
                if (isBusiness && !isProperty) {
                    businesses.push(item);
                } else if (isProperty && !isBusiness) {
                    properties.push(item);
                } else if (isBusiness && isProperty) {
                    // If both, check which one is stronger
                    if (item.propertyType || item.address) {
                        properties.push(item);
                    } else {
                        businesses.push(item);
                    }
                } else {
                    // Default: check if it has a price and title, guess based on source
                    if (item.source && item.source.includes('Sample')) {
                        businesses.push(item);
                    } else if (item.propertyType || item.address) {
                        properties.push(item);
                    } else {
                        businesses.push(item);
                    }
                }
            });
            
            results.businesses = businesses;
            results.realEstate = properties;
            
            if (results.businesses.length > 0) {
                const firstItem = results.businesses[0];
                results.source = firstItem.source?.includes('Sample') ? 'mock' : 'cached';
            } else if (results.realEstate.length > 0) {
                const firstItem = results.realEstate[0];
                results.source = firstItem.source?.includes('Sample') ? 'mock' : 'cached';
            }
            
            console.log(`✅ Total: ${results.businesses.length} businesses, ${results.realEstate.length} properties (${results.source})`);
        }
    } catch (error) {
        console.error('Business fetch failed:', error.message);
        results.errors.push({ source: 'Business', error: error.message });
    }

    // Fetch properties (with fallback)
    try {
        let searchLocation = location || city || state || '';
        
        if (!searchLocation && nationwide) {
            searchLocation = 'United States';
        }
        
        if (searchLocation) {
            console.log(`📍 Searching properties in: ${searchLocation}`);
            
            try {
                const loopData = await searchByLocation({
                    location: searchLocation,
                    page: 1,
                    resultCount: Math.min(limit, 50),
                    searchType: searchType,
                    sortOrder: 'Recommended',
                    propertyType: propertyType,
                });
                
                const listings = loopData.searchResults || [];
                if (listings && listings.length > 0) {
                    results.realEstate = [...results.realEstate, ...listings.map(item => ({
                        id: item.id || item.propertyId || `prop-${Math.random()}`,
                        title: item.address || 'Property for Sale',
                        price: parsePrice(item.price),
                        priceDisplay: formatPrice(parsePrice(item.price)),
                        address: item.address || '',
                        city: item.city || city || '',
                        state: item.state || state || '',
                        propertyType: item.propertyType || propertyType,
                        source: getCleanSource('Property Listing'),
                        url: item.url || '',
                        description: item.description || '',
                        imageUrl: item.photo || '',
                        size: item.sizeLabel || '',
                        details: item,
                    }))];
                    console.log(`✅ Properties: ${results.realEstate.length} results`);
                }
            } catch (rapidError) {
                console.log('⚠️ Property search failed, using mock data');
                const mockRealEstate = generateMockRealEstate(searchLocation, Math.min(limit, 30));
                results.realEstate = [...results.realEstate, ...mockRealEstate.map(item => ({
                    ...item,
                    source: getCleanSource('Sample Data'),
                }))];
                results.errors.push({ source: 'Properties', error: rapidError.message });
            }
        }
    } catch (error) {
        console.error('Property search failed:', error.message);
        results.errors.push({ source: 'Properties', error: error.message });
    }

    // If no businesses, add mock businesses
    if (results.businesses.length === 0) {
        console.log('⚠️ Adding sample businesses');
        results.businesses = generateMockBusinesses(location || 'United States', Math.min(limit, 20)).map(item => ({
            ...item,
            source: getCleanSource('Sample Data'),
        }));
        results.source = 'mock';
    }

    // If no real estate, add mock real estate
    if (results.realEstate.length === 0) {
        console.log('⚠️ Adding sample properties');
        results.realEstate = generateMockRealEstate(location || 'United States', Math.min(limit, 15)).map(item => ({
            ...item,
            source: getCleanSource('Sample Data'),
        }));
    }

    return results;
};

// Export cache functions
export const cacheOpportunities = async (data) => {
    try {
        await AsyncStorage.setItem('cachedOpportunities', JSON.stringify(data));
        await AsyncStorage.setItem('cachedOpportunitiesTime', Date.now().toString());
    } catch (error) {
        console.error('Cache error:', error);
    }
};

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
