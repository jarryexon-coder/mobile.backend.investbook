import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchByLocation } from './rapidApiService';
import { EXPO_PUBLIC_APIFY_API_TOKEN, EXPO_PUBLIC_RAPIDAPI_KEY } from '@env';

// Use environment variables
const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;
const RAPIDAPI_KEY = EXPO_PUBLIC_RAPIDAPI_KEY;

console.log('🔑 APIFY Token loaded:', APIFY_API_TOKEN ? '✅ Yes' : '❌ No');
console.log('🔑 RAPIDAPI Key loaded:', RAPIDAPI_KEY ? '✅ Yes' : '❌ No');

// ✅ Working actors (verified with curl)
const BIZBUYSELL_ACTORS = [
    'parseforge~loopnet-scraper',      // LoopNet Business Listings Scraper
    'memo23~loopnet-scraper-ppe',      // LoopNet US + UK Commercial Property Scraper
];

// Helper to call Apify API
const callApifyActor = async (actorId, input) => {
    if (!APIFY_API_TOKEN) {
        console.warn('⚠️ APIFY_API_TOKEN not set');
        return [];
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
        const maxAttempts = 20;
        
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
                            limit: 100
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

// BizBuySell Scraper using working actors
export const scrapeBizBuySell = async (keyword = '', location = '', limit = 50) => {
    // Build search URL
    const baseUrl = 'https://www.bizbuysell.com/businesses-for-sale/';
    const searchParams = [];
    if (keyword) searchParams.push(`q=${encodeURIComponent(keyword)}`);
    if (location) searchParams.push(`location=${encodeURIComponent(location)}`);
    
    const url = searchParams.length > 0 ? `${baseUrl}?${searchParams.join('&')}` : baseUrl;
    
    // Input for the actor - matches what the actor expects
    const input = {
        startUrls: [{ url: url }],
        results_wanted: Math.min(limit, 50),
        max_pages: 2,
        // Additional options for the actors
        searchType: 'For_Sale',
        propertyType: 'all',
    };

    for (const actorId of BIZBUYSELL_ACTORS) {
        try {
            console.log(`🔍 Trying actor: ${actorId}`);
            const results = await callApifyActor(actorId, input);
            if (results && results.length > 0) {
                console.log(`✅ ${actorId} returned ${results.length} results`);
                return results;
            }
        } catch (error) {
            console.log(`❌ ${actorId} failed: ${error.message}`);
        }
    }
    
    console.log('⚠️ All actors failed, using mock data');
    return getMockBusinessData(location);
};

// Mock business data as fallback
const getMockBusinessData = (location = 'Washington, DC') => {
    return [
        {
            id: 'mock1',
            title: 'Tech Startup for Sale',
            price: 450000,
            revenue: 120000,
            cashFlow: 85000,
            location: location,
            category: 'Technology',
            source: 'Mock Data',
            description: 'Established SaaS company with recurring revenue. Growing customer base of 500+ clients.',
            broker: 'TechBiz Brokers',
            imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
        },
        {
            id: 'mock2',
            title: 'Coffee Shop Franchise',
            price: 250000,
            revenue: 80000,
            cashFlow: 55000,
            location: location,
            category: 'Food & Beverage',
            source: 'Mock Data',
            description: 'Popular coffee shop with loyal customer base. Prime location with high foot traffic.',
            broker: 'Main Street Advisors',
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        },
        {
            id: 'mock3',
            title: 'Construction Company',
            price: 680000,
            revenue: 200000,
            cashFlow: 120000,
            location: location,
            category: 'Construction',
            source: 'Mock Data',
            description: 'Established construction company with 10+ years of experience.',
            broker: 'Commercial Realty Group',
            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
        },
        {
            id: 'mock4',
            title: 'Retail Store Chain',
            price: 320000,
            revenue: 150000,
            cashFlow: 75000,
            location: location,
            category: 'Retail',
            source: 'Mock Data',
            description: 'Thriving retail business with multiple locations.',
            broker: 'Retail Specialists Inc',
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        },
    ];
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
        searchType = 'For_Sale',
    } = searchParams;

    const results = {
        businesses: [],
        realEstate: [],
        properties: [],
        errors: [],
    };

    // 1. Fetch BizBuySell using Apify actors
    try {
        console.log('🔍 Fetching BizBuySell data...');
        const bizData = await scrapeBizBuySell(keyword, location, Math.min(limit, 50));
        if (bizData && bizData.length > 0) {
            results.businesses = bizData.map(item => ({
                id: item.listing_id || item.id || `biz-${Math.random()}`,
                title: item.title || item.name || 'Business for Sale',
                price: item.price || item.price_display || 0,
                revenue: item.revenue || item.gross_revenue || 0,
                cashFlow: item.cash_flow || item.net_income || 0,
                location: item.location || item.city || item.state || 'N/A',
                state: item.state || '',
                category: item.category || item.listing_category || 'Business',
                source: item.source || 'BizBuySell',
                url: item.url || '',
                description: item.description || item.summary || '',
                broker: item.broker_name || item.broker || 'N/A',
                brokerPhone: item.contact_phone || '',
                imageUrl: item.image_url || item.photo || '',
                details: item,
            }));
            console.log(`✅ BizBuySell: ${results.businesses.length} results`);
        }
    } catch (error) {
        console.error('BizBuySell failed:', error.message);
        results.errors.push({ source: 'BizBuySell', error: error.message });
    }

    // 2. Fetch LoopNet via RapidAPI (your working API)
    try {
        const searchLocation = location || `${city}, ${state}`;
        console.log(`📍 Searching LoopNet in: ${searchLocation}`);
        
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
    } catch (error) {
        console.error('LoopNet failed:', error.message);
        results.errors.push({ source: 'LoopNet', error: error.message });
    }

    // If no real estate data, add mock data
    if (results.realEstate.length === 0) {
        console.log('⚠️ No real estate data, adding mock properties');
        results.realEstate = [
            {
                id: 'r1',
                title: 'Office Building Downtown',
                price: 2500000,
                address: '123 Main St, Denver, CO',
                propertyType: 'Office',
                source: 'Mock Data',
                description: 'Prime office space with long-term tenants.',
                size: '15,000 SF',
            },
            {
                id: 'r2',
                title: 'Retail Shopping Center',
                price: 4500000,
                address: '456 Market St, Dallas, TX',
                propertyType: 'Retail',
                source: 'Mock Data',
                description: 'Mixed-use retail space with high foot traffic.',
                size: '25,000 SF',
            },
        ];
    }

    // If no businesses, add mock businesses
    if (results.businesses.length === 0) {
        console.log('⚠️ No business data, adding mock businesses');
        results.businesses = getMockBusinessData(location);
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
