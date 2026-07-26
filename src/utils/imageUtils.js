// Image utility functions with property-type specific placeholders

// Property type specific images (using Unsplash)
const PROPERTY_IMAGES = {
  'industrial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  'warehouse': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  'office': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
  'commercial': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop',
  'retail': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
  'residential': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
  'land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  'lot': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
  'business': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  'property': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
};

// Default fallback
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop';

export const getPlaceholderImage = (deal) => {
  if (!deal) return DEFAULT_IMAGE;
  
  // Check property type
  const propertyType = (deal.propertyType || deal.category || '').toLowerCase();
  const subtype = (deal.propertySubtype || '').toLowerCase();
  
  // Try to match with our image map
  for (const [key, url] of Object.entries(PROPERTY_IMAGES)) {
    if (propertyType.includes(key) || subtype.includes(key)) {
      return url;
    }
  }
  
  // Check title for clues
  const title = (deal.title || deal.name || '').toLowerCase();
  for (const [key, url] of Object.entries(PROPERTY_IMAGES)) {
    if (title.includes(key)) {
      return url;
    }
  }
  
  // Check if it's a business
  if (deal.category || deal.cashFlow || deal.revenue) {
    return PROPERTY_IMAGES.business;
  }
  
  return DEFAULT_IMAGE;
};

export const isImageBlocked = (url) => {
  if (!url) return true;
  const blockedDomains = ['loopnet.com', 'images1.loopnet.com', 'images2.loopnet.com', 'images3.loopnet.com'];
  return blockedDomains.some(domain => url.includes(domain));
};

export const getImageUrl = (deal) => {
  if (!deal) return getPlaceholderImage({});
  
  // Check all possible image fields
  let originalUrl = null;
  
  if (deal.images && Array.isArray(deal.images) && deal.images.length > 0) {
    const firstImage = deal.images[0];
    if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
      originalUrl = firstImage;
    } else if (typeof firstImage === 'object' && firstImage.url) {
      originalUrl = firstImage.url;
    }
  }
  
  if (!originalUrl && deal.imageUrl) originalUrl = deal.imageUrl;
  if (!originalUrl && deal.image) originalUrl = deal.image;
  if (!originalUrl && deal.photo) originalUrl = deal.photo;
  
  // If we have a URL and it's not a placeholder
  if (originalUrl && !originalUrl.includes('unsplash.com')) {
    // Return the URL directly (no proxy, it was failing anyway)
    return originalUrl;
  }
  
  // No image found, return placeholder
  return getPlaceholderImage(deal);
};

export const getSafeImageUrl = (deal) => {
  const url = getImageUrl(deal);
  return url || getPlaceholderImage(deal);
};

export const getGalleryImages = (deal, maxCount = 5) => {
  if (!deal) return [getPlaceholderImage({})];
  
  const images = [];
  
  // Try images array
  if (deal.images && Array.isArray(deal.images)) {
    for (const img of deal.images) {
      if (typeof img === 'string' && img.startsWith('http') && !img.includes('unsplash.com')) {
        images.push(img);
      }
      if (images.length >= maxCount) break;
    }
  }
  
  // Add main image
  if (images.length === 0) {
    const mainImage = getImageUrl(deal);
    if (mainImage && !mainImage.includes('unsplash.com')) {
      images.push(mainImage);
    }
  }
  
  // Fill with property-type specific placeholders
  while (images.length < Math.min(maxCount, 4)) {
    images.push(getPlaceholderImage(deal));
  }
  
  return images;
};

export default {
  getImageUrl,
  getSafeImageUrl,
  getPlaceholderImage,
  getGalleryImages,
  isImageBlocked,
};
