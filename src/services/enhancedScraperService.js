import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_APIFY_API_TOKEN } from '@env';

const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000;

// ===== DEBUG PRICE FORMATTING - LOG EVERYTHING =====
const formatPrice = (price) => {
  console.log('🔧 formatPrice called with:', price, 'type:', typeof price);
  
  if (!price || price === 0) {
    console.log('   ❌ Price is 0 or null, returning "Price Not Disclosed"');
    return 'Price Not Disclosed';
  }
  
  if (typeof price === 'string' && price.includes('$')) {
    console.log('   ✅ Already has $, returning as-is:', price);
    return price;
  }
  
  let numPrice = typeof price === 'string' ? parseFloat(price.replace(/[, $]/g, '')) : price;
  console.log('   📊 Parsed number:', numPrice);
  
  if (isNaN(numPrice) || numPrice === 0) {
    console.log('   ❌ Invalid number, returning "Price Not Disclosed"');
    return 'Price Not Disclosed';
  }
  
  const formatted = `$${Math.round(numPrice).toLocaleString('en-US')}`;
  console.log('   ✅ Formatted:', formatted);
  return formatted;
};

const parsePrice = (priceString) => {
  console.log('🔧 parsePrice called with:', priceString);
  
  if (!priceString) {
    console.log('   ❌ Empty string, returning 0');
    return 0;
  }
  if (typeof priceString === 'number') {
    console.log('   ✅ Already a number:', priceString);
    return priceString;
  }
  
  if (typeof priceString === 'string') {
    let cleaned = priceString.replace(/[$€£,]/g, '').trim();
    console.log('   🧹 Cleaned:', cleaned);
    
    if (cleaned.toLowerCase().includes('k')) {
      const num = parseFloat(cleaned.toLowerCase().replace('k', '').trim());
      const result = isNaN(num) ? 0 : num * 1000;
      console.log('   📊 K format, result:', result);
      return result;
    }
    
    if (cleaned.toLowerCase().includes('m')) {
      const num = parseFloat(cleaned.toLowerCase().replace('m', '').trim());
      const result = isNaN(num) ? 0 : num * 1000000;
      console.log('   📊 M format, result:', result);
      return result;
    }
    
    const num = parseFloat(cleaned);
    const result = isNaN(num) ? 0 : num;
    console.log('   📊 Plain number, result:', result);
    return result;
  }
  
  console.log('   ❌ Unknown type, returning 0');
  return 0;
};

// Get cached listings
const getFixedListings = async () => {
  try {
    console.log('📂 Getting cached listings...');
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('⚠️ No cached listings found');
      return null;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Found ${listings.length} listings in cache`);
    
    // Check first listing price
    if (listings.length > 0) {
      const first = listings[0];
      console.log('🔍 First listing price check:', {
        title: first.title,
        price: first.price,
        priceDisplay: first.priceDisplay,
        priceNumeric: first.priceNumeric,
      });
    }
    
    return listings;
  } catch (error) {
    console.error('❌ Error getting fixed listings:', error);
    return null;
  }
};

// Find under $200k from cached listings
export const findUnder200kFromListings = async () => {
  try {
    console.log('🔍 Starting findUnder200kFromListings...');
    const listings = await getFixedListings();
    if (!listings || listings.length === 0) {
      console.log('⚠️ No listings found');
      return null;
    }
    
    console.log(`📊 Checking ${listings.length} listings for under $200k...`);
    
    const under200k = listings.filter(item => {
      let price = 0;
      
      // Try different price fields
      if (item.priceNumeric) {
        price = typeof item.priceNumeric === 'number' ? item.priceNumeric : parsePrice(item.priceNumeric);
        console.log(`   💰 ${item.title}: priceNumeric = ${price}`);
      } else if (item.price && typeof item.price === 'number') {
        price = item.price;
        console.log(`   💰 ${item.title}: price (number) = ${price}`);
      } else if (item.price && typeof item.price === 'string') {
        price = parsePrice(item.price);
        console.log(`   💰 ${item.title}: price (string) = ${price}`);
      } else if (item.priceDisplay) {
        price = parsePrice(item.priceDisplay);
        console.log(`   💰 ${item.title}: priceDisplay = ${price}`);
      }
      
      // Check propertyFacts
      if (price === 0 && item.propertyFacts) {
        const facts = item.propertyFacts;
        if (facts.Price) {
          price = parsePrice(facts.Price);
          console.log(`   💰 ${item.title}: propertyFacts.Price = ${price}`);
        } else if (facts.price) {
          price = parsePrice(facts.price);
          console.log(`   💰 ${item.title}: propertyFacts.price = ${price}`);
        }
      }
      
      const isUnder = price > 0 && price <= 200000;
      if (isUnder) {
        console.log(`   ✅ ${item.title} is under $200k: $${price}`);
      }
      return isUnder;
    });
    
    console.log(`💰 Found ${under200k.length} listings under $200k`);
    
    // Map to consistent format
    const mappedListings = under200k.map(item => {
      let price = 0;
      
      if (item.priceNumeric) {
        price = typeof item.priceNumeric === 'number' ? item.priceNumeric : parsePrice(item.priceNumeric);
      } else if (item.price && typeof item.price === 'number') {
        price = item.price;
      } else if (item.price && typeof item.price === 'string') {
        price = parsePrice(item.price);
      } else if (item.priceDisplay) {
        price = parsePrice(item.priceDisplay);
      }
      
      if (price === 0 && item.propertyFacts) {
        const facts = item.propertyFacts;
        if (facts.Price) price = parsePrice(facts.Price);
        else if (facts.price) price = parsePrice(facts.price);
      }
      
      const result = {
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
      
      console.log(`   📦 Mapped ${item.title}: priceDisplay = ${result.priceDisplay}`);
      return result;
    });
    
    // Debug: Check first mapped listing
    if (mappedListings.length > 0) {
      console.log('🔍 First mapped listing:', {
        title: mappedListings[0].title,
        price: mappedListings[0].price,
        priceDisplay: mappedListings[0].priceDisplay,
      });
    }
    
    return mappedListings;
  } catch (error) {
    console.error('❌ Error finding under $200k listings:', error);
    return null;
  }
};

// Sample businesses
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
  // ... (other businesses)
];

// Get under 200k listings
export const getUnder200kListings = async () => {
  console.log('🔄 getUnder200kListings called...');
  
  // Get from existing listings
  const fromListings = await findUnder200kFromListings();
  
  console.log('📊 fromListings result:', {
    count: fromListings?.length || 0,
    first: fromListings && fromListings.length > 0 ? {
      title: fromListings[0].title,
      priceDisplay: fromListings[0].priceDisplay,
    } : null,
  });
  
  if (fromListings && fromListings.length > 0) {
    console.log(`📦 Found ${fromListings.length} properties under $200k from your listings`);
    const result = {
      businesses: sampleBusinesses,
      properties: fromListings,
      total: fromListings.length + sampleBusinesses.length,
      timestamp: new Date().toISOString(),
    };
    console.log('📊 Final result:', {
      businesses: result.businesses.length,
      properties: result.properties.length,
      total: result.total,
      firstPropertyPrice: result.properties[0]?.priceDisplay,
    });
    return result;
  }
  
  console.log('⚠️ Using sample data');
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
