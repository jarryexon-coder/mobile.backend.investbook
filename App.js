import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import DealsScreen from './src/screens/DealsScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import DealDetailScreen from './src/screens/DealDetailScreen';
import TermsScreen from './src/screens/TermsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator
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
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator({ onTermsAccept }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen}
        initialParams={{ onAccept: onTermsAccept }}
      />
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
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      // Check if user is logged in
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);

      // Check if terms have been accepted
      const termsAccepted = await AsyncStorage.getItem('termsAccepted');
      const termsVersion = await AsyncStorage.getItem('termsVersion');
      
      // You can add version checking here if you update terms
      setHasAcceptedTerms(termsAccepted === 'true');
      
    } catch (error) {
      console.error('Error checking app state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsAccept = () => {
    setHasAcceptedTerms(true);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        // User is not logged in - show Login screen
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs} 
            listeners={{
              beforeRemove: (e) => {
                // Prevent going back to login
                e.preventDefault();
              }
            }}
          />
        </Stack.Navigator>
      ) : !hasAcceptedTerms ? (
        // User is logged in but hasn't accepted terms
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen}
            initialParams={{ onAccept: handleTermsAccept }}
          />
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            listeners={{
              beforeRemove: (e) => {
                // Prevent going back to terms
                e.preventDefault();
              }
            }}
          />
        </Stack.Navigator>
      ) : (
        // User is logged in and has accepted terms
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
