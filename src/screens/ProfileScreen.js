import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // ✅ No navigation needed! The app will automatically switch to Login screen
            // because user state becomes null in AuthContext
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="person-circle" size={80} color="#2563eb" />
        <Text style={styles.name}>{user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="person-outline" size={24} color="#1a1a1a" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="settings-outline" size={24} color="#1a1a1a" />
          <Text style={styles.menuText}>Settings</Text>
          <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Icon name="notifications-outline" size={24} color="#1a1a1a" />
          <Text style={styles.menuText}>Notifications</Text>
          <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]} 
          onPress={handleLogout}
        >
          <Icon name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          <Icon name="chevron-forward" size={20} color="#999" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>InvestBook v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menu: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  logoutText: {
    color: '#ef4444',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  version: {
    color: '#999',
    fontSize: 12,
  },
});
