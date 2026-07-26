import React, { useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import { getPlaceholderImage, isImageBlocked } from '../utils/imageUtils';

const ImageWithFallback = ({ 
  deal, 
  style, 
  resizeMode = 'cover',
  onError,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const imageUrl = deal?.images?.[0] || deal?.photo || deal?.imageUrl;
  const placeholderUrl = getPlaceholderImage(deal);
  
  // If the image is from LoopNet, use placeholder immediately
  const shouldUsePlaceholder = !imageUrl || isImageBlocked(imageUrl) || error;
  
  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#f0f0f0' }]}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      <Image
        source={{ 
          uri: shouldUsePlaceholder ? placeholderUrl : imageUrl 
        }}
        style={[style, { width: '100%', height: '100%' }]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          setLoading(false);
          setError(true);
          if (onError) onError(e);
        }}
        {...props}
      />
    </View>
  );
};

export default ImageWithFallback;
