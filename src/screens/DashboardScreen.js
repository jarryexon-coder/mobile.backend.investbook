import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllListings } from '../services/api';
import { getUnder200kListings } from '../services/enhancedScraperService';

const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
  <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
    <View style={styles.statHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    byState: {},
  });
  const [under200kCount, setUnder200kCount] = useState(0);

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const listings = await getAllListings();
      
      // Calculate stats
      const byType = {};
      const byState = {};
      
      listings.forEach(item => {
        const type = item.propertyType || 'Other';
        const state = item.state || 'Unknown';
        
        byType[type] = (byType[type] || 0) + 1;
        byState[state] = (byState[state] || 0) + 1;
      });
      
      setStats({
        total: listings.length,
        byType,
        byState,
      });
      
      // Get under $200k count
      try {
        const under200kData = await getUnder200kListings();
        const count = (under200kData.businesses?.length || 0) + (under200kData.properties?.length || 0);
        setUnder200kCount(count);
        console.log(`💰 Under $200k deals: ${count}`);
      } catch (error) {
        console.log('⚠️ Could not fetch under $200k count:', error.message);
        setUnder200kCount(0);
      }
      
      console.log(`📊 Dashboard loaded: ${listings.length} properties`);
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const handleRefresh = useCallback(() => {
    loadDashboard(true);
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const propertyTypes = Object.keys(stats.byType).sort();
  const topTypes = propertyTypes.slice(0, 8);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>InvestBook</Text>
          <Text style={styles.headerSubtitle}>Investment Property Dashboard</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Properties"
            value={stats.total}
            icon="business-outline"
            color="#2563eb"
            onPress={() => navigation.navigate('Deals')}
          />
          <StatCard
            title="Property Types"
            value={propertyTypes.length}
            icon="apps-outline"
            color="#10b981"
            onPress={() => navigation.navigate('Opportunities')}
          />
          <StatCard
            title="States"
            value={Object.keys(stats.byState).length}
            icon="location-outline"
            color="#f59e0b"
          />
          <StatCard
            title="Active Listings"
            value={stats.total}
            icon="checkmark-circle-outline"
            color="#ef4444"
            onPress={() => navigation.navigate('Deals')}
          />
        </View>

        {/* Under $200k Special Card */}
        <View style={styles.under200kContainer}>
          <TouchableOpacity
            style={styles.under200kCard}
            onPress={() => navigation.navigate('Under200k')}
            activeOpacity={0.8}
          >
            <View style={styles.under200kContent}>
              <View style={styles.under200kIcon}>
                <Icon name="cash-outline" size={32} color="#10b981" />
              </View>
              <View style={styles.under200kInfo}>
                <Text style={styles.under200kTitle}>💰 Under $200k Deals</Text>
                <Text style={styles.under200kCount}>{under200kCount} affordable opportunities</Text>
              </View>
              <View style={styles.under200kArrow}>
                <Icon name="chevron-forward" size={24} color="#10b981" />
              </View>
            </View>
            <View style={styles.under200kProgress}>
              <View style={[styles.under200kProgressBar, { width: `${Math.min((under200kCount / stats.total) * 100, 100)}%` }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Property Types</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Opportunities')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.typesGrid}>
            {topTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={styles.typeCard}
                onPress={() => navigation.navigate('Opportunities')}
              >
                <Text style={styles.typeCardName}>{type}</Text>
                <Text style={styles.typeCardCount}>{stats.byType[type]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Deals')}
            >
              <Icon name="search-outline" size={30} color="#2563eb" />
              <Text style={styles.actionText}>Browse Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Under200k')}
            >
              <Icon name="cash-outline" size={30} color="#10b981" />
              <Text style={styles.actionText}>Under $200k</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Opportunities')}
            >
              <Icon name="list-outline" size={30} color="#f59e0b" />
              <Text style={styles.actionText}>View Opportunities</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    margin: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  under200kContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  under200kCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  under200kContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  under200kIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  under200kInfo: {
    flex: 1,
    marginLeft: 12,
  },
  under200kTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  under200kCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  under200kArrow: {
    padding: 4,
  },
  under200kProgress: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  under200kProgressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeCardName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  typeCardCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
});
