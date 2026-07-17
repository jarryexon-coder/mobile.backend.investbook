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

  const isBizBuySell = deal.source === 'BizBuySell' || deal.source?.includes('BizBuySell');
  const isLoopNet = deal.source === 'LoopNet (RapidAPI)' || deal.source?.includes('LoopNet');

  return (
    <ScrollView style={styles.container}>
      {deal.imageUrl ? (
        <Image
          source={{ uri: deal.imageUrl }}
          style={styles.headerImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{deal.title || 'Deal'}</Text>
          <Text style={styles.price}>
            ${(deal.price || 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{deal.source || 'Unknown'}</Text>
        </View>

        {isBizBuySell && (
          <>
            <DetailRow label="Category" value={deal.category} />
            <DetailRow label="Location" value={deal.location} />
            <DetailRow label="State" value={deal.state} />
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
            {deal.broker && deal.broker !== 'N/A' ? (
              <DetailRow label="Broker" value={deal.broker} />
            ) : null}
            {deal.brokerPhone ? (
              <TouchableOpacity 
                style={styles.phoneButton}
                onPress={() => Linking.openURL(`tel:${deal.brokerPhone}`)}
              >
                <Icon name="call-outline" size={18} color="#2563eb" />
                <Text style={styles.phoneText}>Call Broker</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {isLoopNet && (
          <>
            <DetailRow label="Address" value={deal.address} />
            <DetailRow label="Property Type" value={deal.propertyType} />
            {deal.size ? <DetailRow label="Size" value={deal.size} /> : null}
            {deal.buildingClass ? <DetailRow label="Building Class" value={deal.buildingClass} /> : null}
          </>
        )}

        {(deal.description || deal.summary) && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {deal.description || deal.summary || ''}
            </Text>
          </View>
        )}

        {deal.url ? (
          <TouchableOpacity
            style={styles.urlButton}
            onPress={() => Linking.openURL(deal.url)}
          >
            <Icon name="open-outline" size={20} color="white" />
            <Text style={styles.urlButtonText}>View Original Listing</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const DetailRow = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label || ''}</Text>
      <Text style={styles.detailValue}>{String(value)}</Text>
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
    marginBottom: 16,
  },
  sourceText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
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
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
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
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  phoneText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 30,
  },
  urlButtonText: {
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
