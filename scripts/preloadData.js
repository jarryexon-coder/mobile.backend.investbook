import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';

// This script preloads your listings into AsyncStorage
const preloadListings = async () => {
  try {
    // Read the JSON file
    const data = fs.readFileSync('../backend/listings_1063.json', 'utf8');
    const listings = JSON.parse(data);
    
    // Format the data
    const formatted = listings.map(item => ({
      id: item.propertyId || item.id || Math.random().toString(),
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
      broker: item.brokerName || item.broker || '',
      brokerCompany: item.brokerCompany || '',
      brokerPhone: item.brokerPhone || '',
      brokerEmail: item.brokerEmail || '',
      url: item.listingUrl || item.url || '',
      source: 'LoopNet',
      propertyFacts: item.propertyFacts || {},
      cashFlow: item.cashFlow || '',
      revenue: item.revenue || '',
      yearBuilt: item.yearBuilt || '',
      lotSize: item.lotSize || '',
    }));
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('listings_cache', JSON.stringify(formatted));
    console.log(`✅ Preloaded ${formatted.length} listings into cache`);
  } catch (error) {
    console.error('Preload error:', error);
  }
};

export default preloadListings;
