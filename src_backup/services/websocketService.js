import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.userId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  init = async () => {
    try {
      this.userId = await AsyncStorage.getItem('userId');
      if (!this.userId) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          this.userId = user.id;
          await AsyncStorage.setItem('userId', this.userId);
        }
      }
    } catch (error) {
      console.error('Error getting userId:', error);
    }
  };

  connect = async () => {
    try {
      if (this.socket && this.isConnected) {
        console.log('🔗 WebSocket already connected');
        return this.socket;
      }

      await this.init();
      
      const token = await AsyncStorage.getItem('token');
      const API_URL = 'https://investbook-production.up.railway.app';
      
      // ✅ Only connect if we have a token
      if (!token) {
        console.log('⚠️ No token available, skipping WebSocket connection');
        return null;
      }
      
      console.log('🔗 Connecting to WebSocket...');
      
      this.socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('🔗 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.userId) {
          this.emit('user_connected', { userId: this.userId });
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        this.isConnected = false;
      });

      this.socket.on('new_message', (data) => {
        console.log('📩 New message received:', data);
        this.notifyListeners('new_message', data);
      });

      this.socket.on('typing_start', (data) => {
        this.notifyListeners('typing_start', data);
      });

      this.socket.on('typing_end', (data) => {
        this.notifyListeners('typing_end', data);
      });

      this.socket.on('message_read', (data) => {
        this.notifyListeners('message_read', data);
      });

      return this.socket;
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      return null;
    }
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected manually');
    }
  };

  emit = (event, data) => {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.log(`⚠️ Socket not connected, event not sent: ${event}`);
    }
  };

  on = (event, callback) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  };

  off = (event, callback) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  };

  notifyListeners = (event, data) => {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  };

  // Chat-specific methods
  sendMessage = (dealId, text, imageUrl = null) => {
    if (!this.isConnected) {
      console.log('⚠️ Socket not connected, message queued');
      // Store message to send later
      this.pendingMessages = this.pendingMessages || [];
      this.pendingMessages.push({ dealId, text, imageUrl });
      return;
    }
    this.emit('send_message', { dealId, text, imageUrl });
  };

  startTyping = (dealId) => {
    this.emit('typing_start', { dealId });
  };

  stopTyping = (dealId) => {
    this.emit('typing_end', { dealId });
  };

  markAsRead = (messageId, dealId) => {
    this.emit('message_read', { messageId, dealId });
  };

  joinDealChat = (dealId) => {
    if (!this.isConnected) {
      console.log('⚠️ Socket not connected, cannot join chat');
      return;
    }
    this.emit('join_deal_chat', { dealId });
  };

  leaveDealChat = (dealId) => {
    this.emit('leave_deal_chat', { dealId });
  };

  expressInterest = (dealId) => {
    this.emit('express_interest', { dealId });
  };
}

export default new WebSocketService();
