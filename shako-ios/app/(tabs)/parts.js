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

  const getStatusBadge = (part) => {
    if (part.delivered) return { label: 'Delivered', color: '#10b981' };
    if (part.shipped) return { label: 'Shipped', color: '#3b82f6' };
    if (part.purchased) return { label: 'Purchased', color: '#f59e0b' };
    return { label: 'Pending', color: '#6b7280' };
  };

  const totalSpent = parts.reduce((sum, p) => sum + (p.total || 0), 0);

  const renderPart = ({ item }) => {
    const status = getStatusBadge(item);
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.part}</Text>
              {item.partNumber && <Text style={styles.subtitle}>#{item.partNumber}</Text>}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.badges}>
            {item.vendor && <View style={styles.badge}><Text style={styles.badgeText}>{item.vendor}</Text></View>}
            <View style={styles.badge}><Text style={styles.badgeText}>{getProjectName(item.projectId)}</Text></View>
          </View>
          {item.tracking && (
            <TouchableOpacity style={styles.trackingRow} onPress={() => {
              const url = getTrackingUrl(item.tracking);
              if (url) Linking.openURL(url);
            }}>
              <Ionicons name="location" size={14} color="#3b82f6" />
              <Text style={styles.trackingText}>{getCarrierName(item.tracking)}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.subtitle}>
              {item.price > 0 && `$${item.price.toFixed(2)}`}
              {item.shipping > 0 && ` + $${item.shipping.toFixed(2)} ship`}
            </Text>
            <Text style={styles.total}>${(item.total || 0).toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.centered}><Text style={styles.subtitle}>Loading parts...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        <Text style={styles.subtitle}>{parts.length} parts</Text>
        <Text style={styles.summaryTotal}>Total: ${totalSpent.toFixed(2)}</Text>
      </View>
      <FlatList
        data={parts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="construct-outline" size={64} color="#9ca3af" />
            <Text style={[styles.subtitle, { marginTop: 16 }]}>No parts yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
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
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: isDark ? '#1f2937' : '#fff', borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' },
  summaryTotal: { fontWeight: '600', color: isDark ? '#fff' : '#111' },
  card: { backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardContent: { padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : '#111' },
  subtitle: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  badges: { flexDirection: 'row', marginTop: 12, gap: 8 },
  badge: { backgroundColor: isDark ? '#374151' : '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, color: isDark ? '#d1d5db' : '#4b5563' },
  trackingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  trackingText: { color: '#3b82f6', fontSize: 14, marginLeft: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb' },
  total: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : '#111' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, backgroundColor: '#3b82f6', borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
});
