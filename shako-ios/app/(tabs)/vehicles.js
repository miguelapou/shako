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
import { getAllProjects } from '../../services/projectsService';
import AddVehicleModal from '../../components/AddVehicleModal';
import VehicleDetailModal from '../../components/VehicleDetailModal';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const loadData = async () => {
    try {
      const [vehicleData, projectData] = await Promise.all([
        getAllVehicles(user.id),
        getAllProjects(user.id),
      ]);
      setVehicles(vehicleData.filter(v => !v.archived));
      setProjects(projectData);

      const paths = vehicleData.filter(v => v.image_url).map(v => v.image_url);
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
    if (user) loadData();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  const getVehicleProjectCount = (vehicleId) => {
    return projects.filter(p => p.vehicle_id === vehicleId && !p.archived).length;
  };

  const getBorderColor = (color) => {
    if (!color) return '#3b82f6'; // default blue
    return color;
  };

  const renderVehicle = ({ item }) => {
    const projectCount = getVehicleProjectCount(item.id);
    const borderColor = getBorderColor(item.color);

    return (
      <TouchableOpacity
        style={[styles.card, { borderTopColor: borderColor }]}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedVehicle(item);
          setShowDetailModal(true);
        }}
      >
        {/* Vehicle Image */}
        {item.image_url && imageUrls[item.image_url] ? (
          <Image source={{ uri: imageUrls[item.image_url] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={32} color={isDark ? '#4b5563' : '#9ca3af'} />
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Vehicle Name */}
          <Text style={styles.title}>{item.nickname || item.name}</Text>

          {/* Year/Make/Model badge if nickname exists */}
          {item.nickname && (
            <View style={[styles.colorBadge, { backgroundColor: item.color || '#3b82f6' }]}>
              <Text style={styles.colorBadgeText}>
                {[item.year, item.make, item.name].filter(Boolean).join(' ')}
              </Text>
            </View>
          )}

          {/* Info Row */}
          <View style={styles.infoRow}>
            {/* Projects count */}
            <View style={styles.infoItem}>
              <Ionicons name="folder-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.infoText}>
                {projectCount} {projectCount === 1 ? 'project' : 'projects'}
              </Text>
            </View>

            {/* Year if no nickname */}
            {!item.nickname && item.year && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.year}</Text>
              </View>
            )}

            {/* License Plate */}
            {item.license_plate && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.license_plate}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading vehicles...</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first vehicle</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Modal */}
      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => { setShowAddModal(false); loadData(); }}
        isDark={isDark}
      />

      {/* Detail Modal */}
      <VehicleDetailModal
        visible={showDetailModal}
        vehicle={selectedVehicle}
        imageUrl={selectedVehicle?.image_url ? imageUrls[selectedVehicle.image_url] : null}
        onClose={() => { setShowDetailModal(false); setSelectedVehicle(null); }}
        onUpdate={loadData}
        isDark={isDark}
      />
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f3f4f6'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  card: {
    backgroundColor: isDark ? '#1f2937' : '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderTopWidth: 4,
  },
  cardContent: {
    padding: 16
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#1f2937'
  },
  colorBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  colorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  badge: {
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 12,
    color: isDark ? '#d1d5db' : '#4b5563',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#9ca3af' : '#6b7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: isDark ? '#6b7280' : '#9ca3af',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
});
