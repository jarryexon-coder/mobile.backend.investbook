import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';

const API_URL = 'https://investbook-production.up.railway.app/api';

export default function CreateDealScreen({ navigation, route }) {
  const { property } = route.params || {};
  const { token, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [enableChat, setEnableChat] = useState(true);
  const [inviteUsers, setInviteUsers] = useState('');
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    amount: property?.price?.toString() || '',
    location: property?.location || property?.address || '',
    propertyType: property?.propertyType || '',
    asset_type: property?.propertyType || 'property', // ✅ Add asset_type
    min_investment: '',
    expected_roi: '',
    dealType: 'investment',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || isNaN(formData.amount)) newErrors.amount = 'Valid amount is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.asset_type.trim()) newErrors.asset_type = 'Asset type is required';
    if (!formData.min_investment || isNaN(formData.min_investment)) newErrors.min_investment = 'Valid min investment is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateDeal = async () => {
    if (!validateForm()) return;

    // Get fresh token from storage
    const freshToken = await AsyncStorage.getItem('token');
    
    if (!freshToken) {
      Alert.alert('Error', 'Please login again to create a deal.');
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    try {
      const dealData = {
        title: formData.title,
        description: formData.description,
        asset_type: formData.asset_type, // ✅ Required field
        total_price: parseFloat(formData.amount),
        min_investment: parseFloat(formData.min_investment || formData.amount * 0.1),
        location: formData.location,
        expected_roi: formData.expected_roi || '10-15%',
      };

      console.log('📦 Sending deal data:', dealData);

      const response = await axios.post(
        `${API_URL}/deals`,
        dealData,
        {
          headers: { 
            'Authorization': `Bearer ${freshToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.deal_id) {
        Alert.alert(
          'Success',
          'Deal created successfully!',
          [
            { text: 'View Deals', onPress: () => navigation.navigate('Deals') },
            { 
              text: 'Start Chat', 
              onPress: () => navigation.navigate('Chat', { 
                dealId: response.data.deal_id, 
                dealTitle: formData.title 
              }) 
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.');
        await logout();
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to create deal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Deal</Text>
        {property && (
          <Text style={styles.subtitle}>Based on: {property.title}</Text>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deal Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Enter deal title"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            placeholder="Describe the deal..."
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Asset Type *</Text>
          <TextInput
            style={[styles.input, errors.asset_type && styles.inputError]}
            placeholder="e.g., property, vehicle, business"
            value={formData.asset_type}
            onChangeText={(text) => setFormData({ ...formData, asset_type: text })}
          />
          {errors.asset_type && <Text style={styles.errorText}>{errors.asset_type}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Total Price *</Text>
          <TextInput
            style={[styles.input, errors.amount && styles.inputError]}
            placeholder="Enter total price"
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="numeric"
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Investment *</Text>
          <TextInput
            style={[styles.input, errors.min_investment && styles.inputError]}
            placeholder="Enter minimum investment"
            value={formData.min_investment}
            onChangeText={(text) => setFormData({ ...formData, min_investment: text })}
            keyboardType="numeric"
          />
          {errors.min_investment && <Text style={styles.errorText}>{errors.min_investment}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            placeholder="Enter location"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
          />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Expected ROI</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10-15%"
            value={formData.expected_roi}
            onChangeText={(text) => setFormData({ ...formData, expected_roi: text })}
          />
        </View>

        <View style={styles.chatSettings}>
          <Text style={styles.sectionTitle}>Chat Settings</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Chat</Text>
            <Switch
              value={enableChat}
              onValueChange={setEnableChat}
              trackColor={{ false: '#767577', true: '#2563eb' }}
              thumbColor={enableChat ? '#f5f5f5' : '#f4f3f4'}
            />
          </View>

          {enableChat && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Invite Users (comma separated emails)</Text>
              <TextInput
                style={styles.input}
                placeholder="investor@example.com, partner@example.com"
                value={inviteUsers}
                onChangeText={setInviteUsers}
              />
              <Text style={styles.hint}>
                Users you invite will be able to join the chat and express interest
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleCreateDeal}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Create Deal</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  chatSettings: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
