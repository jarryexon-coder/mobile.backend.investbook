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
    'parseforge~loopnet-scraper',
    'memo23~loopnet-scraper-ppe',
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

// Parse price from string with proper formatting
const parsePrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    
    // Remove currency symbols and commas
    let cleaned = priceString.replace(/[$€£,]/g, '').trim();
    
    // Handle "k" suffix (thousands)
    if (cleaned.toLowerCase().includes('k')) {
        cleaned = cleaned.toLowerCase().replace('k', '');
        const num = parseFloat(cleaned);
        return num * 1000; // Convert to full amount
    }
    
    // Handle "M" suffix (millions)
    if (cleaned.toLowerCase().includes('m')) {
        cleaned = cleaned.toLowerCase().replace('m', '');
        const num = parseFloat(cleaned);
        return num * 1000000; // Convert to full amount
    }
    
    // Handle comma-separated numbers
    const match = cleaned.match(/^([\d,.]+)/);
    if (match) {
        // Remove any remaining commas
        const numStr = match[1].replace(/,/g, '');
        return parseFloat(numStr) || 0;
    }
    
    return parseFloat(cleaned) || 0;
};

// Format price for display (adds commas and proper formatting)
export const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
    
    // If price is in thousands, convert to full number
    let fullPrice = price;
    
    // Format with commas
    const formatted = Number(fullPrice).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    
    return `$${formatted}`;
};

// Format price with K/M shorthand
export const formatPriceShort = (price) => {
    if (!price || price === 0) return 'N/A';
    
    if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
        return `$${(price / 1000).toFixed(1)}K`;
    } else {
        return `$${price}`;
    }
};

