// Smart Price Formatter - Handles inconsistent price formats

/**
 * Detect if a price should be multiplied by 1000 based on patterns
 */
const detectPriceMultiplier = (price, context = {}) => {
  // If price is already large (> 1000), don't multiply
  if (price > 1000) return 1;
  
  // If price has decimals, check the pattern
  if (price % 1 !== 0) {
    // Prices like 7.05, 10.79 are likely in thousands
    // But 1.2M would be 1.2 (which is millions, not thousands)
    if (price < 100) {
      return 1000; // 7.05 → 7,050
    }
    return 1;
  }
  
  // For whole numbers (6, 10, 15)
  if (price < 100) {
    // Check if it's likely a price per square foot or per acre
    if (context.title && context.title.toLowerCase().includes('sq')) {
      return 1; // Price per sq ft
    }
    if (context.title && context.title.toLowerCase().includes('acre')) {
      return 1; // Price per acre
    }
    // For commercial properties, whole numbers under 100 are likely thousands
    return 1000; // 6 → 6,000
  }
  
  // Default: no multiplier
  return 1;
};

/**
 * Format price with smart detection
 */
export const smartFormatPrice = (price, context = {}) => {
  if (!price || price === 0) return 'Price Not Disclosed';
  
  // If it's already a reasonable commercial price
  if (price > 100000) {
    return `$${Math.round(price).toLocaleString('en-US')}`;
  }
  
  // If price is between 100 and 1000, keep as-is (likely actual dollars)
  if (price >= 100 && price <= 1000) {
    return `$${Math.round(price).toLocaleString('en-US')}`;
  }
  
  // For prices under 100, detect if they should be multiplied
  if (price < 100) {
    const multiplier = detectPriceMultiplier(price, context);
    if (multiplier > 1) {
      const adjusted = Math.round(price * multiplier);
      // If adjusted is a reasonable price (not too high for under $200k)
      if (adjusted <= 200000) {
        return `$${adjusted.toLocaleString('en-US')}`;
      }
    }
    // If multiplier would make it too high, keep as-is
    return `$${price.toFixed(2)}`;
  }
  
  // Default formatting
  return `$${Math.round(price).toLocaleString('en-US')}`;
};

/**
 * Format price for display with context
 */
export const formatPriceSmart = (item) => {
  if (!item) return 'Price Not Disclosed';
  
  // Try to get numeric price from various fields
  let price = 0;
  let source = 'unknown';
  
  if (item.priceNumeric && typeof item.priceNumeric === 'number') {
    price = item.priceNumeric;
    source = 'priceNumeric';
  } else if (item.price && typeof item.price === 'number') {
    price = item.price;
    source = 'price';
  } else if (item.price && typeof item.price === 'string') {
    // Try to parse string price
    const cleaned = item.price.replace(/[$€£,]/g, '').trim();
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      price = num;
      source = 'priceString';
    }
  } else if (item.priceDisplay && typeof item.priceDisplay === 'string') {
    // Try to extract from priceDisplay
    const cleaned = item.priceDisplay.replace(/[$€£,]/g, '').trim();
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      price = num;
      source = 'priceDisplay';
    }
  }
  
  // If no price found, return fallback
  if (price === 0) {
    if (item.priceDisplay && item.priceDisplay !== 'Price Not Disclosed') {
      return item.priceDisplay;
    }
    return 'Price Not Disclosed';
  }
  
  // Build context for smart formatting
  const context = {
    propertyType: item.propertyType || item.category || '',
    title: item.title || item.name || '',
    source: item.source || '',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
  };
  
  // Debug log
  console.log(`🔍 Price detection: ${item.title?.substring(0, 20)} → ${price} (${source}) → ${smartFormatPrice(price, context)}`);
  
  return smartFormatPrice(price, context);
};

export const formatPrice = (price) => {
  if (!price || price === 0) return 'Price Not Disclosed';
  return `$${Math.round(price).toLocaleString('en-US')}`;
};

export default {
  smartFormatPrice,
  formatPriceSmart,
  formatPrice,
};
