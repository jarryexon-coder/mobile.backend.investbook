import AsyncStorage from '@react-native-async-storage/async-storage';

const debugUKDetection = async () => {
  try {
    const cached = await AsyncStorage.getItem('listings_cache');
    if (!cached) {
      console.log('No cached listings found');
      return;
    }
    
    const listings = JSON.parse(cached);
    console.log(`📊 Total listings: ${listings.length}`);
    
    // Get first 50 listings and check UK detection
    const sample = listings.slice(0, 50);
    let ukCount = 0;
    
    console.log('\n📝 Checking first 50 listings:');
    console.log('================================');
    
    sample.forEach((item, i) => {
      const title = (item.title || '').toLowerCase();
      const address = (item.address || '').toLowerCase();
      const city = (item.city || '').toLowerCase();
      const state = (item.state || '').toLowerCase();
      const country = (item.country || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      
      // Check UK indicators
      const ukIndicators = [
        'uk', 'gb', 'united kingdom', 'england', 'scotland', 'wales',
        'northern ireland', 'britain', 'london', 'manchester',
        'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'liverpool',
        'barking', 'enfield', 'staines', 'ilford', 'woodford green', 'harrow',
        'ashford', 'twickenham', 'croydon', 'sutton', 'bromley', 'watford',
        'luton', 'reading', 'slough', 'windsor', 'wembley', 'ealing',
        'acton', 'richmond', 'kingston', 'wimbledon'
      ];
      
      const checkFields = [title, address, city, state, location, country];
      const isUK = ukIndicators.some(indicator => 
        checkFields.some(field => field.includes(indicator))
      );
      
      if (isUK) {
        ukCount++;
        console.log(`  ${i}: ${item.title || 'Untitled'}`);
        console.log(`     City: ${item.city || '?'}, State: ${item.state || '?'}, Country: ${item.country || '?'}`);
        console.log(`     Detected as UK`);
        console.log('');
      }
    });
    
    console.log(`📊 Total UK in first 50: ${ukCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

debugUKDetection();
