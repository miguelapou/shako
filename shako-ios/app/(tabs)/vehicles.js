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
      setProjects(projectData.filter(p => !p.archived));

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

  const getVehicleProjects = (vehicleId) => {
    return projects.filter(p => p.vehicle_id === vehicleId);
  };

  const getPriorityColor = (priority) => {
    const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', not_set: '#3b82f6' };
    return colors[priority] || colors.not_set;
  };

  const getBorderColor = (color) => {
    if (!color) return '#3b82f6';
    return color;
  };

  const renderVehicle = ({ item }) => {
    const vehicleProjects = getVehicleProjects(item.id);
    const borderColor = getBorderColor(item.color);
    const hasImage = item.image_url && imageUrls[item.image_url];
    const displayName = item.nickname || [item.year, item.make, item.name].filter(Boolean).join(' ');
    const badgeText = item.nickname ? [item.year, item.make, item.name].filter(Boolean).join(' ') : null;

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
        {hasImage ? (
          <Image
            source={{ uri: imageUrls[item.image_url] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={48} color={isDark ? '#4b5563' : '#9ca3af'} style={{ opacity: 0.4 }} />
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}

        {/* Vehicle Header */}
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.vehicleName} numberOfLines={1}>{displayName}</Text>
            {badgeText && (
              <View style={[styles.colorBadge, { backgroundColor: item.color || '#3b82f6' }]}>
                <Text style={styles.colorBadgeText}>{badgeText}</Text>
              </View>
            )}
          </View>

          {/* Projects Section */}
          <View style={styles.projectsSection}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {vehicleProjects.length > 0 ? (
              <View style={styles.projectsGrid}>
                {vehicleProjects.slice(0, 4).map((project) => (
                  <View
                    key={project.id}
                    style={[styles.projectBadge, { borderLeftColor: getPriorityColor(project.priority) }]}
                  >
                    <Ionicons name="list" size={12} color={isDark ? '#d1d5db' : '#374151'} />
                    <Text style={styles.projectBadgeText} numberOfLines={1}>{project.name}</Text>
                  </View>
                ))}
                {vehicleProjects.length > 4 && (
                  <Text style={styles.moreProjects}>+{vehicleProjects.length - 4} more</Text>
                )}
              </View>
            ) : (
              <View style={styles.noProjects}>
                <Ionicons name="list" size={24} color={isDark ? '#4b5563' : '#9ca3af'} style={{ opacity: 0.4 }} />
                <Text style={styles.noProjectsText}>No projects linked</Text>
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
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
            <Text style={styles.emptySubtitle}>Add your first vehicle to track maintenance and information</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add a vehicle</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      {vehicles.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={() => { setShowAddModal(false); loadData(); }}
        isDark={isDark}
      />

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
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' },
  listContent: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: isDark ? '#1f2937' : '#fff',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderTopWidth: 4,
  },
  image: {
    width: '100%',
    height: 192,
    backgroundColor: isDark ? '#374151' : '#e2e8f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 192,
    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 14,
    color: isDark ? '#6b7280' : '#94a3b8',
    marginTop: 8,
  },
  cardContent: {
    padding: 16,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#f3f4f6' : '#1e293b',
  },
  colorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  colorBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },

  // Projects Section
  projectsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: isDark ? '#9ca3af' : '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderLeftWidth: 3,
    gap: 6,
    width: '48%',
  },
  projectBadgeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: isDark ? '#d1d5db' : '#374151',
  },
  moreProjects: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    color: isDark ? '#6b7280' : '#94a3b8',
    marginTop: 4,
  },
  noProjects: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noProjectsText: {
    fontSize: 12,
    color: isDark ? '#6b7280' : '#94a3b8',
    marginTop: 4,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#d1d5db' : '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

  // FAB
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
    elevation: 6,
  },
});
