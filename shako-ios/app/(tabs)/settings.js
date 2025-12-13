import { View, Text, TouchableOpacity, useColorScheme, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb', paddingTop: 12, marginTop: 12 }]}>
            <Text style={styles.label}>Theme</Text>
            <Text style={styles.value}>{isDark ? 'Dark' : 'Light'} (System)</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Shako - Vehicle Parts Tracker</Text>
      </View>
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '500', color: isDark ? '#9ca3af' : '#6b7280', marginLeft: 16, marginBottom: 8 },
  card: { backgroundColor: isDark ? '#1f2937' : '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },
  value: { fontSize: 14, fontWeight: '500', color: isDark ? '#fff' : '#111', marginTop: 4 },
  signOutButton: { marginHorizontal: 16, marginTop: 24, backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
  footer: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  footerText: { fontSize: 12, color: isDark ? '#4b5563' : '#9ca3af' },
});
