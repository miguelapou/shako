import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert,
  Linking,
  StyleSheet,
  Modal,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllParts, updatePart } from '../../services/partsService';
import { getAllProjects } from '../../services/projectsService';
import { getAllVehicles } from '../../services/vehiclesService';
import { getTrackingUrl, getCarrierName } from '../../utils/trackingUtils';
import AddPartModal from '../../components/AddPartModal';

export default function PartsScreen() {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveredFilter, setDeliveredFilter] = useState('all');
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const loadData = async () => {
    try {
      const [partsData, projectsData, vehiclesData] = await Promise.all([
        getAllParts(user.id),
        getAllProjects(user.id),
        getAllVehicles(user.id),
      ]);
      setParts(partsData);
      setProjects(projectsData);
      setVehicles(vehiclesData);
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

  // Calculate stats
  const stats = {
    pending: parts.filter(p => !p.purchased && !p.shipped && !p.delivered).length,
    purchased: parts.filter(p => p.purchased && !p.shipped && !p.delivered).length,
    shipped: parts.filter(p => p.shipped && !p.delivered).length,
    delivered: parts.filter(p => p.delivered).length,
  };

  const totalCost = parts.reduce((sum, p) => sum + (p.total || 0), 0);

  // Filter parts
  const filteredParts = parts.filter(p => {
    // First apply delivered filter
    if (deliveredFilter === 'only') {
      if (!p.delivered) return false;
    } else if (deliveredFilter === 'hide') {
      if (p.delivered) return false;
    }

    // Then apply status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !p.purchased && !p.shipped && !p.delivered;
    if (statusFilter === 'purchased') return p.purchased && !p.shipped && !p.delivered;
    if (statusFilter === 'shipped') return p.shipped && !p.delivered;
    return true;
  });

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'None';
  };

  const getVehicleForPart = (part) => {
    const project = projects.find(p => p.id === part.project_id);
    if (!project?.vehicle_id) return null;
    return vehicles.find(v => v.id === project.vehicle_id);
  };

  // Update part status
  const updatePartStatus = async (partId, newStatus) => {
    try {
      let updates = {};
      if (newStatus === 'pending') {
        updates = { purchased: false, shipped: false, delivered: false };
      } else if (newStatus === 'purchased') {
        updates = { purchased: true, shipped: false, delivered: false };
      } else if (newStatus === 'shipped') {
        updates = { purchased: true, shipped: true, delivered: false };
      } else if (newStatus === 'delivered') {
        updates = { purchased: true, shipped: true, delivered: true };
      }
      await updatePart(partId, updates);
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Update part project
  const updatePartProject = async (partId, newProjectId) => {
    try {
      await updatePart(partId, { project_id: newProjectId });
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const showStatusActionSheet = (part) => {
    const options = ['Delivered', 'Shipped', 'Ordered', 'Pending', 'Cancel'];
    const cancelButtonIndex = 4;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, title: 'Change Status' },
        (buttonIndex) => {
          if (buttonIndex === 0) updatePartStatus(part.id, 'delivered');
          else if (buttonIndex === 1) updatePartStatus(part.id, 'shipped');
          else if (buttonIndex === 2) updatePartStatus(part.id, 'purchased');
          else if (buttonIndex === 3) updatePartStatus(part.id, 'pending');
        }
      );
    } else {
      Alert.alert('Change Status', 'Select new status', [
        { text: 'Delivered', onPress: () => updatePartStatus(part.id, 'delivered') },
        { text: 'Shipped', onPress: () => updatePartStatus(part.id, 'shipped') },
        { text: 'Ordered', onPress: () => updatePartStatus(part.id, 'purchased') },
        { text: 'Pending', onPress: () => updatePartStatus(part.id, 'pending') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const showProjectActionSheet = (part) => {
    const activeProjects = projects.filter(p => !p.archived);
    const options = ['None', ...activeProjects.map(p => p.name), 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, title: 'Assign Project' },
        (buttonIndex) => {
          if (buttonIndex === 0) updatePartProject(part.id, null);
          else if (buttonIndex < cancelButtonIndex) {
            const project = activeProjects[buttonIndex - 1];
            updatePartProject(part.id, project.id);
          }
        }
      );
    } else {
      Alert.alert('Assign Project', 'Select project', [
        { text: 'None', onPress: () => updatePartProject(part.id, null) },
        ...activeProjects.map(p => ({
          text: p.name,
          onPress: () => updatePartProject(part.id, p.id)
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const getStatusInfo = (part) => {
    if (part.delivered) return { label: 'Delivered', color: '#10b981', icon: 'checkmark-circle' };
    if (part.shipped) return { label: 'Shipped', color: '#3b82f6', icon: 'airplane' };
    if (part.purchased) return { label: 'Ordered', color: '#eab308', icon: 'cart' };
    return { label: 'Pending', color: '#6b7280', icon: 'time' };
  };

  const getPriorityColor = (priority) => {
    const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', not_set: '#3b82f6' };
    return colors[priority] || colors.not_set;
  };

  // Status Card component matching web mobile view
  const StatusCard = ({ label, count, color, icon, isActive, onPress, secondaryLabel, secondaryCount, secondaryColor, secondaryIcon }) => (
    <TouchableOpacity
      style={[
        styles.statusCard,
        { borderLeftColor: isActive ? (secondaryLabel ? '#6b7280' : color) : color },
        isActive && styles.statusCardActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statusCardIcon}>
        <Ionicons
          name={isActive && secondaryIcon ? secondaryIcon : icon}
          size={24}
          color={isActive && secondaryColor ? secondaryColor : color}
          style={{ opacity: isActive ? 0.7 : 0.2 }}
        />
      </View>
      <Text style={styles.statusCardLabel}>
        {isActive && secondaryLabel ? secondaryLabel : label}
      </Text>
      <Text style={styles.statusCardCount}>
        {isActive && secondaryCount !== undefined ? secondaryCount : count}
      </Text>
    </TouchableOpacity>
  );

  const renderPart = ({ item }) => {
    const status = getStatusInfo(item);
    const vehicle = getVehicleForPart(item);
    const project = projects.find(p => p.id === item.project_id);

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        {/* Header: Part name + Vehicle badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.partName} numberOfLines={1}>{item.part}</Text>
          {vehicle && (
            <View style={styles.vehicleBadge}>
              <Ionicons name="car" size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={[styles.vehicleBadgeText, { color: vehicle.color || '#3b82f6' }]}>
                {vehicle.nickname || vehicle.name}
              </Text>
            </View>
          )}
        </View>

        {/* Vendor & Project Row */}
        <View style={styles.row}>
          <View style={styles.labelValue}>
            <Text style={styles.label}>Vendor:</Text>
            {item.vendor ? (
              <View style={styles.vendorBadge}>
                <Text style={styles.vendorText}>{item.vendor}</Text>
              </View>
            ) : (
              <View style={styles.noneBadge}>
                <Text style={styles.noneText}>none</Text>
              </View>
            )}
          </View>
          <View style={styles.labelValue}>
            <Text style={styles.label}>Project:</Text>
            <TouchableOpacity
              style={[styles.projectButton, project && { borderLeftColor: getPriorityColor(project.priority), borderLeftWidth: 3 }]}
              onPress={() => showProjectActionSheet(item)}
            >
              <Text style={styles.projectButtonText} numberOfLines={1}>
                {getProjectName(item.project_id)}
              </Text>
              <Ionicons name="chevron-down" size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Part Number & Status Row */}
        <View style={styles.row}>
          {item.part_number ? (
            <View style={styles.labelValue}>
              <Text style={styles.label}>Part #:</Text>
              <Text style={styles.partNumber}>{item.part_number}</Text>
            </View>
          ) : (
            <View />
          )}
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: status.color }]}
            onPress={() => showStatusActionSheet(item)}
          >
            <Ionicons name={status.icon} size={14} color="#fff" />
            <Text style={styles.statusButtonText}>{status.label}</Text>
            <Ionicons name="chevron-down" size={12} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Tracking & Total Row */}
        <View style={styles.row}>
          <View>
            {item.delivered ? (
              <View style={styles.deliveredBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                <Text style={styles.deliveredText}>Delivered</Text>
              </View>
            ) : item.tracking ? (
              <TouchableOpacity
                style={styles.trackingButton}
                onPress={() => {
                  const url = getTrackingUrl(item.tracking);
                  if (url) Linking.openURL(url);
                }}
              >
                <Text style={styles.trackingButtonText}>{getCarrierName(item.tracking)}</Text>
                <Ionicons name="open-outline" size={12} color="#fff" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.noTracking}>No tracking</Text>
            )}
          </View>
          <Text style={styles.total}>${(item.total || 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centered}><Text style={styles.loadingText}>Loading parts...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      <View style={styles.statsSection}>
        {/* Status Cards Row */}
        <View style={styles.statusCardsRow}>
          <StatusCard
            label="Ordered"
            count={stats.purchased}
            color="#eab308"
            icon="cart-outline"
            secondaryLabel="Unordered"
            secondaryCount={stats.pending}
            secondaryColor="#6b7280"
            secondaryIcon="time-outline"
            isActive={statusFilter === 'purchased' || statusFilter === 'pending'}
            onPress={() => {
              if (statusFilter === 'purchased') {
                setStatusFilter('pending');
              } else if (statusFilter === 'pending') {
                setStatusFilter('all');
              } else {
                setStatusFilter('purchased');
              }
              setDeliveredFilter('all');
            }}
          />
          <StatusCard
            label="Shipped"
            count={stats.shipped}
            color="#3b82f6"
            icon="airplane-outline"
            isActive={statusFilter === 'shipped'}
            onPress={() => {
              setStatusFilter(statusFilter === 'shipped' ? 'all' : 'shipped');
              setDeliveredFilter('all');
            }}
          />
          <StatusCard
            label="Delivered"
            count={stats.delivered}
            color="#10b981"
            icon="checkmark-circle-outline"
            secondaryLabel="Hide Delivered"
            secondaryCount={parts.length - stats.delivered}
            isActive={deliveredFilter === 'only' || deliveredFilter === 'hide'}
            onPress={() => {
              if (deliveredFilter === 'all') {
                setDeliveredFilter('only');
                setStatusFilter('all');
              } else if (deliveredFilter === 'only') {
                setDeliveredFilter('hide');
              } else {
                setDeliveredFilter('all');
              }
            }}
          />
        </View>

        {/* Cost Summary */}
        <View style={styles.costSummary}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Total Cost</Text>
            <Text style={styles.costValue}>${totalCost.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Parts</Text>
            <Text style={styles.costValue}>{filteredParts.length} of {parts.length}</Text>
          </View>
        </View>
      </View>

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyTitle}>
              {statusFilter !== 'all' || deliveredFilter !== 'all' ? 'No matching parts' : 'No parts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter !== 'all' || deliveredFilter !== 'all' ? 'Try a different filter' : 'Tap + to add your first part'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <AddPartModal
        visible={showAddModal}
        projects={projects}
        vendors={[]}
        onClose={() => setShowAddModal(false)}
        onSave={() => { setShowAddModal(false); loadData(); }}
        isDark={isDark}
      />
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' },

  // Stats Section
  statsSection: { padding: 12, gap: 12 },
  statusCardsRow: { flexDirection: 'row', gap: 8 },
  statusCard: {
    flex: 1,
    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusCardActive: {
    borderWidth: 2,
    borderColor: isDark ? '#4b5563' : '#94a3b8',
  },
  statusCardIcon: { position: 'absolute', top: 8, right: 8 },
  statusCardLabel: { fontSize: 11, color: isDark ? '#9ca3af' : '#64748b', marginBottom: 4 },
  statusCardCount: { fontSize: 20, fontWeight: 'bold', color: isDark ? '#f3f4f6' : '#1e293b' },

  costSummary: {
    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  costLabel: { fontSize: 12, color: isDark ? '#9ca3af' : '#64748b' },
  costValue: { fontSize: 14, fontWeight: '600', color: isDark ? '#f3f4f6' : '#1e293b' },

  // Card
  listContent: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  partName: { flex: 1, fontSize: 16, fontWeight: 'bold', color: isDark ? '#f3f4f6' : '#1e293b' },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  vehicleBadgeText: { fontSize: 11, fontWeight: '500' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  labelValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 11, color: isDark ? '#9ca3af' : '#64748b' },

  vendorBadge: {
    backgroundColor: isDark ? '#374151' : '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  vendorText: { fontSize: 11, fontWeight: '500', color: isDark ? '#d1d5db' : '#475569' },
  noneBadge: {
    backgroundColor: isDark ? '#374151' : '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  noneText: { fontSize: 11, color: isDark ? '#6b7280' : '#64748b' },

  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    maxWidth: 120,
  },
  projectButtonText: { fontSize: 11, fontWeight: '500', color: isDark ? '#d1d5db' : '#475569', flex: 1 },

  partNumber: { fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: isDark ? '#f3f4f6' : '#1e293b' },

  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusButtonText: { fontSize: 12, fontWeight: '500', color: '#fff' },

  divider: { height: 1, backgroundColor: isDark ? '#374151' : '#e2e8f0', marginVertical: 12 },

  deliveredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveredText: { fontSize: 12, color: isDark ? '#9ca3af' : '#64748b' },

  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  trackingButtonText: { fontSize: 12, fontWeight: '500', color: '#fff' },
  noTracking: { fontSize: 12, color: isDark ? '#6b7280' : '#94a3b8' },

  total: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#f3f4f6' : '#1e293b' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
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
