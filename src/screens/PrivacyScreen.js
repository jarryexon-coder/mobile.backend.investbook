import React from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIVACY_URL = 'https://api.invest-book.com/privacy';

export default function PrivacyScreen() {
  const openPolicy = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch {
      Alert.alert('Unable to open privacy policy', 'Please visit api.invest-book.com/privacy.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy & Data</Text>
        <Text style={styles.copy}>InvestBook collects the account information you provide, your in-app activity, and content you submit to operate the service and keep the community safe.</Text>
        <Text style={styles.copy}>We use service providers for hosting, payments, and listing data. We do not sell personal information. Your data is retained only as long as needed for the service, legal obligations, and fraud prevention.</Text>
        <Text style={styles.copy}>You can withdraw consent for optional communications in your device or account settings. You can permanently delete your account and associated personal data from Profile.</Text>
        <TouchableOpacity style={styles.button} onPress={openPolicy}>
          <Text style={styles.buttonText}>Read Full Privacy Policy</Text>
        </TouchableOpacity>
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Privacy questions</Text>
          <Text style={styles.copy}>Email privacy@invest-book.com for help with privacy or data requests.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, gap: 18 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  copy: { fontSize: 16, lineHeight: 24, color: '#374151' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contactBox: { marginTop: 8, padding: 16, borderRadius: 10, backgroundColor: '#f3f4f6' },
  contactTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#111827' },
});
