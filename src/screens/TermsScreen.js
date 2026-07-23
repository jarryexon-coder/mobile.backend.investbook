import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TERMS_VERSION = '1.0.0';

export default function TermsScreen({ navigation, route }) {
  const { onAccept } = route.params || {};
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      // Save acceptance to AsyncStorage
      await AsyncStorage.setItem('termsAccepted', 'true');
      await AsyncStorage.setItem('termsVersion', TERMS_VERSION);
      await AsyncStorage.setItem('termsAcceptedDate', new Date().toISOString());
      
      if (onAccept) {
        onAccept();
      } else {
        // Navigate to main app
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
      Alert.alert('Error', 'Failed to save acceptance. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📋 Terms of Service</Text>
          <Text style={styles.headerSubtitle}>Please read and accept to continue</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.sectionText}>
              Welcome to InvestBook. By using our platform, you agree to these terms and conditions. 
              InvestBook connects investors with investment opportunities including real estate, businesses, 
              and other assets.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. User Agreement</Text>
            <Text style={styles.sectionText}>
              By using InvestBook, you agree to:
            </Text>
            <Text style={styles.bulletPoint}>• Provide accurate and truthful information</Text>
            <Text style={styles.bulletPoint}>• Use the platform for lawful purposes only</Text>
            <Text style={styles.bulletPoint}>• Not engage in fraudulent or deceptive activities</Text>
            <Text style={styles.bulletPoint}>• Respect the privacy and rights of other users</Text>
            <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Investment Risks</Text>
            <Text style={styles.sectionText}>
              All investments carry risk. You acknowledge that:
            </Text>
            <Text style={styles.bulletPoint}>• Past performance does not guarantee future results</Text>
            <Text style={styles.bulletPoint}>• You may lose some or all of your investment</Text>
            <Text style={styles.bulletPoint}>• You are responsible for your own investment decisions</Text>
            <Text style={styles.bulletPoint}>• You should consult with financial advisors before investing</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Privacy Policy</Text>
            <Text style={styles.sectionText}>
              We collect and use your data as described in our Privacy Policy:
            </Text>
            <Text style={styles.bulletPoint}>• Personal information (name, email, phone)</Text>
            <Text style={styles.bulletPoint}>• Investment preferences and activity</Text>
            <Text style={styles.bulletPoint}>• Device information for app functionality</Text>
            <Text style={styles.bulletPoint}>• We do not sell your personal data</Text>
            <Text style={styles.bulletPoint}>• You can request data deletion at any time</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
            <Text style={styles.sectionText}>
              All content on InvestBook, including listings, data, and designs, is protected by 
              intellectual property laws. You may not copy, distribute, or reproduce any content 
              without explicit permission.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              InvestBook acts as a platform connecting users with investment opportunities. 
              We do not guarantee the accuracy of listings or the success of any investment. 
              You agree to hold InvestBook harmless from any losses or damages.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Termination</Text>
            <Text style={styles.sectionText}>
              We reserve the right to terminate or suspend your account for violations of these terms, 
              fraudulent activity, or any other reason at our sole discretion.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We may update these terms from time to time. Continued use of the platform constitutes 
              acceptance of the updated terms. You will be notified of significant changes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Information</Text>
            <Text style={styles.sectionText}>
              For questions or concerns regarding these terms, please contact us at:
            </Text>
            <Text style={styles.contactText}>📧 support@investbook.com</Text>
            <Text style={styles.contactText}>📞 1-800-829-4933</Text>
            <Text style={styles.contactText}>📍 6595 Roswell Road, Suite G, PMB 5845</Text>
            <Text style={styles.contactText}>   Sandy Springs, GA 30328</Text>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {TERMS_VERSION}</Text>
            <Text style={styles.versionText}>Last Updated: {new Date().toLocaleDateString()}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]} 
            onPress={() => {
              Alert.alert(
                'Terms Required',
                'You must accept the Terms of Service to use InvestBook.',
                [
                  { 
                    text: 'Accept', 
                    onPress: () => setAccepted(true) 
                  },
                  { 
                    text: 'Exit', 
                    style: 'cancel',
                    onPress: () => {
                      // Handle exit - close app or go back
                      Alert.alert('Exit', 'Are you sure you want to exit the app?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Exit', onPress: () => {
                          // For React Native, this will close the app
                          // Note: This might not work in all environments
                          if (navigation.canGoBack()) {
                            navigation.popToTop();
                          }
                        } }
                      ]);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={handleAccept}
          >
            <Text style={[styles.buttonText, styles.acceptButtonText]}>✅ Accept & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 22,
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 22,
    paddingLeft: 12,
    marginTop: 2,
  },
  contactText: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 22,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#2563eb',
    flex: 2,
  },
  declineButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  acceptButtonText: {
    color: '#ffffff',
  },
});
