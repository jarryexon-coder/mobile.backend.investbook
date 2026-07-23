import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchByLocation } from './rapidApiService';
import { EXPO_PUBLIC_APIFY_API_TOKEN, EXPO_PUBLIC_RAPIDAPI_KEY } from '@env';
import { generateMockBusinesses, generateMockRealEstate } from './mockDataGenerator';

// Use environment variables
const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;
const RAPIDAPI_KEY = EXPO_PUBLIC_RAPIDAPI_KEY;

console.log('🔑 APIFY Token loaded:', APIFY_API_TOKEN ? '✅ Yes' : '❌ No');

// ✅ Winner: shahidirfan~bizbuysell-scraper - 50 results, $0.075, 8.6 seconds
// ✅ Backup: fatihtahta~bizbuysell-scraper - 57+ results, still running
const BIZBUYSELL_ACTORS = [
    'shahidirfan~bizbuysell-scraper',      // ⭐ BEST - 50 results, fast, reliable
    'fatihtahta~bizbuysell-scraper',        // 🔄 Good backup - 57+ results
];

// Helper to call Apify API
const callApifyActor = async (actorId, input) => {
    if (!APIFY_API_TOKEN) {
        console.warn('⚠️ APIFY_API_TOKEN not set');
        return null;
    }
    
    try {
        console.log(`🚀 Starting actor: ${actorId}`);
        
        const response = await axios.post(
            `https://api.apify.com/v2/acts/${actorId}/runs`,
            input,
            {
                params: { token: APIFY_API_TOKEN },
                headers: { 
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            }
        );

        const runId = response.data.data.id;
        console.log(`✅ Run started: ${runId}`);
        
        let attempts = 0;
        const maxAttempts = 30;
        
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
                            limit: 200
                        },
                        timeout: 30000
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
        console.error('API Error:', error.response?.data || error.message);
        return null;
    }
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

// Map BizBuySell data to our format (optimized for shahidirfan's output)
const mapBizBuySellData = (item) => {
    // Handle different field names from different actors
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

// Main scraper function - uses the winning actor
export const scrapeBizBuySell = async (keyword = '', location = '', state = '', limit = 50) => {
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
    };

    let allResults = [];
    
    for (const actorId of BIZBUYSELL_ACTORS) {
        try {
            console.log(`🔍 Trying actor: ${actorId}`);
            const results = await callApifyActor(actorId, input);
            
            if (results && results.length > 0) {
                console.log(`✅ ${actorId} returned ${results.length} results`);
                
                // Map results
                const mappedResults = results
                    .map(mapBizBuySellData)
                    .filter(item => item && item.title && item.title !== '');
                
                allResults = [...allResults, ...mappedResults];
                
                // If we have enough results, stop
                if (allResults.length >= limit) {
                    console.log(`✅ Got ${allResults.length} results, enough for now`);
                    break;
                }
            }
        } catch (error) {
            console.log(`❌ ${actorId} failed: ${error.message}`);
        }
    }
    
    if (allResults.length > 0) {
        console.log(`📊 Total results: ${allResults.length}`);
        return allResults.slice(0, limit);
    }
    
    // If all actors failed, use mock data
    console.log('⚠️ All actors failed, using mock data');
    return generateMockBusinesses(location || 'United States', limit);
};

// Combined fetch function
export const fetchAllOpportunities = async (searchParams = {}) => {
    const {
        keyword = '',
        location = '',
        state = '',
        city = '',
        propertyType = 'all',
        limit = 50,
        searchType = 'For_Sale',
        nationwide = true,
    } = searchParams;

    const results = {
        businesses: [],
        realEstate: [],
        properties: [],
        errors: [],
    };

    // Fetch businesses using Apify
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
            results.businesses = data;
            console.log(`✅ Businesses: ${results.businesses.length} results`);
        }
    } catch (error) {
        console.error('Business fetch failed:', error.message);
        results.errors.push({ source: 'Business', error: error.message });
    }

    // Fetch properties via RapidAPI (LoopNet)
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
                    results.realEstate = listings.map(item => ({
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
                    }));
                    console.log(`✅ Properties: ${results.realEstate.length} results`);
                }
            } catch (rapidError) {
                console.log('⚠️ Property search failed, using mock data');
                const mockRealEstate = generateMockRealEstate(searchLocation, Math.min(limit, 30));
                results.realEstate = mockRealEstate;
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
        results.businesses = generateMockBusinesses(location || 'United States', Math.min(limit, 20));
    }

    // If no real estate, add mock real estate
    if (results.realEstate.length === 0) {
        console.log('⚠️ Adding sample properties');
        results.realEstate = generateMockRealEstate(location || 'United States', Math.min(limit, 15));
    }

    return results;
};

// Cache functions
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
            if (age < 30 * 60 * 1000) {
                return JSON.parse(cached);
            }
        }
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
};
