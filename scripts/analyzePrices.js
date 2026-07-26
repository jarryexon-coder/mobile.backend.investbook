const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const analyzePrices = async () => {
  try {
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('No cached listings found');
      return;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Analyzing ${listings.length} listings...`);
    
    let total = 0;
    let withPrice = 0;
    let withPriceDisplay = 0;
    let withPriceNumeric = 0;
    let noPrice = 0;
    let priceNotDisclosed = 0;
    
    const priceExamples = [];
    
    listings.forEach((item, index) => {
      total++;
      
      const hasPrice = item.price && item.price !== 'Contact for price' && item.price !== 'Price Not Disclosed';
      const hasPriceDisplay = item.priceDisplay && item.priceDisplay !== 'Contact for price' && item.priceDisplay !== 'Price Not Disclosed';
      const hasPriceNumeric = item.priceNumeric && item.priceNumeric > 0;
      
      if (hasPrice) withPrice++;
      if (hasPriceDisplay) withPriceDisplay++;
      if (hasPriceNumeric) withPriceNumeric++;
      
      if (!hasPrice && !hasPriceDisplay && !hasPriceNumeric) {
        noPrice++;
      }
      
      // Check for "Price Not Disclosed" text
      const priceStr = String(item.price || item.priceDisplay || '');
      if (priceStr.includes('Not Disclosed') || 
          priceStr.includes('Contact') || 
          priceStr.includes('Request') ||
          priceStr === '' ||
          priceStr === '0') {
        priceNotDisclosed++;
      }
      
      // Collect examples
      if (priceExamples.length < 10) {
        if (hasPrice || hasPriceDisplay || hasPriceNumeric) {
          priceExamples.push({
            index,
            title: item.title?.substring(0, 30),
            price: item.price,
            priceDisplay: item.priceDisplay,
            priceNumeric: item.priceNumeric,
          });
        }
      }
    });
    
    console.log('\n📊 Price Analysis:');
    console.log(`   Total listings: ${total}`);
    console.log(`   With price field: ${withPrice} (${(withPrice/total*100).toFixed(1)}%)`);
    console.log(`   With priceDisplay: ${withPriceDisplay} (${(withPriceDisplay/total*100).toFixed(1)}%)`);
    console.log(`   With priceNumeric: ${withPriceNumeric} (${(withPriceNumeric/total*100).toFixed(1)}%)`);
    console.log(`   No price data: ${noPrice} (${(noPrice/total*100).toFixed(1)}%)`);
    console.log(`   "Price Not Disclosed": ${priceNotDisclosed} (${(priceNotDisclosed/total*100).toFixed(1)}%)`);
    
    console.log('\n📝 Sample listings with prices:');
    priceExamples.forEach(ex => {
      console.log(`   ${ex.index}: ${ex.title}`);
      console.log(`      price: ${ex.price}, priceDisplay: ${ex.priceDisplay}, priceNumeric: ${ex.priceNumeric}`);
    });
    
    // Check if prices are in correct format
    console.log('\n🔍 Checking price formats...');
    let formatIssues = 0;
    listings.forEach(item => {
      if (item.priceNumeric && item.priceNumeric > 0 && item.priceNumeric < 100) {
        formatIssues++;
        if (formatIssues <= 5) {
          console.log(`   ⚠️ Small price: ${item.title?.substring(0, 30)} → ${item.priceNumeric}`);
        }
      }
    });
    if (formatIssues > 0) {
      console.log(`   ⚠️ Found ${formatIssues} listings with prices under 100 (likely should be in thousands)`);
    }
    
  } catch (error) {
    console.error('Error analyzing prices:', error);
  }
};

analyzePrices();
