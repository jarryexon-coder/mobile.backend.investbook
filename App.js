import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { fixPricesInCache } from './src/utils/fixPrices';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import DealsScreen from './src/screens/DealsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DealDetailScreen from './src/screens/DealDetailScreen';
import TermsScreen from './src/screens/TermsScreen';
import ChatHubScreen from './src/screens/ChatHubScreen';
import Under200kScreen from './src/screens/Under200kScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import DealChatScreen from './src/screens/DealChatScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PropertyResearchScreen from './src/screens/PropertyResearchScreen';

// Import the listings data directly
import listingsData from './src/data/listings.json';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Preload data function with price fix
const preloadListingsData = async () => {
  try {
    // Check if we already have cached data
    const cached = await AsyncStorage.getItem('listings_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.length > 0) {
        console.log(`✅ Using cached data: ${parsed.length} listings`);
        
        // Fix prices in the cached data
        console.log('🔧 Checking and fixing prices in cache...');
        const fixedCount = await fixPricesInCache();
        if (fixedCount > 0) {
          console.log(`✅ Fixed ${fixedCount} prices in cache`);
        } else if (fixedCount === 0) {
          console.log('✅ All prices are already correct!');
        } else {
          console.log('❌ Error fixing prices');
        }
        return;
      }
    }

    // Format the data from JSON
    console.log('📦 Loading fresh data from JSON...');
    const formatted = listingsData.map(item => ({
      id: item.propertyId || item.id || Math.random().toString(36).substr(2, 9),
      title: item.name || item.title || 'Property',
      price: item.price || 'Contact for price',
      priceDisplay: item.priceDisplay || item.price || 'Contact for price',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      propertyType: item.propertyType || 'Commercial',
      description: item.description || item.summary || '',
      images: item.images || [],
      imageUrl: item.imageUrl || item.image || item.photo || '',
      photo: item.photo || '',
      broker: item.brokerName || item.broker || '',
      brokerName: item.brokerName || item.broker || '',
      brokerCompany: item.brokerCompany || '',
      brokerPhone: item.brokerPhone || '',
      brokerEmail: item.brokerEmail || '',
      url: item.listingUrl || item.url || '',
      listingUrl: item.listingUrl || item.url || '',
      source: 'LoopNet',
      sourceType: item.sourceType || 'listingWeb',
      propertyFacts: item.propertyFacts || {},
      cashFlow: item.cashFlow || '',
      revenue: item.revenue || '',
      yearBuilt: item.yearBuilt || '',
      lotSize: item.lotSize || '',
      squareFeet: item.squareFeet || '',
      capRate: item.capRate || '',
      propertyType: item.propertyType || '',
      propertySubtype: item.propertySubtype || '',
      buildingClass: item.buildingClass || '',
      numberOfStories: item.numberOfStories || '',
      parkingRatio: item.parkingRatio || '',
      tenancy: item.tenancy || '',
      saleType: item.saleType || '',
      zip: item.zip || '',
      country: item.country || 'US',
      dateUpdated: item.dateUpdated || '',
    }));

    // Save to cache
    await AsyncStorage.setItem('listings_cache', JSON.stringify(formatted));
    console.log(`✅ Preloaded ${formatted.length} listings from JSON`);
    
    // Fix prices in the newly loaded data
    console.log('🔧 Fixing prices in fresh data...');
    const fixedCount = await fixPricesInCache();
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} prices in fresh data`);
    } else if (fixedCount === 0) {
      console.log('✅ All prices are correct!');
    }
  } catch (error) {
    console.error('❌ Preload error:', error);
  }
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Opportunities') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Deals') iconName = focused ? 'briefcase' : 'briefcase-outline';
          else if (route.name === 'Portfolio') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Under200k') iconName = focused ? 'cash' : 'cash-outline';
          else if (route.name === 'Research') iconName = focused ? 'analytics' : 'analytics-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'InvestBook' }} />
      <Tab.Screen name="Opportunities" component={OpportunitiesScreen} options={{ title: 'Opportunities' }} />
      <Tab.Screen name="Deals" component={DealsScreen} options={{ title: 'Deals' }} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} options={{ title: 'Portfolio' }} />
      <Tab.Screen name="Under200k" component={Under200kScreen} options={{ title: '💰 $200k' }} />
      <Tab.Screen name="Research" component={PropertyResearchScreen} options={{ title: 'Research' }} />
      <Tab.Screen name="Chat" component={ChatHubScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="DealDetail" 
            component={DealDetailScreen} 
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
              title: 'Deal Details'
            }}
          />
          <Stack.Screen 
            name="DealChat" 
            component={DealChatScreen}
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
              title: 'Deal Chat'
            }}
          />
          <Stack.Screen 
            name="Subscription" 
            component={SubscriptionScreen}
            options={{ 
              headerShown: true,
              headerStyle: { backgroundColor: '#2563eb' },
              headerTintColor: '#fff',
              title: 'Subscription'
            }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ headerShown: true, title: 'Privacy & Data' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerShown: true, title: 'Edit Profile' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  // Preload data when app starts
  useEffect(() => {
    preloadListingsData();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
