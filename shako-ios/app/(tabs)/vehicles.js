import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  useColorScheme,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllVehicles, getVehicleImageUrls } from '../../services/vehiclesService';
import AddVehicleModal from '../../components/AddVehicleModal';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark);

  const loadVehicles = async () => {
    try {
      const data = await getAllVehicles(user.id);
      setVehicles(data.filter(v => !v.archived));
      const paths = data.filter(v => v.image_url).map(v => v.image_url);
      if (paths.length > 0) {
        const urls = await getVehicleImageUrls(paths);
        setImageUrls(urls);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadVehicles();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  }, [user]);

  const renderVehicle = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      {item.image_url && imageUrls[item.image_url] && (
        <Image source={{ uri: imageUrls[item.image_url] }} style={styles.image} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.nickname || item.name}</Text>
        {item.nickname && item.name && (
          <Text style={styles.subtitle}>{item.name}</Text>
        )}
        <View style={styles.badges}>
          {item.year && <View style={styles.badge}><Text style={styles.badgeText}>{item.year}</Text></View>}
          {item.license_plate && <View style={styles.badge}><Text style={styles.badgeText}>{item.license_plate}</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtitle}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="car-outline" size={64} color="#9ca3af" />
            <Text style={[styles.subtitle, { marginTop: 16 }]}>No vehicles yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => { setShowAddModal(false); loadVehicles(); }}
        isDark={isDark}
      />
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardContent: { padding: 16 },
  image: { width: '100%', height: 160 },
  title: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#111' },
  subtitle: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 },
  badges: { flexDirection: 'row', marginTop: 8, gap: 8 },
  badge: { backgroundColor: isDark ? '#374151' : '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, color: isDark ? '#d1d5db' : '#4b5563' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#3b82f6', borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
});
