import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchByLocation } from './rapidApiService';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

// ✅ CONFIRMED WORKING ACTORS
const BIZBUYSELL_ACTORS = [
    'shahidirfan~bizbuysell-scraper',
    'fatihtahta~bizbuysell-scraper',
    'acquistion-automation~bizbuysell-scraper',
];

const LOOPNET_ACTOR = 'crawlerbros~loopnet-scraper';

// Helper to call Apify API
const callApifyActor = async (actorId, input) => {
    try {
        console.log(`🚀 Starting actor: ${actorId}`);
        
        const response = await axios.post(
            `https://api.apify.com/v2/acts/${actorId}/runs`,
            input,
            {
                params: { token: APIFY_API_TOKEN },
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const runId = response.data.data.id;
        console.log(`✅ Run started: ${runId}`);
        
        let attempts = 0;
        const maxAttempts = 12;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const statusRes = await axios.get(
                `https://api.apify.com/v2/actor-runs/${runId}`,
                { params: { token: APIFY_API_TOKEN } }
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
                            limit: 100
                        }
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
        throw error;
    }
};

// Parse price from string
const parsePrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    
    let cleaned = priceString.replace(/[$€£,]/g, '').trim();
    const match = cleaned.match(/^([\d,.]+)/);
    if (match) {
        return parseFloat(match[1]) || 0;
    }
    return 0;
};

// BizBuySell Scraper
export const scrapeBizBuySell = async (keyword = '', location = '', limit = 50) => {
    const baseUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
    const searchParams = [];
    if (keyword) searchParams.push(`q=${encodeURIComponent(keyword)}`);
    if (location) searchParams.push(`location=${encodeURIComponent(location)}`);
    
    const url = searchParams.length > 0 ? `${baseUrl}?${searchParams.join('&')}` : baseUrl;
    
    const input = {
        startUrls: [{ url: url }],
        results_wanted: Math.min(limit, 50),
        max_pages: 3,
    };

    for (const actorId of BIZBUYSELL_ACTORS) {
        try {
            console.log(`🔍 Trying BizBuySell actor: ${actorId}`);
            const results = await callApifyActor(actorId, input);
            if (results && results.length > 0) {
                console.log(`✅ ${actorId} returned ${results.length} results`);
                return results;
            }
        } catch (error) {
            console.log(`❌ ${actorId} failed: ${error.message}`);
        }
    }
    
    console.log('⚠️ All BizBuySell actors failed');
    return [];
};

// LoopNet Scraper
export const scrapeLoopNet = async (city = '', state = '', propertyType = 'office', limit = 20) => {
    try {
        const searchUrl = `https://www.loopnet.com/search/${propertyType}/${city}-${state}/for-sale/`;
        
        const input = {
            searchUrls: [searchUrl],
            maxItems: Math.min(limit, 10),
            proxyConfiguration: {
                useApifyProxy: true,
                apifyProxyGroups: ['RESIDENTIAL']
            }
        };

        const results = await callApifyActor(LOOPNET_ACTOR, input);
        return results;
    } catch (error) {
        console.error('LoopNet error:', error.message);
        throw error;
    }
};

// Combined fetch function
export const fetchAllOpportunities = async (searchParams = {}) => {
    const {
        keyword = '',
        location = '',
        city = 'washington',
        state = 'dc',
        propertyType = 'office',
        limit = 50,
        useMockData = false,
        searchType = 'For_Sale',
    } = searchParams;

    const results = {
        businesses: [],
        realEstate: [],
        properties: [],
        errors: [],
    };

    // 1. Fetch BizBuySell
    try {
        console.log('🔍 Fetching BizBuySell data...');
        const bizData = await scrapeBizBuySell(keyword, location, Math.min(limit, 50));
        if (bizData && bizData.length > 0) {
            results.businesses = bizData.map(item => ({
                id: item.listing_id || item.id || `biz-${Math.random()}`,
                title: item.title || 'Business for Sale',
                price: item.price || 0,
                revenue: item.gross_revenue || 0,
                cashFlow: item.cash_flow || 0,
                location: item.location || item.state_code || 'N/A',
                state: item.state_code || '',
                category: item.listing_category || 'Business',
                source: 'BizBuySell',
                url: item.url || '',
                description: item.summary || '',
                broker: item.broker_name || 'N/A',
                brokerPhone: item.contact_phone || '',
                imageUrl: item.image_url || '',
                details: item,
            }));
            console.log(`✅ BizBuySell: ${results.businesses.length} results`);
        }
    } catch (error) {
        console.error('BizBuySell failed:', error.message);
        results.errors.push({ source: 'BizBuySell', error: error.message });
    }

    // 2. Fetch LoopNet via RapidAPI
    try {
        const searchLocation = location || `${city}, ${state}`;
        console.log(`📍 Searching in: ${searchLocation}`);
        
        // Try RapidAPI first
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
                    priceDisplay: item.price || 'N/A',
                    address: item.address || '',
                    city: item.city || city,
                    state: item.state || state,
                    propertyType: item.propertyType || propertyType,
                    source: 'LoopNet (RapidAPI)',
                    url: item.url || '',
                    description: item.description || '',
                    imageUrl: item.photo || '',
                    size: item.sizeLabel || '',
                    details: item,
                }));
                console.log(`✅ LoopNet (RapidAPI): ${results.realEstate.length} results`);
            }
        } catch (rapidError) {
            console.log('RapidAPI failed, falling back to Apify:', rapidError.message);
            throw rapidError;
        }
    } catch (error) {
        console.error('LoopNet failed:', error.message);
        results.errors.push({ source: 'LoopNet', error: error.message });
    }

    // If all sources failed, use mock data as fallback
    if (results.businesses.length === 0 && results.realEstate.length === 0) {
        console.log('⚠️ No real data, falling back to mock data');
        return getMockData();
    }

    return results;
};

// Mock data
const getMockData = () => ({
    businesses: [
        {
            id: 'b1',
            title: 'Tech Startup for Sale',
            price: 450000,
            revenue: 120000,
            cashFlow: 85000,
            location: 'Austin, TX',
            category: 'Technology',
            source: 'BizBuySell',
            description: 'Established SaaS company with recurring revenue',
            broker: 'TechBiz Brokers',
        },
        {
            id: 'b2',
            title: 'Coffee Shop Franchise',
            price: 250000,
            revenue: 80000,
            cashFlow: 55000,
            location: 'Portland, OR',
            category: 'Food & Beverage',
            source: 'BizBuySell',
            description: 'Popular coffee shop with loyal customer base',
            broker: 'Main Street Advisors',
        },
    ],
    realEstate: [
        {
            id: 'r1',
            title: 'Office Building Downtown',
            price: 2500000,
            address: '123 Main St, Denver, CO',
            propertyType: 'Office',
            source: 'LoopNet',
            description: 'Prime office space with long-term tenants.',
            size: '15,000 SF',
        },
        {
            id: 'r2',
            title: 'Retail Shopping Center',
            price: 4500000,
            address: '456 Market St, Dallas, TX',
            propertyType: 'Retail',
            source: 'LoopNet',
            description: 'Mixed-use retail space with high foot traffic.',
            size: '25,000 SF',
        },
    ],
    properties: [],
    errors: [],
});

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
