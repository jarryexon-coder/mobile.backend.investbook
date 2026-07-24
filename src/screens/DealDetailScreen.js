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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DealDetailScreen({ route, navigation }) {
  const { deal } = route.params || {};
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    if (deal) {
      setLoading(false);
    }
  }, [deal]);

  // Helper function to get the best price display
  const getDisplayPrice = (deal) => {
    if (deal.priceDisplay) return deal.priceDisplay;
    if (deal.price) return `$${deal.price.toLocaleString()}`;
    return 'N/A';
  };

  // Helper to get property type
  const getPropertyType = (deal) => {
    if (deal.propertyType) return deal.propertyType;
    if (deal.category) return deal.category;
    if (deal.propertySubtype) return deal.propertySubtype;
    return null;
  };

  // Helper to get location
  const getLocation = (deal) => {
    if (deal.location) return deal.location;
    if (deal.address) return deal.address;
    if (deal.city && deal.state) return `${deal.city}, ${deal.state}`;
    if (deal.city) return deal.city;
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
  const isBizBuySell = deal.source === 'BizBuySell' || deal.source?.includes('BizBuySell') || deal.category;
  const isLoopNet = deal.source === 'Property Listing' || deal.source?.includes('LoopNet') || deal.propertyType;
  const isMockData = deal.source === 'Sample Data' || deal.source === 'Mock Data';

  // Get the best image URL
  const imageUrl = deal.imageUrl || 
                   deal.image || 
                   deal.photo || 
                   (deal.images && deal.images.length > 0 ? deal.images[0] : null);

  // Get broker info
  const brokerName = deal.broker || deal.brokerName || deal.broker_company || null;
  const brokerPhone = deal.brokerPhone || deal.contact_phone || null;
  const brokerEmail = deal.brokerEmail || null;

  // Get property facts
  const propertyFacts = deal.details?.propertyFacts || deal.propertyFacts || null;

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.price}>{getDisplayPrice(deal)}</Text>
        </View>

        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>
            {isMockData ? '📊 Sample Data' : deal.source || 'Listing'}
          </Text>
        </View>

        {/* Location */}
        {getLocation(deal) && (
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={18} color="#666" />
            <Text style={styles.locationText}>{getLocation(deal)}</Text>
          </View>
        )}

        {/* BizBuySell Fields */}
        {isBizBuySell && (
          <>
            <DetailRow label="Category" value={deal.category || deal.listing_category} />
            <DetailRow label="Location" value={deal.location} />
            <DetailRow label="State" value={deal.state || deal.state_code} />
            {deal.cashFlow ? (
              <DetailRow 
                label="Cash Flow" 
                value={`$${(deal.cashFlow || 0).toLocaleString()}`} 
              />
            ) : null}
            {deal.revenue ? (
              <DetailRow 
                label="Revenue" 
                value={`$${(deal.revenue || 0).toLocaleString()}`} 
              />
            ) : null}
            {deal.ebitda ? (
              <DetailRow 
                label="EBITDA" 
                value={`$${(deal.ebitda || 0).toLocaleString()}`} 
              />
            ) : null}
            {deal.yearEstablished ? (
              <DetailRow label="Year Established" value={deal.yearEstablished} />
            ) : null}
            {deal.employees ? (
              <DetailRow label="Employees" value={deal.employees} />
            ) : null}
            {deal.buildingSize ? (
              <DetailRow label="Building Size" value={deal.buildingSize} />
            ) : null}
          </>
        )}

        {/* LoopNet / Property Fields */}
        {isLoopNet && (
          <>
            <DetailRow label="Property Type" value={getPropertyType(deal)} />
            <DetailRow label="Address" value={deal.address} />
            <DetailRow label="City" value={deal.city} />
            <DetailRow label="State" value={deal.state} />
            {deal.zip ? <DetailRow label="Zip Code" value={deal.zip} /> : null}
            {deal.size ? <DetailRow label="Size" value={deal.size} /> : null}
            {deal.totalSize ? <DetailRow label="Total Size" value={deal.totalSize} /> : null}
            {deal.lotSize ? <DetailRow label="Lot Size" value={deal.lotSize} /> : null}
            {deal.yearBuilt ? <DetailRow label="Year Built" value={deal.yearBuilt} /> : null}
            {deal.capRate ? <DetailRow label="Cap Rate" value={deal.capRate} /> : null}
            {deal.zoning ? <DetailRow label="Zoning" value={deal.zoning} /> : null}
            
            {/* Property Facts */}
            {propertyFacts && (
              <View style={styles.factsSection}>
                <Text style={styles.sectionTitle}>Property Facts</Text>
                {Object.entries(propertyFacts).map(([key, value]) => {
                  if (value && value !== 'undefined' && value !== 'null') {
                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                    return <DetailRow key={key} label={label} value={value} />;
                  }
                  return null;
                })}
              </View>
            )}
          </>
        )}

        {/* Broker Info */}
        {(brokerName || brokerPhone || brokerEmail) && (
          <View style={styles.brokerSection}>
            <Text style={styles.sectionTitle}>📞 Broker Information</Text>
            {brokerName && <DetailRow label="Name" value={brokerName} />}
            {brokerCompany && <DetailRow label="Company" value={brokerCompany} />}
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
        {deal.url ? (
          <TouchableOpacity
            style={styles.urlButton}
            onPress={() => Linking.openURL(deal.url)}
          >
            <Icon name="open-outline" size={20} color="white" />
            <Text style={styles.urlButtonText}>View Original Listing</Text>
          </TouchableOpacity>
        ) : null}

        {/* Chat Button */}
        {deal.id && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { 
              dealId: deal.id, 
              dealTitle: deal.title || 'Deal' 
            })}
          >
            <Icon name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.chatButtonText}>Chat about this deal</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const DetailRow = ({ label, value }) => {
  if (!label || value === null || value === undefined || value === '' || value === 'undefined' || value === 'null') {
    return null;
  }
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={3}>{String(value)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
