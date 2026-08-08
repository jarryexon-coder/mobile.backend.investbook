const API_BASE_URL = 'https://api.invest-book.com';

// Cache for image mapping
let imageMappingCache = null;
let mappingLoaded = false;

export const loadImageMapping = async () => {
  if (mappingLoaded) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/image-mapping`);
    if (response.ok) {
      imageMappingCache = await response.json();
      mappingLoaded = true;
      console.log('✅ Image mapping loaded:', Object.keys(imageMappingCache).length, 'entries');
    }
  } catch (error) {
    console.error('❌ Error loading image mapping:', error);
  }
};

export const getImageUrl = (deal) => {
  if (!deal) return getPlaceholderImage({});
  
  // Priority 1: Check the mapping
  const dealId = deal.id || deal.propertyId || deal.listing_id;
  if (dealId && imageMappingCache && imageMappingCache[String(dealId)]) {
    const imagePath = imageMappingCache[String(dealId)];
    console.log(`📸 Found image for deal ${dealId}: ${imagePath}`);
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // Priority 2: Try direct image URL
  if (deal.imageUrl) {
    return deal.imageUrl;
  }
  if (deal.images && deal.images.length > 0) {
    return deal.images[0];
  }
  
  // Fallback to placeholder
  return getPlaceholderImage(deal);
};

export const getSafeImageUrl = (deal) => {
  const url = getImageUrl(deal);
  return url || getPlaceholderImage(deal);
};

export const getPlaceholderImage = (deal) => {
  const propertyType = (deal?.propertyType || '').toLowerCase();
  
  const images = {
    'industrial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    'office': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=300&fit=crop',
    'retail': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    'residential': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    'land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
  };
  
  for (const [key, url] of Object.entries(images)) {
    if (propertyType.includes(key)) {
      return url;
    }
  }
  
  return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop';
};

export const isImageBlocked = (url) => {
  if (!url) return true;
  const blockedDomains = ['loopnet.com', 'images1.loopnet.com'];
  return blockedDomains.some(domain => url.includes(domain));
};

// Initialize on app start
export const initImageUtils = async () => {
  await loadImageMapping();
};

export default {
  getImageUrl,
  getSafeImageUrl,
  getPlaceholderImage,
  isImageBlocked,
  loadImageMapping,
  initImageUtils,
};
