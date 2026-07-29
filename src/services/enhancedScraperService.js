import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_APIFY_API_TOKEN } from '@env';
import { isUKListing } from '../utils/listingUtils';

const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Parse price from string
const parsePrice = (priceString) => {
  if (!priceString) return 0;
  if (typeof priceString === 'number') return priceString;
  
  if (typeof priceString === 'string') {
    let cleaned = priceString.replace(/[$€£,]/g, '').trim();
    if (cleaned.toLowerCase().includes('k')) {
      const num = parseFloat(cleaned.toLowerCase().replace('k', '').trim());
      return isNaN(num) ? 0 : num * 1000;
    }
    if (cleaned.toLowerCase().includes('m')) {
      const num = parseFloat(cleaned.toLowerCase().replace('m', '').trim());
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

// Find under $200k from cached listings - FILTER OUT UK
export const findUnder200kFromListings = async () => {
  try {
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('⚠️ No cached listings found');
      return null;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Checking ${listings.length} listings for under $200k...`);
    
    let ukFilteredCount = 0;
    const under200k = listings.filter(item => {
      let price = 0;
      
      if (item.price && typeof item.price === 'number') {
        price = item.price;
      } else if (item.price && typeof item.price === 'string') {
        price = parsePrice(item.price);
      } else if (item.priceNumeric) {
        price = parsePrice(item.priceNumeric);
      } else if (item.priceDisplay) {
        price = parsePrice(item.priceDisplay);
      } else if (item.formattedPrice) {
        price = parsePrice(item.formattedPrice);
      }
      
      if (price === 0 && item.propertyFacts) {
        const facts = item.propertyFacts;
        if (facts.Price) price = parsePrice(facts.Price);
        else if (facts.price) price = parsePrice(facts.price);
        else if (facts.askingPrice) price = parsePrice(facts.askingPrice);
      }
      
      // Check if it's under $200k AND NOT a UK listing
      const isUnder = price > 0 && price <= 200000;
      const isUK = isUKListing(item);
      
      if (isUK) {
        ukFilteredCount++;
        console.log(`🇬🇧 Filtered out UK: ${item.title || 'Untitled'} (${item.city || '?'}, ${item.state || '?'})`);
      }
      
      return isUnder && !isUK;
    });
    
    console.log(`💰 Found ${under200k.length} US listings under $200k (filtered out ${ukFilteredCount} UK listings)`);
    
    // Map to consistent format
    const mappedListings = under200k.map(item => {
      let price = 0;
      
      if (item.price && typeof item.price === 'number') {
        price = item.price;
      } else if (item.price && typeof item.price === 'string') {
        price = parsePrice(item.price);
      } else if (item.priceNumeric) {
        price = parsePrice(item.priceNumeric);
      } else if (item.priceDisplay) {
        price = parsePrice(item.priceDisplay);
      }
      
      if (price === 0 && item.propertyFacts) {
        const facts = item.propertyFacts;
        if (facts.Price) price = parsePrice(facts.Price);
        else if (facts.price) price = parsePrice(facts.price);
      }
      
      return {
        id: item.id || item.propertyId || `prop-${Math.random().toString(36).substr(2, 9)}`,
        title: item.title || item.name || item.address || 'Property for Sale',
        price: price,
        priceDisplay: formatPrice(price),
        priceNumeric: price,
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        location: [item.city, item.state].filter(Boolean).join(', ') || 'Location available',
        propertyType: item.propertyType || 'Commercial',
        source: item.source || 'LoopNet',
        url: item.url || item.listingUrl || '',
        description: item.description || '',
        imageUrl: item.imageUrl || item.image || item.photo || item.images?.[0] || '',
        size: item.size || item.lotSize || item.squareFeet || '',
        broker: item.broker || item.brokerName || '',
        yearBuilt: item.yearBuilt || '',
        lotSize: item.lotSize || '',
        type: 'property',
        isUnder200k: true,
        priceRange: 'under200k',
        details: item,
        hasValidId: true,
      };
    });
    
    return mappedListings;
  } catch (error) {
    console.error('❌ Error finding under $200k listings:', error);
    return null;
  }
};

// Sample businesses (US only)
const sampleBusinesses = [
  {
    id: 'biz-1',
    title: 'Coffee Shop - Prime Location',
    price: 85000,
    priceDisplay: '$85,000',
    priceNumeric: 85000,
    category: 'Food & Beverage',
    cashFlow: 45000,
    revenue: 120000,
    location: 'Austin, TX',
    city: 'Austin',
    state: 'TX',
    source: 'BizBuySell',
    description: 'Established coffee shop with loyal customer base',
    broker: 'John Smith',
    type: 'business',
    isUnder200k: true,
    priceRange: 'under200k',
    employees: '3',
    yearEstablished: '2018',
  },
  {
    id: 'biz-2',
    title: 'Laundromat - 5 Year Business',
    price: 120000,
    priceDisplay: '$120,000',
    priceNumeric: 120000,
    category: 'Retail',
    cashFlow: 52000,
    revenue: 98000,
    location: 'Phoenix, AZ',
    city: 'Phoenix',
    state: 'AZ',
    source: 'BizBuySell',
    description: 'Profitable laundromat with equipment included',
    broker: 'Sarah Johnson',
    type: 'business',
    isUnder200k: true,
    priceRange: 'under200k',
    employees: '2',
    yearEstablished: '2019',
  },
  {
    id: 'biz-3',
    title: 'Mobile Food Truck Business',
    price: 65000,
    priceDisplay: '$65,000',
    priceNumeric: 65000,
    category: 'Food & Beverage',
    cashFlow: 38000,
    revenue: 85000,
    location: 'Portland, OR',
    city: 'Portland',
    state: 'OR',
    source: 'BizBuySell',
    description: 'Fully equipped food truck with established route',
    broker: 'Mike Davis',
    type: 'business',
    isUnder200k: true,
    priceRange: 'under200k',
    employees: '2',
    yearEstablished: '2020',
  },
  {
    id: 'biz-4',
    title: 'Cleaning Service Franchise',
    price: 95000,
    priceDisplay: '$95,000',
    priceNumeric: 95000,
    category: 'Services',
    cashFlow: 42000,
    revenue: 110000,
    location: 'Denver, CO',
    city: 'Denver',
    state: 'CO',
    source: 'BizBuySell',
    description: 'Commercial cleaning business with contracts',
    broker: 'Lisa Wong',
    type: 'business',
    isUnder200k: true,
    priceRange: 'under200k',
    employees: '5',
    yearEstablished: '2017',
  },
  {
    id: 'biz-5',
    title: 'Small Retail Store',
    price: 75000,
    priceDisplay: '$75,000',
    priceNumeric: 75000,
    category: 'Retail',
    cashFlow: 35000,
    revenue: 95000,
    location: 'Miami, FL',
    city: 'Miami',
    state: 'FL',
    source: 'BizBuySell',
    description: 'Boutique retail store in shopping center',
    broker: 'Carlos Rodriguez',
    type: 'business',
    isUnder200k: true,
    priceRange: 'under200k',
    employees: '2',
    yearEstablished: '2019',
  },
];

// Get under 200k listings (US only)
export const getUnder200kListings = async () => {
  console.log('🔄 getUnder200kListings called...');
  
  // Get from existing listings (filtered for US)
  const fromListings = await findUnder200kFromListings();
  
  if (fromListings && fromListings.length > 0) {
    console.log(`📦 Found ${fromListings.length} US properties under $200k`);
    const result = {
      businesses: sampleBusinesses,
      properties: fromListings,
      total: fromListings.length + sampleBusinesses.length,
      timestamp: new Date().toISOString(),
    };
    return result;
  }
  
  console.log('⚠️ Using sample data (US only)');
  return {
    businesses: sampleBusinesses,
    properties: [],
    total: sampleBusinesses.length,
    timestamp: new Date().toISOString(),
  };
};

export default {
  getUnder200kListings,
  findUnder200kFromListings,
  formatPrice,
  parsePrice,
};
