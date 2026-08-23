import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { withSubscription, ACCESS_TYPES } from '../components/SubscriptionGuard';

function ChatHubScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Icon name="chatbubbles-outline" size={64} color="#2563eb" />
        <Text style={styles.title}>Deal conversations</Text>
        <Text style={styles.copy}>Choose a listing to join its investor discussion, read existing messages, or start a new conversation.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Deals')}>
          <Text style={styles.buttonText}>Browse Deals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default withSubscription(ChatHubScreen, ACCESS_TYPES.CHAT);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700', marginTop: 18 },
  copy: { color: '#4b5563', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10, maxWidth: 350 },
  button: { marginTop: 28, backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
