import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import axios from 'axios';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_API_URL } from '@env';

const API_URL = EXPO_PUBLIC_API_URL;

export default function ChatScreen({ route, navigation }) {
  const { dealId, dealTitle, userId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);

  // Normalize the deal ID - could be a string ID, propertyId, or listing_id
  const chatDealId = dealId ? String(dealId) : null;

  // Check if this is a mock deal
  const isMockDeal = chatDealId && 
                     (chatDealId.startsWith('mock-') || 
                      chatDealId.startsWith('item-') ||
                      chatDealId === 'undefined' ||
                      chatDealId === 'null');

  useEffect(() => {
    // If it's a mock deal or no ID, show a friendly message
    if (isMockDeal || !chatDealId) {
      Alert.alert(
        'Chat Unavailable',
        'Chat is only available for real listings. Please select a valid listing to chat about.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
      setLoading(false);
      return;
    }

    console.log(`💬 Opening chat for deal: ${chatDealId} (${dealTitle || 'Untitled'})`);
    
    fetchMessages();
    setupWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 WebSocket disconnected');
      }
    };
  }, [chatDealId]);

  const setupWebSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const socketUrl = API_URL.replace('/api', '');
      
      console.log('🔗 Connecting to WebSocket at:', socketUrl);
      
      const newSocket = io(socketUrl, {
        transports: ['websocket'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        newSocket.emit('join_deal_chat', { deal_id: chatDealId });
      });

      newSocket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
      });

      newSocket.on('new_message', (data) => {
        console.log('📩 New message received:', data);
        if (data.deal_id === chatDealId) {
          setMessages(prev => [...prev, data.message]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      newSocket.on('connect_error', (error) => {
        console.log('⚠️ WebSocket connection error:', error.message);
        setIsConnected(false);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('WebSocket setup error:', error);
      setIsConnected(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('⚠️ No token found, redirecting to login');
        Alert.alert(
          'Login Required',
          'Please login to access chat.',
          [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
        );
        setLoading(false);
        return;
      }

      console.log(`📥 Fetching messages for deal ${chatDealId}...`);
      const response = await axios.get(`${API_URL}/deals/${chatDealId}/messages`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setMessages(response.data || []);
      console.log(`✅ Fetched ${response.data?.length || 0} messages`);
    } catch (error) {
      console.log('⚠️ Error fetching messages:', error.message);
      if (error.response?.status === 401) {
        console.log('🔑 Authentication required');
        Alert.alert(
          'Session Expired',
          'Please login again.',
          [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
        );
      } else if (error.response?.status === 404) {
        console.log('📭 No messages found for this deal yet');
        setMessages([]);
      } else {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add this function to sync the deal with the backend
  const syncDealWithBackend = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to sync this deal.');
        return false;
      }
      
      console.log('🔄 Syncing deal with backend...');
      const response = await axios.post(
        `${API_URL}/deals/sync`,
        {
          dealId: chatDealId,
          dealData: {
            title: dealTitle || route.params?.title || 'Untitled Deal',
            price: route.params?.price || 0,
            location: route.params?.location || '',
            propertyType: route.params?.propertyType || 'Commercial'
          }
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        console.log('✅ Deal synced successfully');
        return true;
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.log('❌ Failed to sync deal:', error.message);
      Alert.alert(
        'Sync Failed', 
        'Unable to sync deal with the chat system. Please try again later.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please wait while we reconnect to the chat server.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to send messages.');
        return;
      }

      const message = inputText.trim();

      // Use the chatDealId (which is the original deal ID from the listing)
      const response = await axios.post(
        `${API_URL}/deals/${chatDealId}/messages`,
        { message },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        setInputText('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.log('⚠️ Error sending message:', error.message);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.', [
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]);
      } else if (error.response?.status === 404) {
        // Try to sync the deal first
        console.log('🔄 Deal not found, syncing...');
        const synced = await syncDealWithBackend();
        // After syncing, try to send again
        if (synced) {
          console.log('🔄 Deal synced, retrying message...');
          // Retry sending the message
          setTimeout(() => {
            sendMessage();
          }, 500);
        }
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.user_id === userId;
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        {!isOwnMessage && (
          <Text style={styles.messageUsername}>{item.username || 'User'}</Text>
        )}
        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {dealTitle || 'Chat'}
            {!isConnected && ' 🔴'}
            {isConnected && ' 🟢'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendButtonText}>📤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ownMessage: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  ownMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#2563eb',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 20,
    color: 'white',
  },
});
