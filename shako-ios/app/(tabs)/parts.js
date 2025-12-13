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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllParts } from '../../services/partsService';
import { getAllProjects } from '../../services/projectsService';
import { getTrackingUrl, getCarrierName } from '../../utils/trackingUtils';
import AddPartModal from '../../components/AddPartModal';

export default function PartsScreen() {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const loadData = async () => {
    try {
      const [partsData, projectsData] = await Promise.all([
        getAllParts(user.id),
        getAllProjects(user.id),
      ]);
      setParts(partsData);
      setProjects(projectsData);
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

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'No project';
  };

  // Calculate stats
  const stats = {
    pending: parts.filter(p => !p.purchased && !p.shipped && !p.delivered).length,
    purchased: parts.filter(p => p.purchased && !p.shipped && !p.delivered).length,
    shipped: parts.filter(p => p.shipped && !p.delivered).length,
    delivered: parts.filter(p => p.delivered).length,
  };

  const totalSpent = parts.reduce((sum, p) => sum + (p.total || 0), 0);

  // Filter parts based on status
  const filteredParts = statusFilter
    ? parts.filter(p => {
        if (statusFilter === 'pending') return !p.purchased && !p.shipped && !p.delivered;
        if (statusFilter === 'purchased') return p.purchased && !p.shipped && !p.delivered;
        if (statusFilter === 'shipped') return p.shipped && !p.delivered;
        if (statusFilter === 'delivered') return p.delivered;
        return true;
      })
    : parts;

  const getStatusBadge = (part) => {
    if (part.delivered) return { label: 'Delivered', color: '#10b981', icon: 'checkmark-circle' };
    if (part.shipped) return { label: 'Shipped', color: '#3b82f6', icon: 'airplane' };
    if (part.purchased) return { label: 'Purchased', color: '#f59e0b', icon: 'cart' };
    return { label: 'Pending', color: '#6b7280', icon: 'time' };
  };

  const StatusCard = ({ title, count, color, icon, filterKey }) => {
    const isActive = statusFilter === filterKey;
    return (
      <TouchableOpacity
        style={[
          styles.statusCard,
          isActive && { borderColor: color, borderWidth: 2 }
        ]}
        onPress={() => setStatusFilter(isActive ? null : filterKey)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statusCount}>{count}</Text>
        <Text style={styles.statusLabel}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderPart = ({ item }) => {
    const status = getStatusBadge(item);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{item.part}</Text>
              {item.part_number && (
                <Text style={styles.partNumber}>#{item.part_number}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Ionicons name={status.icon} size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            {item.vendor && (
              <View style={styles.vendorBadge}>
                <Text style={styles.vendorText}>{item.vendor}</Text>
              </View>
            )}
            <View style={styles.projectBadge}>
              <Ionicons name="folder-outline" size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={styles.projectText}>{getProjectName(item.project_id)}</Text>
            </View>
          </View>

          {/* Tracking */}
          {item.tracking && (
            <TouchableOpacity
              style={styles.trackingRow}
              onPress={() => {
                const url = getTrackingUrl(item.tracking);
                if (url) Linking.openURL(url);
              }}
            >
              <Ionicons name="location" size={14} color="#3b82f6" />
              <Text style={styles.trackingText}>Track: {getCarrierName(item.tracking)}</Text>
              <Ionicons name="open-outline" size={14} color="#3b82f6" />
            </TouchableOpacity>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <Text style={styles.priceBreakdown}>
              {item.price > 0 && `$${item.price.toFixed(2)}`}
              {item.shipping > 0 && ` + $${item.shipping.toFixed(2)} ship`}
              {item.duties > 0 && ` + $${item.duties.toFixed(2)} duties`}
            </Text>
            <Text style={styles.total}>${(item.total || 0).toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centered}><Text style={styles.loadingText}>Loading parts...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Status Cards */}
      <View style={styles.statusCardsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusCards}>
          <StatusCard title="Pending" count={stats.pending} color="#6b7280" icon="time-outline" filterKey="pending" />
          <StatusCard title="Purchased" count={stats.purchased} color="#f59e0b" icon="cart-outline" filterKey="purchased" />
          <StatusCard title="Shipped" count={stats.shipped} color="#3b82f6" icon="airplane-outline" filterKey="shipped" />
          <StatusCard title="Delivered" count={stats.delivered} color="#10b981" icon="checkmark-circle-outline" filterKey="delivered" />
        </ScrollView>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {statusFilter ? `${filteredParts.length} ${statusFilter}` : `${parts.length} parts`}
        </Text>
        <Text style={styles.summaryTotal}>Total: ${totalSpent.toFixed(2)}</Text>
      </View>

      {/* Parts List */}
      <FlatList
        data={filteredParts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text style={styles.emptyTitle}>
              {statusFilter ? `No ${statusFilter} parts` : 'No parts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter ? 'Try a different filter' : 'Tap the + button to add your first part'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Modal */}
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
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' },

  // Status Cards
  statusCardsContainer: {
    backgroundColor: isDark ? '#1f2937' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  },
  statusCards: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  statusCard: {
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#111',
  },
  statusLabel: {
    fontSize: 11,
    color: isDark ? '#9ca3af' : '#6b7280',
    marginTop: 2,
  },

  // Summary Bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : '#111', flex: 1, marginRight: 8 },
  partNumber: { fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500' },

  // Badges
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  vendorBadge: {
    backgroundColor: isDark ? '#374151' : '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? '#4b5563' : '#93c5fd',
  },
  vendorText: { fontSize: 12, color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '500' },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  projectText: { fontSize: 12, color: isDark ? '#d1d5db' : '#4b5563' },

  // Tracking
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: isDark ? '#1e3a5f' : '#eff6ff',
    borderRadius: 8,
    gap: 6,
  },
  trackingText: { flex: 1, color: '#3b82f6', fontSize: 14, fontWeight: '500' },

  // Price
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#e5e7eb',
  },
  priceBreakdown: { fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' },
  total: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#111' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#9ca3af' : '#6b7280', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 4, textAlign: 'center' },

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
