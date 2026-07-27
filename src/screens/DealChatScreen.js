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
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';
import { EXPO_PUBLIC_API_URL } from '@env';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

const API_URL = EXPO_PUBLIC_API_URL || 'https://investbook-production.up.railway.app/api';

// Chat Message Component
const ChatMessage = ({ message, isOwn, isSystem }) => {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSystem) {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
      {!isOwn && (
        <Text style={styles.messageUsername}>{message.username}</Text>
      )}
      <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {message.message}
        </Text>
        <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
          {time}
        </Text>
      </View>
    </View>
  );
};

function DealChatScreen({ route, navigation }) {
  const { dealId, dealTitle, deal } = route.params || {};
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const flatListRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // ===== DEBUG LOGS =====
  console.log('💬 DealChatScreen mounted');
  console.log('   route.params:', route.params);
  console.log('   dealId:', dealId);
  console.log('   dealTitle:', dealTitle);
  console.log('   user:', user?.username);
  console.log('   token exists:', !!token);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔌 Initializing socket connection...');
    console.log('   API_URL:', API_URL);
    
    const newSocket = io(API_URL.replace('/api', ''), {
      transports: ['websocket'],
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Join the deal chat room
      if (dealId && user) {
        console.log(`📡 Joining chat room for deal ${dealId}`);
        newSocket.emit('join_deal_chat_room', {
          deal_id: dealId,
          user_id: user.id,
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('⚠️ WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (dealId && user && newSocket.connected) {
        newSocket.emit('leave_deal_chat_room', {
          deal_id: dealId,
          user_id: user.id,
        });
      }
      newSocket.disconnect();
    };
  }, [dealId, user, token]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not initialized yet');
      return;
    }

    console.log('📡 Setting up socket event listeners...');

    // New message received
    socket.on('new_chat_message', (data) => {
      console.log('📩 New message received:', data);
      if (data.deal_id === dealId) {
        console.log('✅ Message for current deal, adding to list');
        setMessages((prev) => [...prev, data.message]);
        if (data.message.participant_count) {
          setParticipantCount(data.message.participant_count);
        }
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    // User joined
    socket.on('user_joined', (data) => {
      console.log('👤 User joined:', data);
      if (data.deal_id === dealId) {
        fetchParticipants();
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            user_id: 0,
            username: 'System',
            message: `${data.user.username} joined the chat`,
            created_at: new Date().toISOString(),
            is_system: true,
          },
        ]);
      }
    });

    // User typing
    socket.on('user_typing', (data) => {
      if (data.deal_id === dealId && data.username !== user?.username) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((name) => name !== data.username));
        }, 3000);
      }
    });

    // Participant count update
    socket.on('participant_count', (data) => {
      if (data.deal_id === dealId) {
        console.log('👥 Participant count updated:', data.count);
        setParticipantCount(data.count);
      }
    });

    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      socket.off('new_chat_message');
      socket.off('user_joined');
      socket.off('user_typing');
      socket.off('participant_count');
    };
  }, [socket, dealId, user]);

  // Fetch messages and participants
  const fetchMessages = async () => {
    console.log(`📥 Fetching messages for deal ${dealId}...`);
    try {
      const response = await fetch(`${API_URL}/deals/${dealId}/chat/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Fetched ${data.length} messages`);
        setMessages(data);
      } else {
        console.log(`⚠️ Failed to fetch messages: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    console.log(`📥 Fetching participants for deal ${dealId}...`);
    try {
      const response = await fetch(`${API_URL}/deals/${dealId}/chat/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Fetched ${data.length} participants`);
        setParticipants(data);
        setParticipantCount(data.length);
      }
    } catch (error) {
      console.error('❌ Error fetching participants:', error);
    }
  };

  // Join chat
  const joinChat = async () => {
    console.log(`📡 Joining chat for deal ${dealId}...`);
    try {
      const response = await fetch(`${API_URL}/deals/${dealId}/chat/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Joined chat successfully:', data);
      } else {
        console.log(`⚠️ Failed to join chat: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error joining chat:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🔄 Loading chat data...');
    const loadData = async () => {
      setLoading(true);
      await joinChat();
      await Promise.all([fetchMessages(), fetchParticipants()]);
      setLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    };
    
    if (dealId && token) {
      loadData();
    } else {
      console.log('⚠️ Missing dealId or token, cannot load chat');
      if (!dealId) console.log('   dealId is missing');
      if (!token) console.log('   token is missing');
      setLoading(false);
    }
  }, [dealId, token]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) {
      console.log('⚠️ Cannot send empty message');
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    
    console.log(`📤 Sending message: "${messageText}"`);

    try {
      const response = await fetch(`${API_URL}/deals/${dealId}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully:', data);
        // Add message optimistically
        const newMessage = {
          ...data,
          username: user?.username || 'You',
        };
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to send message: ${response.status} - ${errorText}`);
        Alert.alert('Error', 'Failed to send message');
        setInputText(messageText);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text) => {
    setInputText(text);
    
    if (text.length > 0 && !sending && socket?.connected) {
      socket.emit('deal_chat_typing', {
        deal_id: dealId,
        username: user?.username,
      });
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.user_id === user?.id;
    const isSystem = item.is_system || item.user_id === 0;
    return (
      <ChatMessage 
        message={item} 
        isOwn={isOwn}
        isSystem={isSystem}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.join(', ');
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.length === 1 ? `${names} is typing...` : `${names} are typing...`}
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

  if (!dealId) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Invalid Deal</Text>
        <Text style={styles.errorSubtext}>No deal ID provided</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {dealTitle || 'Deal Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            {isConnected ? ' • 🟢 Online' : ' • 🔴 Offline'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.participantsButton}
          onPress={() => {
            Alert.alert(
              'Participants',
              participants.map(p => `• ${p.username}`).join('\n') || 'No participants yet'
            );
          }}
        >
          <Icon name="people" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id?.toString() || `msg-${index}`}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderTypingIndicator}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
          </View>
        }
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
            onChangeText={handleTyping}
            multiline
            maxLength={1000}
            editable={!sending && isConnected}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending || !isConnected) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending || !isConnected}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>⚠️ Reconnecting...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Export with subscription guard for CHAT access
export default withSubscription(DealChatScreen, ACCESS_TYPES.CHAT);

const styles = StyleSheet.create({
  safeArea: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  participantsButton: {
    padding: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  ownBubble: {
    backgroundColor: '#2563eb',
  },
  otherBubble: {
    backgroundColor: '#e5e5e5',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: '#999',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 4,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  typingContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
    padding: 4,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#92400e',
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
