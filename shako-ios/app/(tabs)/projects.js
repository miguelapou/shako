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
    return vehicle?.nickname || vehicle?.name || null;
  };

  const getProjectParts = (projectId) => {
    return parts.filter(p => p.project_id === projectId);
  };

  const getProjectTotal = (projectId) => {
    return getProjectParts(projectId).reduce((sum, p) => sum + (p.total || 0), 0);
  };

  const getProjectProgress = (projectId) => {
    const projectParts = getProjectParts(projectId);
    if (projectParts.length === 0) return 0;
    const delivered = projectParts.filter(p => p.delivered).length;
    return Math.round((delivered / projectParts.length) * 100);
  };

  const priorityConfig = {
    high: { color: '#ef4444', label: 'High', icon: 'arrow-up' },
    medium: { color: '#f59e0b', label: 'Medium', icon: 'remove' },
    low: { color: '#10b981', label: 'Low', icon: 'arrow-down' },
    not_set: { color: '#3b82f6', label: 'Not Set', icon: 'remove' },
  };

  const renderProject = ({ item }) => {
    const priority = priorityConfig[item.priority] || priorityConfig.not_set;
    const vehicleName = getVehicleName(item.vehicle_id);
    const projectParts = getProjectParts(item.id);
    const spent = getProjectTotal(item.id);
    const progress = getProjectProgress(item.id);
    const budgetPercent = item.budget ? Math.min((spent / item.budget) * 100, 100) : 0;
    const isOverBudget = item.budget && spent > item.budget;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: priority.color }]}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              {vehicleName && (
                <View style={styles.vehicleRow}>
                  <Ionicons name="car-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={styles.vehicleName}>{vehicleName}</Text>
                </View>
              )}
            </View>

            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: priority.color + '20' }]}>
              <Ionicons name={priority.icon} size={12} color={priority.color} />
              <Text style={[styles.priorityText, { color: priority.color }]}>{priority.label}</Text>
            </View>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="construct-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.statText}>{projectParts.length} parts</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              <Text style={styles.statText}>{progress}% complete</Text>
            </View>
          </View>

          {/* Budget Progress */}
          {item.budget ? (
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={[styles.budgetAmount, isOverBudget && styles.overBudget]}>
                  ${spent.toFixed(2)} / ${item.budget.toFixed(2)}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${budgetPercent}%`,
                      backgroundColor: isOverBudget ? '#ef4444' : '#3b82f6'
                    }
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.spentRow}>
              <Text style={styles.budgetLabel}>Spent</Text>
              <Text style={styles.spentAmount}>${spent.toFixed(2)}</Text>
            </View>
          )}

          {/* Paused Badge */}
          {item.paused && (
            <View style={styles.pausedBadge}>
              <Ionicons name="pause-circle" size={14} color="#d97706" />
              <Text style={styles.pausedText}>Paused</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centered}><Text style={styles.loadingText}>Loading projects...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{projects.length} projects</Text>
        <Text style={styles.summaryTotal}>
          Total: ${projects.reduce((sum, p) => sum + getProjectTotal(p.id), 0).toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to create your first project</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Modal */}
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
  loadingText: { fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: isDark ? '#1f2937' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  },
  summaryText: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },
  summaryTotal: { fontSize: 14, fontWeight: '600', color: isDark ? '#fff' : '#111' },

  // Card
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
    borderLeftWidth: 4,
  },
  cardContent: { padding: 16 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#111', marginBottom: 4 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vehicleName: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },

  // Priority
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: { fontSize: 12, fontWeight: '600' },

  // Description
  description: {
    fontSize: 14,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginTop: 12,
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' },

  // Budget
  budgetSection: { marginTop: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetLabel: { fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' },
  budgetAmount: { fontSize: 13, fontWeight: '600', color: isDark ? '#fff' : '#111' },
  overBudget: { color: '#ef4444' },
  progressBar: {
    height: 6,
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // Spent (no budget)
  spentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#e5e7eb',
  },
  spentAmount: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : '#111' },

  // Paused
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 12,
    gap: 4,
  },
  pausedText: { color: '#d97706', fontSize: 12, fontWeight: '500' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 4 },

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
