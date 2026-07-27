/**
 * Check if a listing is from the UK based on various fields
 */
export const isUKListing = (item) => {
  if (!item) return false;
  
  const title = (item.title || '').toLowerCase();
  const address = (item.address || '').toLowerCase();
  const city = (item.city || '').toLowerCase();
  const state = (item.state || '').toLowerCase();
  const country = (item.country || '').toLowerCase();
  const location = (item.location || '').toLowerCase();
  
  // UK indicators - only these make it UK
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
  
  // Check for UK indicators - if found, it's UK
  return ukIndicators.some(indicator => 
    checkFields.some(field => field.includes(indicator))
  );
};

/**
 * Check if price is disclosed
 */
export const isPriceDisclosed = (item) => {
  if (!item) return false;
  
  const priceStr = String(item.price || item.priceDisplay || '');
  const isUndisclosed = 
    priceStr.includes('Not Disclosed') ||
    priceStr.includes('Contact') ||
    priceStr.includes('Request') ||
    priceStr.includes('N/A') ||
    priceStr === '' ||
    priceStr === '0' ||
    priceStr === 'undefined' ||
    priceStr === 'null' ||
    priceStr === 'Price Not Disclosed';
  
  return !isUndisclosed && (item.priceNumeric > 0 || item.price > 0);
};

/**
 * Sort listings: US with prices first, then US without prices, then UK with prices, then UK without prices
 */
export const sortListingsByPriority = (items) => {
  if (!items || !Array.isArray(items)) return [];
  
  return [...items].sort((a, b) => {
    const hasPriceA = isPriceDisclosed(a);
    const hasPriceB = isPriceDisclosed(b);
    const isUKA = isUKListing(a);
    const isUKB = isUKListing(b);
    
    // Priority 1: Non-UK with prices (highest priority)
    if (!isUKA && hasPriceA && !isUKB && hasPriceB) {
      return (a.priceNumeric || a.price || 0) - (b.priceNumeric || b.price || 0);
    }
    if (!isUKA && hasPriceA) return -1;
    if (!isUKB && hasPriceB) return 1;
    
    // Priority 2: Non-UK without prices
    if (!isUKA && !hasPriceA && !isUKB && !hasPriceB) return 0;
    if (!isUKA && !hasPriceA) return -1;
    if (!isUKB && !hasPriceB) return 1;
    
    // Priority 3: UK with prices
    if (isUKA && hasPriceA && isUKB && hasPriceB) {
      return (a.priceNumeric || a.price || 0) - (b.priceNumeric || b.price || 0);
    }
    if (isUKA && hasPriceA) return -1;
    if (isUKB && hasPriceB) return 1;
    
    // Priority 4: UK without prices (lowest priority)
    if (isUKA && !hasPriceA && isUKB && !hasPriceB) return 0;
    if (isUKA && !hasPriceA) return 1;
    if (isUKB && !hasPriceB) return -1;
    
    return 0;
  });
};
