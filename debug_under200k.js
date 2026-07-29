import AsyncStorage from '@react-native-async-storage/async-storage';

const debugUnder200k = async () => {
  try {
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('No cached listings found');
      return;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Total listings: ${listings.length}`);
    
    // Check for UK listings
    const ukListings = listings.filter(item => {
      const city = (item.city || '').toLowerCase();
      const state = (item.state || '').toLowerCase();
      const country = (item.country || '').toLowerCase();
      
      return country === 'gb' || 
             country === 'uk' || 
             city.includes('london') ||
             city.includes('barking') ||
             state.includes('london') ||
             city.includes('enfield') ||
             city.includes('ilford') ||
             city.includes('staines');
    });
    
    console.log(`🇬🇧 UK listings: ${ukListings.length}`);
    
    // Check prices of UK listings
    const ukUnder200k = ukListings.filter(item => {
      const price = item.priceNumeric || item.price || 0;
      return price > 0 && price <= 200000;
    });
    
    console.log(`💰 UK listings under $200k: ${ukUnder200k.length}`);
    
    if (ukUnder200k.length > 0) {
      console.log('\n📝 Sample UK listings under $200k:');
      ukUnder200k.slice(0, 5).forEach(item => {
        console.log(`  - ${item.title || 'Untitled'} (${item.city}, ${item.state}) - $${item.priceNumeric || item.price}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

debugUnder200k();
