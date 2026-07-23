import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DealsScreen from './src/screens/DealsScreen';
import DealDetailScreen from './src/screens/DealDetailScreen';
import CreateDealScreen from './src/screens/CreateDealScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from './src/services/notificationService';
import { navigationRef } from './src/services/navigationService';
import ProtectedScreen from './src/components/ProtectedScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Deals') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Portfolio') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          else if (route.name === 'Opportunities') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Subscription') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
      />
      <Tab.Screen 
        name="Deals" 
        component={DealsScreen} 
      />
      <Tab.Screen 
        name="Portfolio" 
        component={PortfolioScreen} 
      />
      <Tab.Screen 
        name="Opportunities" 
        component={OpportunitiesScreen} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
      />
      <Tab.Screen 
        name="Subscription" 
        component={SubscriptionScreen} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="DealDetail" component={DealDetailScreen} />
      <Stack.Screen name="CreateDeal" component={CreateDealScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
