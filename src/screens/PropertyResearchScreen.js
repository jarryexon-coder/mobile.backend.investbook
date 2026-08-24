import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../services/apiClient';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

const formatMoney = (value) => (
  typeof value === 'number' ? `$${value.toLocaleString('en-US')}` : 'Not available'
);

const PropertyCard = ({ property }) => {
  const facts = [
    property.propertyType,
    property.yearBuilt ? `Built ${property.yearBuilt}` : null,
    property.squareFeet ? `${Number(property.squareFeet).toLocaleString()} sq ft` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.researchBadge}>
          <Icon name="analytics-outline" size={13} color="#1d4ed8" />
          <Text style={styles.researchBadgeText}>Property research</Text>
        </View>
        <Text style={styles.value}>{formatMoney(property.estimatedMarketValue)}</Text>
      </View>
      <Text style={styles.valueCaption}>Estimated market value</Text>
      <Text style={styles.address}>{property.address}</Text>
      {facts.length > 0 && <Text style={styles.facts}>{facts.join(' • ')}</Text>}
      <View style={styles.divider} />
      <Text style={styles.meta}>
        Tax assessed value: {formatMoney(property.taxAssessedValue)}
      </Text>
      {property.annualPropertyTax && (
        <Text style={styles.meta}>
          Property tax ({property.taxYear || 'latest'}): {formatMoney(property.annualPropertyTax)}
        </Text>
      )}
      {property.sourceUpdatedAt && (
        <Text style={styles.updated}>ATTOM data updated {property.sourceUpdatedAt}</Text>
      )}
    </View>
  );
};

function PropertyResearchScreen() {
  const [zipCode, setZipCode] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('Enter a U.S. ZIP code to find properties with estimated market values up to $200,000.');
  const [searchedZip, setSearchedZip] = useState('');

  const search = useCallback(async ({ refresh = false } = {}) => {
    const normalizedZip = zipCode.trim();
    if (!/^\d{5}(-\d{4})?$/.test(normalizedZip)) {
      setMessage('Enter a valid 5- or 9-digit U.S. ZIP code.');
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);
    setMessage('');
    try {
      const response = await apiClient.get('/property-research', {
        params: { postal_code: normalizedZip, page_size: 20 },
      });
      setProperties(response.data.properties || []);
      setSearchedZip(normalizedZip);
      setMessage(
        response.data.properties?.length
          ? response.data.disclaimer
          : 'No matching property research records were returned for this ZIP code.'
      );
    } catch (error) {
      setProperties([]);
      setMessage(error.response?.data?.message || 'Unable to load property research right now. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [zipCode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => search({ refresh: true })} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <Text style={styles.title}>Property Research</Text>
              <Text style={styles.subtitle}>
                Research estimated values—not active listings or sale prices.
              </Text>
            </View>
            <View style={styles.searchRow}>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="ZIP code, e.g. 82009"
                keyboardType="number-pad"
                maxLength={10}
                style={styles.input}
                returnKeyType="search"
                onSubmitEditing={() => search()}
              />
              <TouchableOpacity style={styles.searchButton} onPress={() => search()} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Icon name="search" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
            {searchedZip ? <Text style={styles.resultsLabel}>Research results for {searchedZip}</Text> : null}
            {message ? <Text style={styles.disclaimer}>{message}</Text> : null}
          </>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Icon name="home-outline" size={52} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Start with a ZIP code</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  hero: { marginBottom: 14 },
  title: { fontSize: 25, fontWeight: '700', color: '#0f172a' },
  subtitle: { marginTop: 5, fontSize: 14, lineHeight: 20, color: '#475569' },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, marginRight: 8, minHeight: 48 },
  searchButton: { width: 52, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  resultsLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  disclaimer: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 18, color: '#1e3a8a', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 12, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  researchBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  researchBadgeText: { fontSize: 11, fontWeight: '600', color: '#1d4ed8' },
  value: { color: '#047857', fontSize: 18, fontWeight: '700' },
  valueCaption: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 1 },
  address: { fontSize: 16, fontWeight: '650', color: '#0f172a', marginTop: 12 },
  facts: { fontSize: 13, color: '#475569', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 11 },
  meta: { fontSize: 13, color: '#475569', marginTop: 2 },
  updated: { marginTop: 8, fontSize: 12, color: '#64748b' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { marginTop: 12, color: '#64748b', fontSize: 15 },
});

export default withSubscription(PropertyResearchScreen, ACCESS_TYPES.VIEW_LISTINGS);
