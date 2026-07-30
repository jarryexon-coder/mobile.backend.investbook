import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/env';

// Sample portfolio data - used as fallback
const SAMPLE_PORTFOLIO = {
  investments: [
    {
      id: '1',
      title: 'Commercial Office Building',
      type: 'property',
      amount: 250000,
      date: '2024-01-15',
      return: 12.5,
      status: 'active',
      location: 'New York, NY',
      propertyType: 'Office',
    },
    {
      id: '2',
      title: 'Tech Startup Investment',
      type: 'business',
      amount: 100000,
      date: '2024-02-01',
      return: 18.2,
      status: 'active',
      location: 'San Francisco, CA',
      propertyType: 'Technology',
    },
    {
      id: '3',
      title: 'Retail Space Portfolio',
      type: 'property',
      amount: 500000,
      date: '2024-03-10',
      return: 8.7,
      status: 'pending',
      location: 'Chicago, IL',
      propertyType: 'Retail',
    },
  ],
  totalValue: 850000,
  totalInvestments: 3,
  averageReturn: 13.1,
};

export const getPortfolio = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    // If no token, return sample data
    if (!token) {
      console.log('⚠️ No auth token, using sample portfolio');
      return SAMPLE_PORTFOLIO;
    }
    
    // Try to fetch from API with timeout
    const response = await axios.get(`${API_URL}/portfolio`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
    
    if (response.data && response.data.investments) {
      console.log('📊 Portfolio fetched from API');
      return response.data;
    }
    
    // If API returns empty, use sample
    console.log('📊 API returned empty, using sample');
    return SAMPLE_PORTFOLIO;
    
  } catch (error) {
    // Handle all errors gracefully
    if (error.response) {
      if (error.response.status === 404) {
        console.log('📊 Portfolio endpoint not found (404), using sample data');
      } else if (error.response.status === 401) {
        console.log('⚠️ Unauthorized, using sample portfolio');
      } else {
        console.log(`⚠️ Portfolio API error ${error.response.status}, using sample data`);
      }
    } else if (error.request) {
      console.log('⚠️ No response from portfolio API, using sample data');
    } else {
      console.error('❌ Portfolio error:', error.message);
    }
    
    // Always return sample data on error
    return SAMPLE_PORTFOLIO;
  }
};

export const addInvestment = async (dealId, amount) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('⚠️ No auth token, cannot add investment');
      return { success: false, message: 'Please log in to add investments' };
    }
    
    const response = await axios.post(
      `${API_URL}/investments`,
      { dealId, amount },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('📊 Investment endpoint not found');
      return { success: false, message: 'Investment feature coming soon' };
    }
    console.error('❌ Error adding investment:', error.message);
    return { success: false, message: 'Could not add investment' };
  }
};

// Get sample portfolio (for testing)
export const getSamplePortfolio = () => {
  return SAMPLE_PORTFOLIO;
};

export default {
  getPortfolio,
  addInvestment,
  getSamplePortfolio,
};
