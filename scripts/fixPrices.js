const AsyncStorage = require('@react-native-async-storage/async-storage');

// Format price correctly
const formatPrice = (price) => {
  if (!price || price === 0) return 'Price Not Disclosed';
  if (typeof price === 'string' && price.includes('$')) return price;
  
  let numPrice = typeof price === 'string' ? parseFloat(price.replace(/[, $]/g, '')) : price;
  if (isNaN(numPrice) || numPrice === 0) return 'Price Not Disclosed';
  return `$${Math.round(numPrice).toLocaleString('en-US')}`;
};

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

const fixListings = async () => {
  try {
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('No cached listings found');
      return;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Processing ${listings.length} listings...`);
    
    let fixedCount = 0;
    
    const fixedListings = listings.map(item => {
      // Parse the actual price from any available field
      let price = 0;
      
      // Check all possible price fields
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
      
      // Check propertyFacts
      if (price === 0 && item.propertyFacts) {
        const facts = item.propertyFacts;
        if (facts.Price) price = parsePrice(facts.Price);
        else if (facts.price) price = parsePrice(facts.price);
        else if (facts.askingPrice) price = parsePrice(facts.askingPrice);
      }
      
      // If we found a valid price, update the item
      if (price > 0) {
        const newPriceDisplay = formatPrice(price);
        if (item.priceDisplay !== newPriceDisplay) {
          fixedCount++;
          console.log(`   🔧 Fixed: ${item.title || 'Untitled'} - ${item.priceDisplay || 'N/A'} → ${newPriceDisplay}`);
          return {
            ...item,
            price: price,
            priceNumeric: price,
            priceDisplay: newPriceDisplay,
          };
        }
      }
      return item;
    });
    
    console.log(`\n✅ Fixed ${fixedCount} listings with incorrect price formatting`);
    console.log(`💾 Saving ${fixedListings.length} listings to cache...`);
    
    await AsyncStorage.setItem('listings_cache', JSON.stringify(fixedListings));
    console.log('✅ Cache updated successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing prices:', error);
  }
};

fixListings();
