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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';

// Safe DetailRow component - handles all data types safely
const DetailRow = ({ label, value }) => {
  // Skip if label is missing
  if (!label) {
    return null;
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Convert value to string safely
  let displayValue = '';
  
  if (typeof value === 'string') {
    displayValue = value.trim();
  } else if (typeof value === 'number') {
    displayValue = String(value);
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else if (Array.isArray(value)) {
    if (value.length === 0) return null;
    displayValue = value.join(', ');
  } else if (typeof value === 'object') {
    // Try to get a meaningful string from the object
    try {
      if (value.toString && value.toString() !== '[object Object]') {
        displayValue = value.toString();
      } else {
        // For objects, try to get a value from common fields
        if (value.name) displayValue = String(value.name);
        else if (value.label) displayValue = String(value.label);
        else if (value.value) displayValue = String(value.value);
        else if (value.title) displayValue = String(value.title);
        else {
          // If nothing else, convert to JSON string (truncated)
          const jsonStr = JSON.stringify(value);
          if (jsonStr.length > 50) {
            displayValue = jsonStr.substring(0, 50) + '...';
          } else {
            displayValue = jsonStr;
          }
        }
      }
    } catch {
      return null;
    }
  } else {
    // Fallback: convert to string
    try {
      displayValue = String(value);
    } catch {
      return null;
    }
  }

  // Skip if display value is empty
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

export default function DealDetailScreen({ route, navigation }) {
  const { deal } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    if (deal) {
      setLoading(false);
    }
  }, [deal]);

  // Helper function to get the best price display
  const getDisplayPrice = (deal) => {
    if (!deal) return 'Price Not Disclosed';
    if (deal.priceDisplay && deal.priceDisplay !== 'Price Not Disclosed') {
      return deal.priceDisplay;
    }
    if (deal.price && deal.price > 0) {
      return `$${deal.price.toLocaleString()}`;
    }
    if (deal.priceNumeric && deal.priceNumeric > 0) {
      return `$${deal.priceNumeric.toLocaleString()}`;
    }
    if (deal.formattedPrice) {
      return deal.formattedPrice;
    }
    if (deal.priceText) {
      return deal.priceText;
    }
    return 'Price Not Disclosed';
  };

  // Helper to get property type
  const getPropertyType = (deal) => {
    if (!deal) return null;
    if (deal.propertyType) return deal.propertyType;
    if (deal.category) return deal.category;
    if (deal.propertySubtype) return deal.propertySubtype;
    if (deal.listing_category) return deal.listing_category;
    return null;
  };

  // Helper to get location
  const getLocation = (deal) => {
    if (!deal) return null;
    if (deal.location) return deal.location;
    if (deal.address) return deal.address;
    if (deal.city && deal.state) return `${deal.city}, ${deal.state}`;
    if (deal.city) return deal.city;
    if (deal.state) return deal.state;
    if (deal.country) return deal.country;
    return null;
  };

  // Helper to get the best image URL
  const getImageUrl = (deal) => {
    if (!deal) return null;
    if (deal.imageUrl) return deal.imageUrl;
    if (deal.image) return deal.image;
    if (deal.photo) return deal.photo;
    if (deal.images && deal.images.length > 0) return deal.images[0];
    if (deal.image_urls && deal.image_urls.length > 0) return deal.image_urls[0];
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading deal details...</Text>
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Deal not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Determine data source
  const isBizBuySell = deal.source === 'BizBuySell' || 
                       (deal.source && deal.source.includes('BizBuySell')) || 
                       deal.category ||
                       deal.listing_category ||
                       deal.cashFlow ||
                       deal.revenue;

  const isLoopNet = deal.source === 'Property Listing' || 
                    (deal.source && deal.source.includes('LoopNet')) || 
                    deal.propertyType ||
                    deal.address ||
                    deal.size ||
                    deal.lotSize;

  const isMockData = deal.source === 'Sample Data' || 
                     deal.source === 'Mock Data' ||
                     (deal.id && typeof deal.id === 'string' && deal.id.startsWith('mock-'));

  // Get data
  const imageUrl = getImageUrl(deal);
  const brokerName = deal.broker || deal.brokerName || null;
  const brokerCompany = deal.brokerCompany || deal.broker_company || null;
  const brokerPhone = deal.brokerPhone || deal.contact_phone || null;
  const brokerEmail = deal.brokerEmail || null;
  const propertyFacts = deal.details?.propertyFacts || deal.propertyFacts || null;

  const hasValidId = deal.id && typeof deal.id === 'string' && !deal.id.startsWith('mock-');
  const hasPropertyId = deal.propertyId || deal.listing_id;
  const canChat = hasValidId || hasPropertyId || deal.hasValidId;
  const chatId = deal.id || deal.propertyId || deal.listing_id;

  const location = getLocation(deal);
  const propertyType = getPropertyType(deal);
  const displayPrice = getDisplayPrice(deal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.headerImage, styles.placeholderImage]}>
            <Icon name="business-outline" size={60} color="#ccc" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{deal.title || deal.name || 'Deal'}</Text>
            <Text style={styles.price}>{displayPrice}</Text>
          </View>

          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {isMockData ? 'Sample Data' : deal.source || 'Listing'}
            </Text>
          </View>

          {location && (
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={18} color="#666" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}

          {/* BizBuySell Fields */}
          {isBizBuySell && (
            <View style={styles.detailsSection}>
              <DetailRow label="Category" value={deal.category || deal.listing_category} />
              <DetailRow label="Location" value={deal.location} />
              <DetailRow label="State" value={deal.state || deal.state_code} />
              <DetailRow label="Cash Flow" value={deal.cashFlow ? `$${deal.cashFlow.toLocaleString()}` : null} />
              <DetailRow label="Revenue" value={deal.revenue ? `$${deal.revenue.toLocaleString()}` : null} />
              <DetailRow label="EBITDA" value={deal.ebitda ? `$${deal.ebitda.toLocaleString()}` : null} />
              <DetailRow label="Year Established" value={deal.yearEstablished} />
              <DetailRow label="Employees" value={deal.employees} />
              <DetailRow label="Building Size" value={deal.buildingSize} />
            </View>
          )}

          {/* LoopNet / Property Fields */}
          {isLoopNet && (
            <View style={styles.detailsSection}>
              <DetailRow label="Property Type" value={propertyType} />
              <DetailRow label="Address" value={deal.address} />
              <DetailRow label="City" value={deal.city} />
              <DetailRow label="State" value={deal.state} />
              <DetailRow label="Zip Code" value={deal.zip} />
              <DetailRow label="Size" value={deal.size} />
              <DetailRow label="Total Size" value={deal.totalSize} />
              <DetailRow label="Lot Size" value={deal.lotSize} />
              <DetailRow label="Year Built" value={deal.yearBuilt} />
              <DetailRow label="Cap Rate" value={deal.capRate} />
              <DetailRow label="Zoning" value={deal.zoning} />
            </View>
          )}

          {/* Property Facts */}
          {propertyFacts && typeof propertyFacts === 'object' && Object.keys(propertyFacts).length > 0 && (
            <View style={styles.factsSection}>
              <Text style={styles.sectionTitle}>Property Facts</Text>
              {Object.entries(propertyFacts).map(([key, value]) => {
                if (value && value !== 'undefined' && value !== 'null') {
                  const label = key.replace(/([A-Z])/g, ' $1').trim();
                  return <DetailRow key={key} label={label} value={String(value)} />;
                }
                return null;
              })}
            </View>
          )}

          {/* Broker Info */}
          {(brokerName || brokerCompany || brokerPhone || brokerEmail) && (
            <View style={styles.brokerSection}>
              <Text style={styles.sectionTitle}>Broker Information</Text>
              <DetailRow label="Name" value={brokerName} />
              <DetailRow label="Company" value={brokerCompany} />
              {brokerEmail && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`mailto:${brokerEmail}`)}
                >
                  <Icon name="mail-outline" size={18} color="#2563eb" />
                  <Text style={styles.contactText}>{brokerEmail}</Text>
                </TouchableOpacity>
              )}
              {brokerPhone && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`tel:${brokerPhone}`)}
                >
                  <Icon name="call-outline" size={18} color="#2563eb" />
                  <Text style={styles.contactText}>{brokerPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Description */}
          {(deal.description || deal.summary) && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {deal.description || deal.summary || ''}
              </Text>
            </View>
          )}

          {/* Original Listing URL */}
          {deal.url && (
            <TouchableOpacity
              style={styles.urlButton}
              onPress={() => Linking.openURL(deal.url)}
            >
              <Icon name="open-outline" size={20} color="white" />
              <Text style={styles.urlButtonText}>View Original Listing</Text>
            </TouchableOpacity>
          )}

          {/* Chat Button */}
          {canChat && chatId && !isMockData && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                const dealIdToUse = deal.propertyId || deal.id || String(chatId);
                navigation.navigate('Chat', { 
                  dealId: String(dealIdToUse),
                  dealTitle: deal.title || 'Deal',
                  price: deal.price,
                  location: location,
                  propertyType: propertyType,
                  userId: user?.id
                });
              }}
            >
              <Icon name="chatbubble-outline" size={20} color="white" />
              <Text style={styles.chatButtonText}>Chat about this deal</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  headerImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
    marginTop: 8,
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
  descriptionSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginTop: 4,
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 30,
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
});