// BizBuySell Scraper with state support
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
        propertyType: 'all',
    };

    for (const actorId of BIZBUYSELL_ACTORS) {
        try {
            console.log(`🔍 Trying actor: ${actorId} with location: ${location || 'All States'}`);
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

// Mock business data with different states
const getMockBusinessData = (location = 'Various') => {
    const businesses = [
        {
            id: 'mock1',
            title: 'Tech Startup for Sale',
            price: 450000,
            revenue: 120000,
            cashFlow: 85000,
            location: 'Austin, TX',
            state: 'TX',
            category: 'Technology',
            source: 'Mock Data',
            description: 'Established SaaS company with recurring revenue.',
            broker: 'TechBiz Brokers',
            imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400',
        },
        {
            id: 'mock2',
            title: 'Coffee Shop Franchise',
            price: 250000,
            revenue: 80000,
            cashFlow: 55000,
            location: 'Portland, OR',
            state: 'OR',
            category: 'Food & Beverage',
            source: 'Mock Data',
            description: 'Popular coffee shop with loyal customer base.',
            broker: 'Main Street Advisors',
            imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        },
        {
            id: 'mock3',
            title: 'Construction Company',
            price: 680000,
            revenue: 200000,
            cashFlow: 120000,
            location: 'Denver, CO',
            state: 'CO',
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
            location: 'Miami, FL',
            state: 'FL',
            category: 'Retail',
            source: 'Mock Data',
            description: 'Thriving retail business with multiple locations.',
            broker: 'Retail Specialists Inc',
            imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        },
        {
            id: 'mock5',
            title: 'Digital Marketing Agency',
            price: 180000,
            revenue: 90000,
            cashFlow: 60000,
            location: 'New York, NY',
            state: 'NY',
            category: 'Marketing',
            source: 'Mock Data',
            description: 'Full-service digital marketing agency with 50+ active clients.',
            broker: 'Digital Business Brokers',
            imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        },
        {
            id: 'mock6',
            title: 'Restaurant Chain',
            price: 550000,
            revenue: 180000,
            cashFlow: 95000,
            location: 'Chicago, IL',
            state: 'IL',
            category: 'Food & Beverage',
            source: 'Mock Data',
            description: 'Popular restaurant chain with 3 locations.',
            broker: 'Food Service Advisors',
            imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        },
    ];
    
    // If location is specified, try to match it
    if (location && location !== 'Various') {
        const matching = businesses.filter(b => 
            b.location.toLowerCase().includes(location.toLowerCase()) ||
            b.state.toLowerCase().includes(location.toLowerCase())
        );
        return matching.length > 0 ? matching : businesses;
    }
    
    return businesses;
};

// Combined fetch function with nationwide support
export const fetchAllOpportunities = async (searchParams = {}) => {
    const {
        keyword = '',
        location = '',
        state = '',
        city = '',
        propertyType = 'office',
        limit = 50,
        searchType = 'For_Sale',
        nationwide = true, // New flag for nationwide search
    } = searchParams;

    const results = {
        businesses: [],
        realEstate: [],
        properties: [],
        errors: [],
    };

    // 1. Fetch BizBuySell using Apify actors with nationwide support
    try {
        console.log('🔍 Fetching BizBuySell data...');
        let searchLocation = location || city || '';
        let searchState = state || '';
        
        // If no location specified and nationwide is true, search broadly
        if (!searchLocation && !searchState && nationwide) {
            searchLocation = 'United States';
            console.log('📍 Searching nationwide for businesses');
        }
        
        const bizData = await scrapeBizBuySell(
            keyword, 
            searchLocation, 
            searchState, 
            Math.min(limit, 50)
        );
        
        if (bizData && bizData.length > 0) {
            results.businesses = bizData.map(item => ({
                id: item.listing_id || item.id || `biz-${Math.random()}`,
                title: item.title || item.name || 'Business for Sale',
                price: parsePrice(item.price || item.price_display),
                priceDisplay: formatPrice(parsePrice(item.price || item.price_display)),
                revenue: parsePrice(item.revenue || item.gross_revenue),
                cashFlow: parsePrice(item.cash_flow || item.net_income),
                location: item.location || item.city || item.state || 'N/A',
                city: item.city || '',
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
            console.log(`✅ BizBuySell: ${results.businesses.length} results from ${searchLocation || 'nationwide'}`);
        }
    } catch (error) {
        console.error('BizBuySell failed:', error.message);
        results.errors.push({ source: 'BizBuySell', error: error.message });
    }

    // 2. Fetch LoopNet via RapidAPI with nationwide support
    try {
        let searchLocation = location || city || state || '';
        
        // If no location specified, use a broad search
        if (!searchLocation && nationwide) {
            searchLocation = 'United States';
        }
        
        if (searchLocation) {
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
                    priceDisplay: formatPrice(parsePrice(item.price)),
                    address: item.address || '',
                    city: item.city || city || '',
                    state: item.state || state || '',
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
        } else {
            console.log('⚠️ No location specified, skipping LoopNet search');
        }
    } catch (error) {
        console.error('LoopNet failed:', error.message);
        results.errors.push({ source: 'LoopNet', error: error.message });
    }

    // If no results, add mock data with various states
    if (results.businesses.length === 0 && results.realEstate.length === 0) {
        console.log('⚠️ No data, using mock data with nationwide listings');
        results.businesses = getMockBusinessData(location || 'Various');
        results.realEstate = [
            {
                id: 'r1',
                title: 'Office Building Downtown',
                price: 2500000,
                priceDisplay: '$2,500,000',
                address: '123 Main St, Denver, CO',
                city: 'Denver',
                state: 'CO',
                propertyType: 'Office',
                source: 'Mock Data',
                description: 'Prime office space with long-term tenants.',
                size: '15,000 SF',
            },
            {
                id: 'r2',
                title: 'Retail Shopping Center',
                price: 4500000,
                priceDisplay: '$4,500,000',
                address: '456 Market St, Dallas, TX',
                city: 'Dallas',
                state: 'TX',
                propertyType: 'Retail',
                source: 'Mock Data',
                description: 'Mixed-use retail space with high foot traffic.',
                size: '25,000 SF',
            },
            {
                id: 'r3',
                title: 'Industrial Warehouse',
                price: 3200000,
                priceDisplay: '$3,200,000',
                address: '789 Industrial Blvd, Atlanta, GA',
                city: 'Atlanta',
                state: 'GA',
                propertyType: 'Industrial',
                source: 'Mock Data',
                description: 'Large warehouse with loading docks and office space.',
                size: '50,000 SF',
            },
        ];
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
