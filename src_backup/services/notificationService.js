import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Simple notification service that doesn't rely on expo-notifications
class NotificationService {
  constructor() {
    this.listener = null;
    this.notifications = [];
  }

  // Request permission (simplified)
  requestPermissions = async () => {
    // For web, we'll just return true
    if (Platform.OS === 'web') return true;
    
    // For native, we'll use a simpler approach
    try {
      // Check if we have permission
      const hasPermission = await AsyncStorage.getItem('notificationPermission');
      if (hasPermission === 'granted') return true;
      
      // In a real app, you'd use expo-notifications or react-native-push-notification
      // For now, we'll just return true
      await AsyncStorage.setItem('notificationPermission', 'granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return true;
    }
  };

  // Get push token (simplified)
  getPushToken = async () => {
    try {
      // Return a mock token for now
      return 'mock-push-token-' + Date.now();
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  };

  // Register device
  registerDevice = async (userId) => {
    try {
      const pushToken = await this.getPushToken();
      if (!pushToken) return false;

      // Save token to AsyncStorage
      await AsyncStorage.setItem('pushToken', pushToken);
      
      // Store user ID
      if (userId) {
        await AsyncStorage.setItem('userId', userId.toString());
      }

      return true;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  };

  // Send a notification (in-app alert)
  sendNotification = async (title, body, data = {}) => {
    try {
      // Show alert with title and body
      Alert.alert(title, body);
      
      // Store notification
      const notification = {
        id: Date.now(),
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      await this.saveNotification(notification);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  // Show in-app notification (uses Alert)
  showInAppNotification = (title, body) => {
    // Show as Alert
    Alert.alert(title, body);
    
    // Store it
    const notification = {
      id: Date.now(),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    this.saveNotification(notification);
    return notification;
  };

  // Save notification to local storage
  saveNotification = async (notification) => {
    try {
      const existing = await AsyncStorage.getItem('notifications');
      const notifications = existing ? JSON.parse(existing) : [];
      notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.pop();
      }
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      this.notifications = notifications;
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Get all notifications
  getNotifications = async () => {
    try {
      const existing = await AsyncStorage.getItem('notifications');
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  };

  // Mark notification as read
  markAsRead = async (notificationId) => {
    try {
      const existing = await AsyncStorage.getItem('notifications');
      if (!existing) return;
      
      const notifications = JSON.parse(existing);
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      this.notifications = updated;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Clear all notifications
  clearAll = async () => {
    try {
      await AsyncStorage.removeItem('notifications');
      this.notifications = [];
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Get unread count
  getUnreadCount = async () => {
    try {
      const existing = await AsyncStorage.getItem('notifications');
      if (!existing) return 0;
      
      const notifications = JSON.parse(existing);
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  };

  // Add listener (simplified)
  addNotificationListener = (callback) => {
    this.listener = callback;
    return { remove: () => { this.listener = null; } };
  };

  // Remove listener
  removeNotificationListener = () => {
    this.listener = null;
  };
}

export default new NotificationService();
