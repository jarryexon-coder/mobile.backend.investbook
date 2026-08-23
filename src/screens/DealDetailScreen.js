import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { getSafeImageUrl, getPlaceholderImage, isImageBlocked, initImageUtils } from '../utils/imageUtils';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');

// DetailRow component
const DetailRow = ({ label, value }) => {
  if (!label) return null;
  if (value === null || value === undefined) return null;
  
  let displayValue = '';
  try {
    displayValue = String(value);
  } catch {
    return null;
  }
  
  if (!displayValue || displayValue === '' || 
      displayValue === 'undefined' || displayValue === 'null' ||
      displayValue === '{}' || displayValue === '[]') {
    return null;
  }
  
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={3}>{displayValue}</Text>
    </View>
  );
};

// ImageWithFallback component - FIXED: only shows overlay when NO real image
const ImageWithFallback = ({ deal, style, resizeMode = 'cover' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get the image URL
  const imageUrl = getSafeImageUrl(deal);
  const placeholderUrl = getPlaceholderImage(deal);
  
  // Check if we have a REAL image (not a placeholder)
  const hasRealImage = imageUrl && 
                       !imageUrl.includes('unsplash.com') && 
                       !imageUrl.includes('placehold') &&
                       !imageError;
  
  // Only use placeholder if NO real image
  const usePlaceholder = !hasRealImage;
  const sourceUrl = usePlaceholder ? placeholderUrl : imageUrl;

  // Debug log
  console.log(`🖼️ Image: ${hasRealImage ? 'REAL' : 'PLACEHOLDER'} - ${sourceUrl?.substring(0, 50)}...`);

  return (
    <View style={[styles.imageContainer, style]}>
      {loading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      
      <Image
        source={{ uri: sourceUrl }}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setImageError(true);
        }}
      />
      
      {/* ONLY show overlay when NO real image */}
      {usePlaceholder && !loading && (
        <View style={styles.imageOverlay}>
          <View style={styles.overlayContent}>
            <View style={styles.iconCircle}>
              <Icon name="images-outline" size={32} color="white" />
            </View>
            <Text style={styles.overlayTitle}>Official Images Available</Text>
            <Text style={styles.overlaySubtitle}>Contact broker for property photos</Text>
            <View style={styles.overlayDivider} />
            <View style={styles.overlayBadge}>
              <Icon name="shield-checkmark-outline" size={14} color="#60a5fa" />
              <Text style={styles.overlayBadgeText}>Verified Listing</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Always show source badge */}
      <View style={styles.sourceBadge}>
        <Icon name="business-outline" size={12} color="white" />
        <Text style={styles.sourceBadgeText}>{deal?.source || 'Listing'}</Text>
      </View>
      
      {/* Show property type badge */}
      {deal?.propertyType && (
        <View style={styles.propertyTypeBadge}>
          <Text style={styles.propertyTypeBadgeText}>{deal.propertyType}</Text>
        </View>
      )}
    </View>
  );
};

function DealDetailScreen({ route, navigation }) {
  const { deal } = route.params || {};
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(!deal);
  const [participantCount, setParticipantCount] = useState(0);

  // Load image mapping on mount
  useEffect(() => {
    initImageUtils();
  }, []);

  useEffect(() => {
    if (deal) {
      setLoading(false);
      fetchParticipantCount();
    }
  }, [deal]);

  const fetchParticipantCount = async () => {
    if (!deal || !token) return;
    
    try {
      const dealId = deal.id || deal.propertyId || deal.listing_id;
      const response = await fetch(
        `${API_URL}/deals/${dealId}/chat/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setParticipantCount(data.length || 0);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const openDealChat = async () => {
    const listingId = Number(deal?.id || deal?.propertyId || deal?.listing_id);
    if (!Number.isSafeInteger(listingId) || listingId <= 0) {
      Alert.alert('Chat unavailable', 'This listing is not available for chat yet. Please choose another listing.');
      return;
    }

    try {
      const priceText = String(deal?.price || deal?.priceDisplay || '0');
      const numericPrice = Number(priceText.replace(/[^0-9.]/g, '')) || 1;
      const response = await fetch(`${API_URL}/deals/ensure/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: safeTitle,
          description: getString(deal?.description || deal?.summary, 'Listing discussion'),
          propertyType: getString(deal?.propertyType, 'Commercial'),
          location: getString(deal?.location || deal?.address || deal?.city, ''),
          price: numericPrice,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.deal_id) {
        throw new Error(data.error || 'Unable to prepare this deal for chat.');
      }
      navigation.navigate('DealChat', { dealId: data.deal_id, dealTitle: safeTitle, deal });
    } catch (error) {
      Alert.alert('Chat unavailable', error.message || 'Please try again in a moment.');
    }
  };

  const getString = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    try {
      return String(value);
    } catch {
      return fallback;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Deal not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeTitle = getString(deal.title || deal.name, 'Deal');
  const safePrice = getString(deal.priceDisplay || deal.price, 'Price Not Disclosed');
  const safeLocation = getString(deal.location || deal.address || deal.city, '');
  const safeSource = getString(deal.source, 'Listing');
  
  const isMockData = deal.source === 'Sample Data' || deal.source === 'Mock Data';
  
  const brokerName = getString(deal.broker || deal.brokerName);
  const brokerCompany = getString(deal.brokerCompany || deal.broker_company);
  const brokerPhone = getString(deal.brokerPhone || deal.contact_phone);
  const brokerEmail = getString(deal.brokerEmail);

  const getSafePropertyFacts = () => {
    if (!deal.propertyFacts) return null;
    if (typeof deal.propertyFacts !== 'object') return null;
    
    const safeFacts = {};
    Object.entries(deal.propertyFacts).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value) && value.length === 0) return;
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;
      
      let stringValue = '';
      try {
        stringValue = String(value);
      } catch {
        return;
      }
      
      if (!stringValue || stringValue === '' || 
          stringValue === 'undefined' || stringValue === 'null' ||
          stringValue === '{}' || stringValue === '[]') {
        return;
      }
      
      safeFacts[key] = stringValue;
    });
    
    return Object.keys(safeFacts).length > 0 ? safeFacts : null;
  };

  const safePropertyFacts = getSafePropertyFacts();
  const dealId = deal.id || deal.propertyId || deal.listing_id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <ImageWithFallback deal={deal} style={styles.headerImage} resizeMode="cover" />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{safeTitle}</Text>
            <Text style={styles.price}>{safePrice}</Text>
          </View>

          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>{isMockData ? 'Sample Data' : safeSource}</Text>
          </View>

          {safeLocation && (
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={18} color="#666" />
              <Text style={styles.locationText}>{safeLocation}</Text>
            </View>
          )}

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            <DetailRow label="Category" value={deal.category} />
            <DetailRow label="Property Type" value={deal.propertyType} />
            <DetailRow label="Address" value={deal.address} />
            <DetailRow label="City" value={deal.city} />
            <DetailRow label="State" value={deal.state} />
            <DetailRow label="Price" value={deal.price} />
            <DetailRow label="Cash Flow" value={deal.cashFlow} />
            <DetailRow label="Revenue" value={deal.revenue} />
          </View>

          {(brokerName || brokerCompany || brokerPhone || brokerEmail) && (
            <View style={styles.brokerSection}>
              <Text style={styles.sectionTitle}>Broker Information</Text>
              <DetailRow label="Name" value={brokerName} />
              <DetailRow label="Company" value={brokerCompany} />
              {brokerPhone && (
                <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(`tel:${brokerPhone}`)}>
                  <Icon name="call-outline" size={18} color="#2563eb" />
                  <Text style={styles.contactText}>{brokerPhone}</Text>
                </TouchableOpacity>
              )}
              {brokerEmail && (
                <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(`mailto:${brokerEmail}`)}>
                  <Icon name="mail-outline" size={18} color="#2563eb" />
                  <Text style={styles.contactText}>{brokerEmail}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {safePropertyFacts && (
            <View style={styles.factsSection}>
              <Text style={styles.sectionTitle}>Property Facts</Text>
              {Object.entries(safePropertyFacts).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').trim();
                return (
                  <View key={key} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text style={styles.detailValue} numberOfLines={3}>{value}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {(deal.description || deal.summary) && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{getString(deal.description || deal.summary)}</Text>
            </View>
          )}

          {deal.url && (
            <TouchableOpacity
              style={styles.urlButton}
              onPress={() => Linking.openURL(deal.url)}
            >
              <Icon name="open-outline" size={20} color="white" />
              <Text style={styles.urlButtonText}>View Original Listing</Text>
            </TouchableOpacity>
          )}

          {dealId && token ? (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={openDealChat}
            >
              <Icon name="people-outline" size={20} color="white" />
              <Text style={styles.chatButtonText}>
                Deal Chat {participantCount > 0 ? `(${participantCount})` : ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.chatButton, styles.chatButtonDisabled]}
              onPress={() => Alert.alert('Login Required', 'Please login to join the chat')}
            >
              <Icon name="lock-closed" size={20} color="white" />
              <Text style={styles.chatButtonText}>Login to Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default withSubscription(DealDetailScreen, ACCESS_TYPES.VIEW_LISTINGS);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#1a1a2e',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.5)',
    zIndex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.75)',
    padding: 20,
  },
  overlayContent: {
    alignItems: 'center',
    maxWidth: width * 0.85,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    marginBottom: 16,
  },
  overlayTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  overlaySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  overlayDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.5)',
    marginTop: 16,
    marginBottom: 12,
  },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  overlayBadgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  sourceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  sourceBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  propertyTypeBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  propertyTypeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerImage: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  sourceBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  detailsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
    marginLeft: 12,
  },
  factsSection: {
    marginTop: 16,
  },
  brokerSection: {
    marginTop: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    color: '#2563eb',
    fontSize: 14,
    marginLeft: 8,
  },
  descriptionSection: {
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginTop: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  chatButtonDisabled: {
    opacity: 0.6,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 40,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  urlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
