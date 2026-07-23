import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import webSocketService from '../services/websocketService';
import notificationService from '../services/notificationService';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function ChatScreen({ navigation, route }) {
  const { dealId, dealTitle } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => cleanup();
  }, [dealId]);

  const initializeChat = async () => {
    await fetchMessages();
    await connectWebSocket();
  };

const connectWebSocket = async () => {
  try {
    const socket = await webSocketService.connect();
    if (socket && webSocketService.isConnected) {
      setIsConnected(true);
      webSocketService.joinDealChat(dealId);
      
      webSocketService.on('new_message', handleNewMessage);
      webSocketService.on('typing_start', handleTypingStart);
      webSocketService.on('typing_end', handleTypingEnd);
      webSocketService.on('message_read', handleMessageRead);
    } else {
      console.log('⚠️ WebSocket connection not established');
      setIsConnected(false);
    }
  } catch (error) {
    console.error('❌ WebSocket connection failed:', error);
    setIsConnected(false);
  }
};

const cleanup = () => {
  webSocketService.off('new_message', handleNewMessage);
  webSocketService.off('typing_start', handleTypingStart);
  webSocketService.off('typing_end', handleTypingEnd);
  webSocketService.off('message_read', handleMessageRead);
  if (isConnected) {
    webSocketService.leaveDealChat(dealId);
  }
  webSocketService.disconnect();
};

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/deals/${dealId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Mock messages for demo
      setMessages([
        {
          id: 1,
          userId: 'user1',
          username: 'Investor1',
          text: 'Interested in this deal. Can we discuss?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true,
        },
        {
          id: 2,
          userId: 'user2',
          username: 'Seller',
          text: 'Yes, happy to connect. Let me know your questions.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.dealId === dealId) {
      setMessages(prev => [...prev, data.message]);
      // Mark message as read
      webSocketService.markAsRead(data.message.id, dealId);
      // Send notification if not in chat
      if (!isConnected) {
        notificationService.showInAppNotification(
          'New Message',
          `${data.message.username}: ${data.message.text}`
        );
      }
    }
  };

  const handleTypingStart = (data) => {
    if (data.dealId === dealId && data.userId !== 'me') {
      setTypingUsers(prev => [...prev, data.username]);
    }
  };

  const handleTypingEnd = (data) => {
    if (data.dealId === dealId) {
      setTypingUsers(prev => prev.filter(name => name !== data.username));
    }
  };

  const handleMessageRead = (data) => {
    if (data.dealId === dealId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, read: true } : msg
        )
      );
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    setSending(true);
    const messageText = inputText.trim();
    setInputText('');

    try {
      const token = await AsyncStorage.getItem('token');
      
      // Prepare message data
      const messageData = {
        text: messageText,
        image: selectedImage,
      };

      // Send via WebSocket
      webSocketService.sendMessage(dealId, messageText, selectedImage);

      // Also save to server
      const response = await axios.post(
        `${API_URL}/deals/${dealId}/messages`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMessage = {
        id: response.data.id || Date.now(),
        userId: 'me',
        username: 'You',
        text: messageText,
        image: selectedImage,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      setMessages(prev => [...prev, newMessage]);
      flatListRef.current?.scrollToEnd({ animated: true });
      setSelectedImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add message locally if API fails
      const newMessage = {
        id: Date.now(),
        userId: 'me',
        username: 'You',
        text: messageText,
        image: selectedImage,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, newMessage]);
      setSelectedImage(null);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    // Send typing indicator
    if (text.trim()) {
      webSocketService.startTyping(dealId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        webSocketService.stopTyping(dealId);
      }, 2000);
    } else {
      webSocketService.stopTyping(dealId);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].base64);
      setShowImagePicker(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].base64);
      setShowImagePicker(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.userId === 'me' || item.username === 'You';
    return (
      <View style={[styles.messageWrapper, isMe && styles.messageWrapperRight]}>
        <View style={[styles.messageBubble, isMe && styles.messageBubbleRight]}>
          <Text style={styles.messageUsername}>{item.username}</Text>
          {item.image && (
            <Image 
              source={{ uri: `data:image/jpeg;base64,${item.image}` }}
              style={styles.messageImage}
            />
          )}
          {item.text ? (
            <Text style={[styles.messageText, isMe && styles.messageTextRight]}>
              {item.text}
            </Text>
          ) : null}
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Icon 
                name={item.read ? 'checkmark-done' : 'checkmark'} 
                size={14} 
                color={item.read ? '#2563eb' : '#999'} 
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dealTitle || 'Chat'}</Text>
        <TouchableOpacity onPress={() => setShowImagePicker(true)} style={styles.headerButton}>
          <Icon name="image-outline" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image 
            source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
            style={styles.previewImage}
          />
          <TouchableOpacity 
            style={styles.removeImage}
            onPress={() => setSelectedImage(null)}
          >
            <Icon name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={(!inputText.trim() && !selectedImage) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Image</Text>
            <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
              <Icon name="camera" size={24} color="#2563eb" />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Icon name="images" size={24} color="#2563eb" />
              <Text style={styles.modalButtonText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageWrapperRight: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubbleRight: {
    backgroundColor: '#2563eb',
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  messageTextRight: {
    color: 'white',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginRight: 4,
  },
  readReceipt: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  typingContainer: {
    padding: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  removeImage: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  cancelButton: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
});
