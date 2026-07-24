import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { initializeActorHealth } from './src/services/actorHealthCheck';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import DealsScreen from './src/screens/DealsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DealDetailScreen from './src/screens/DealDetailScreen';
import TermsScreen from './src/screens/TermsScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateDealScreen from './src/screens/CreateDealScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator - INCLUDING CHAT
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Opportunities') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Deals') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Portfolio') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'InvestBook' }}
      />
      <Tab.Screen 
        name="Opportunities" 
        component={OpportunitiesScreen} 
        options={{ title: 'Opportunities' }}
      />
      <Tab.Screen 
        name="Deals" 
        component={DealsScreen} 
        options={{ title: 'Deals' }}
      />
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioScreen} 
        options={{ title: 'Portfolio' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ title: 'Chat' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// App Navigator - uses auth context
function AppNavigator() {
  const { user, loading, isAuthenticated } = useAuth();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    checkTerms();
  }, []);

  useEffect(() => {
    // Check actor health on app start
    initializeActorHealth();
  }, []);

  const checkTerms = async () => {
    try {
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      setHasAcceptedTerms(termsAccepted === 'true');
    } catch (error) {
      console.error('Error checking terms:', error);
    }
  };

  const handleTermsAccept = async () => {
    try {
      await AsyncStorage.setItem('termsAccepted', 'true');
      await AsyncStorage.setItem('termsVersion', '1.0.0');
      setHasAcceptedTerms(true);
    } catch (error) {
      console.error('Error saving terms:', error);
    }
  };

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
        // Not logged in
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !hasAcceptedTerms ? (
        // Logged in but hasn't accepted terms
        <Stack.Screen 
          name="Terms" 
          component={TermsScreen}
        />
      ) : (
        // Fully logged in
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="DealDetail" 
            component={DealDetailScreen} 
            options={{ 
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              title: 'Deal Details'
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ 
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              title: 'Chat'
            }}
          />
          <Stack.Screen 
            name="CreateDeal" 
            component={CreateDealScreen} 
            options={{ 
              headerShown: true,
              headerStyle: {
                backgroundColor: '#2563eb',
              },
              headerTintColor: '#fff',
              title: 'Create Deal'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Main App - wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
