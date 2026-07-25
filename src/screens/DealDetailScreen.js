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

// SIMPLE DetailRow - Only renders strings
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

export default function DealDetailScreen({ route, navigation }) {
  const { deal } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    if (deal) {
      setLoading(false);
    }
  }, [deal]);

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
  
  const imageUrl = deal.imageUrl || deal.image || deal.photo || 
                   (deal.images && deal.images[0]) || null;

  const isMockData = deal.source === 'Sample Data' || deal.source === 'Mock Data';
  
  // Get broker info
  const brokerName = getString(deal.broker || deal.brokerName);
  const brokerCompany = getString(deal.brokerCompany || deal.broker_company);
  const brokerPhone = getString(deal.brokerPhone || deal.contact_phone);
  const brokerEmail = getString(deal.brokerEmail);

  // Get property facts with safety - handle nested objects
  const getSafePropertyFacts = () => {
    if (!deal.propertyFacts) return null;
    if (typeof deal.propertyFacts !== 'object') return null;
    
    // Filter out invalid entries
    const safeFacts = {};
    Object.entries(deal.propertyFacts).forEach(([key, value]) => {
      // Skip null/undefined
      if (value === null || value === undefined) return;
      
      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) return;
      
      // Skip empty objects
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;
      
      // Convert to string safely
      let stringValue = '';
      try {
        stringValue = String(value);
      } catch {
        return;
      }
      
      // Skip if empty or placeholder
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.headerImage} resizeMode="cover" />
        ) : (
          <View style={[styles.headerImage, styles.placeholderImage]}>
            <Icon name="business-outline" size={60} color="#ccc" />
          </View>
        )}

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

          {/* Basic Details */}
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

          {/* Broker Section */}
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

          {/* PROPERTY FACTS - Safely added */}
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

          {/* Description */}
          {(deal.description || deal.summary) && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{getString(deal.description || deal.summary)}</Text>
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
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              const chatId = deal.id || deal.propertyId || deal.listing_id;
              navigation.navigate('Chat', { 
                dealId: String(chatId || ''),
                dealTitle: safeTitle,
                userId: user?.id
              });
            }}
          >
            <Icon name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.chatButtonText}>Chat about this deal</Text>
          </TouchableOpacity>
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
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
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
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
