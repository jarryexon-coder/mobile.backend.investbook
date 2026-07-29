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
  
  // Comprehensive UK locations - ALL London boroughs and surrounding areas
  const ukLocations = [
    // London boroughs
    'barking', 'barnet', 'bexley', 'brent', 'bromley', 'camden', 'croydon', 
    'ealing', 'enfield', 'greenwich', 'hackney', 'hammersmith', 'haringey', 
    'harrow', 'havering', 'hillingdon', 'hounslow', 'islington', 'kensington', 
    'kingston', 'lambeth', 'lewisham', 'merton', 'newham', 'redbridge', 
    'richmond', 'southwark', 'sutton', 'tower hamlets', 'waltham forest', 
    'wandsworth', 'westminster',
    
    // London areas and neighborhoods
    'acton', 'balham', 'bayswater', 'belgravia', 'belvedere', 'bethnal green',
    'brixton', 'camberwell', 'canary wharf', 'chiselhurst', 'chiswick',
    'clapham', 'dalston', 'east ham', 'edgware', 'eltham', 'finchley',
    'fulham', 'golders green', 'greenford', 'hackney wick', 'hampton',
    'hampstead', 'hanwell', 'hayes', 'hendon', 'highbury', 'highgate',
    'holloway', 'homerton', 'hoxton', 'ilford', 'isle of dogs', 'kew',
    'kilburn', 'kingston upon thames', 'knightsbridge', 'ladbroke grove',
    'limehouse', 'maida vale', 'mayfair', 'mitcham', 'northolt', 'northwood',
    'notting hill', 'paddington', 'park royal', 'perivale', 'pimlico',
    'poplar', 'putney', 'richmond upon thames', 'romford', 'ruislip',
    'seven kings', 'shepherd\'s bush', 'southall', 'southgate', 'stepney',
    'stoke newington', 'stratford', 'surbiton', 'sydenham', 'teddington',
    'tottenham', 'tufnell park', 'twickenham', 'upminster', 'uxbridge',
    'victoria', 'walthamstow', 'wandsworth', 'west ham', 'whetstone',
    'whitechapel', 'willesden', 'wimbledon', 'woodford', 'woodford green',
    'wood green', 'woolwich',
    
    // Surrounding areas (Home Counties)
    'ashford', 'basingstoke', 'bracknell', 'brentwood', 'camberley',
    'chelmsford', 'cheshunt', 'dartford', 'egham', 'epsom', 'esher',
    'evesham', 'farnborough', 'guildford', 'hemel hempstead', 'hertford',
    'high wycombe', 'hoddesdon', 'leatherhead', 'maidenhead', 'marlow',
    'oxshott', 'reading', 'redhill', 'reigate', 'ricmansworth', 'slough',
    'staines', 'sunbury', 'walton', 'watford', 'weybridge', 'windsor',
    'woking', 'wokingham',
    
    // UK Cities
    'birmingham', 'bradford', 'bristol', 'coventry', 'derby', 'edinburgh',
    'glasgow', 'leeds', 'leicester', 'liverpool', 'london', 'manchester',
    'newcastle', 'nottingham', 'plymouth', 'portsmouth', 'sheffield',
    'southampton', 'stoke', 'sunderland', 'wolverhampton', 'york',
    
    // UK Regions/Counties
    'buckinghamshire', 'cambridgeshire', 'cheshire', 'cornwall', 'cumbria',
    'derbyshire', 'devon', 'dorset', 'durham', 'essex', 'gloucestershire',
    'hampshire', 'hertfordshire', 'kent', 'lancashire', 'leicestershire',
    'lincolnshire', 'norfolk', 'northamptonshire', 'northumberland',
    'nottinghamshire', 'oxfordshire', 'shropshire', 'somerset', 'staffordshire',
    'suffolk', 'surrey', 'sussex', 'warwickshire', 'wiltshire',
    'worcestershire', 'yorkshire'
  ];
  
  // UK country indicators
  const ukCountryIndicators = [
    'uk', 'gb', 'great britain', 'united kingdom', 'england', 'scotland',
    'wales', 'northern ireland', 'britain', 'british'
  ];
  
  const checkFields = [title, address, city, state, location, country];
  
  // Check for UK locations
  const isUK = ukLocations.some(locationName => 
    checkFields.some(field => field.includes(locationName))
  );
  
  // Check for UK country indicators
  const isUKCountry = ukCountryIndicators.some(indicator =>
    checkFields.some(field => field.includes(indicator))
  );
  
  // Check for US indicators to override
  const usIndicators = [
    'us', 'usa', 'united states',
    // US States
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'new york',
    'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west virginia', 'wisconsin', 'wyoming'
  ];
  
  const isUS = usIndicators.some(indicator =>
    checkFields.some(field => field.includes(indicator))
  );
  
  // If it's clearly US, return false
  if (isUS) return false;
  
  // Return true if UK indicators found
  return isUK || isUKCountry;
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
 * Sort listings: US with prices first, then US without prices
 */
export const sortListingsByPriority = (items) => {
  if (!items || !Array.isArray(items)) return [];
  
  return [...items].sort((a, b) => {
    const hasPriceA = isPriceDisclosed(a);
    const hasPriceB = isPriceDisclosed(b);
    
    if (hasPriceA && hasPriceB) {
      return (a.priceNumeric || a.price || 0) - (b.priceNumeric || b.price || 0);
    }
    if (hasPriceA) return -1;
    if (hasPriceB) return 1;
    
    return 0;
  });
};
