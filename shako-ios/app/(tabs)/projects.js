import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllProjects } from '../../services/projectsService';
import { getAllVehicles } from '../../services/vehiclesService';
import { getAllParts } from '../../services/partsService';
import AddProjectModal from '../../components/AddProjectModal';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const loadData = async () => {
    try {
      const [projectsData, vehiclesData, partsData] = await Promise.all([
        getAllProjects(user.id),
        getAllVehicles(user.id),
        getAllParts(user.id),
      ]);
      setProjects(projectsData.filter(p => !p.archived));
      setVehicles(vehiclesData);
      setParts(partsData);
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

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.nickname || vehicle?.name || 'No vehicle';
  };

  const getProjectTotal = (projectId) => {
    return parts.filter(p => p.project_id === projectId).reduce((sum, p) => sum + (p.total || 0), 0);
  };

  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', not_set: '#3b82f6' };

  const renderProject = ({ item }) => (
    <TouchableOpacity style={[styles.card, { borderLeftWidth: 4, borderLeftColor: priorityColors[item.priority] || '#3b82f6' }]}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{getVehicleName(item.vehicle_id)}</Text>
        {item.description && <Text style={[styles.subtitle, { marginTop: 8 }]} numberOfLines={2}>{item.description}</Text>}
        <View style={styles.row}>
          <Text style={styles.meta}>${getProjectTotal(item.id).toFixed(2)}</Text>
          {item.paused && <View style={styles.pausedBadge}><Text style={styles.pausedText}>Paused</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.centered}><Text style={styles.subtitle}>Loading projects...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="folder-outline" size={64} color="#9ca3af" />
            <Text style={[styles.subtitle, { marginTop: 16 }]}>No projects yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
      <AddProjectModal
        visible={showAddModal}
        vehicles={vehicles}
        onClose={() => setShowAddModal(false)}
        onSave={() => { setShowAddModal(false); loadData(); }}
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
  title: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#111' },
  subtitle: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  meta: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },
  pausedBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  pausedText: { color: '#d97706', fontSize: 12, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#3b82f6', borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
});
