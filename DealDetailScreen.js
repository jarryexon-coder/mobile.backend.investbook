import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { io } from 'socket.io-client';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DealDetailScreen({ route, navigation }) {
  const { dealId } = route.params;
  const { user, API } = useAuth();
  const [deal, setDeal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInterested, setIsInterested] = useState(false);
  const socketRef = useRef(null);
  const scrollViewRef = useRef();

  useEffect(() => {
    fetchDeal();
    setupSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchDeal = async () => {
    try {
      const response = await axios.get(`${API}/api/deals`);
      const found = response.data.find(d => d.id === parseInt(dealId));
      setDeal(found);
    } catch (error) {
      Alert.alert('Error', 'Failed to load deal');
    }
  };

  const setupSocket = () => {
    socketRef.current = io(API);
    socketRef.current.emit('join_deal_chat', { deal_id: dealId });
    socketRef.current.on('message', (data) => {
      setMessages(prev => [...prev, data]);
    });
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('deal_chat_message', {
        deal_id: dealId,
        username: user.username,
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const handleInterest = async () => {
    try {
      await axios.post(`${API}/api/deals/${dealId}/interest`, {}, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      setIsInterested(true);
      Alert.alert('Success', 'Interest expressed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to express interest');
    }
  };

  if (!deal) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>{deal.title}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.price}>${deal.total_price.toLocaleString()}</Text>
            <View style={[styles.statusBadge, 
              { backgroundColor: deal.status === 'open' ? '#d1fae5' : '#fef3c7' }
            ]}>
              <Text style={styles.statusText}>{deal.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>{deal.description}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Minimum:</Text>
            <Text>${deal.min_investment.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Asset:</Text>
            <Text>{deal.asset_type}</Text>
          </View>
          {deal.expected_roi && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>ROI:</Text>
              <Text style={styles.roi}>{deal.expected_roi}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Sponsor:</Text>
            <Text>{deal.sponsor_username}</Text>
          </View>
        </View>

        {!isInterested && deal.status === 'open' && (
          <TouchableOpacity style={styles.interestButton} onPress={handleInterest}>
            <Text style={styles.buttonText}>Express Interest</Text>
          </TouchableOpacity>
        )}

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>💬 Deal Chat</Text>
          <View style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <View key={idx} style={styles.messageBubble}>
                <Text style={styles.messageUser}>{msg.user || 'System'}</Text>
                <Text>{msg.message}</Text>
              </View>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Icon name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 12, flex: 1 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  price: { fontSize: 24, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontWeight: '600', fontSize: 12 },
  description: { color: '#4b5563', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontWeight: '600', color: '#6b7280' },
  roi: { color: '#16a34a', fontWeight: 'bold' },
  interestButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 12, marginBottom: 16 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  chatSection: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  chatTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  messagesContainer: { height: 200, marginBottom: 12 },
  messageBubble: { backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 6 },
  messageUser: { fontWeight: 'bold', fontSize: 12, color: '#2563eb' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10 },
  sendButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, justifyContent: 'center' },
});
