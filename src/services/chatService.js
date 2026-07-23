import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://investbook-production.up.railway.app/api';

// For real-time chat, you would use WebSocket or Socket.io
// This is a service for the chat functionality

export const chatService = {
  // Get messages for a deal
  getMessages: async (dealId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/deals/${dealId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (dealId, text) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/deals/${dealId}/messages`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Check if chat is enabled for a deal
  isChatEnabled: async (dealId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/deals/${dealId}/chat-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.enabled;
    } catch (error) {
      console.error('Error checking chat status:', error);
      return true; // Default to enabled
    }
  },
};

export default chatService;
