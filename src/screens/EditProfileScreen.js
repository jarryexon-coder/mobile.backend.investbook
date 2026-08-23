import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanUsername || !cleanEmail) {
      Alert.alert('Missing information', 'Enter both a display name and email address.');
      return;
    }

    setSaving(true);
    const result = await updateUser({ username: cleanUsername, email: cleanEmail, bio: bio.trim() });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Profile not updated', result.message);
      return;
    }
    Alert.alert('Profile updated', 'Your account information has been saved.', [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Edit Profile</Text>
          <Text style={styles.description}>Keep your account information up to date.</Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="words" maxLength={80} />

          <Text style={styles.label}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" maxLength={120} />

          <Text style={styles.label}>About you (optional)</Text>
          <TextInput value={bio} onChangeText={setBio} style={[styles.input, styles.bio]} multiline maxLength={500} textAlignVertical="top" />

          <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111827' },
  description: { color: '#4b5563', fontSize: 15, marginTop: 6, marginBottom: 28 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 13, color: '#111827', fontSize: 16, backgroundColor: '#fff' },
  bio: { height: 116 },
  saveButton: { marginTop: 30, backgroundColor: '#2563eb', borderRadius: 10, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
