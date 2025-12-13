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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllParts } from '../../services/partsService';
import { getAllProjects } from '../../services/projectsService';
import { getAllVendors } from '../../services/vendorsService';
import { formatCurrency } from '../../utils/dataUtils';
import { getTrackingUrl, getCarrierName } from '../../utils/trackingUtils';
import { getVendorColor, getVendorDisplayColor } from '../../utils/colorUtils';
import AddPartModal from '../../components/AddPartModal';

export default function PartsScreen() {
  const [parts, setParts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadData = async () => {
    try {
      const [partsData, projectsData, vendorsData] = await Promise.all([
        getAllParts(user.id),
        getAllProjects(user.id),
        getAllVendors(user.id),
      ]);
      setParts(partsData);
      setProjects(projectsData);
      setVendors(vendorsData);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
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
    if (part.delivered) return { label: 'Delivered', color: 'bg-green-500' };
    if (part.shipped) return { label: 'Shipped', color: 'bg-blue-500' };
    if (part.purchased) return { label: 'Purchased', color: 'bg-yellow-500' };
    return { label: 'Pending', color: 'bg-gray-500' };
  };

  const vendorColors = vendors.reduce((acc, v) => {
    acc[v.name] = v.color;
    return acc;
  }, {});

  const openTracking = (tracking) => {
    const url = getTrackingUrl(tracking);
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderPart = ({ item }) => {
    const status = getStatusBadge(item);
    const vendorColorClass = getVendorColor(item.vendor, vendorColors);
    const customColor = vendorColors[item.vendor];
    const displayColor = customColor ? getVendorDisplayColor(customColor, isDark) : null;

    return (
      <TouchableOpacity
        className={`mb-3 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
      >
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.part}
              </Text>
              {item.partNumber && (
                <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  #{item.partNumber}
                </Text>
              )}
            </View>
            <View className={`px-2 py-1 rounded ${status.color}`}>
              <Text className="text-white text-xs font-medium">{status.label}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap mt-3 gap-2">
            {/* Vendor badge */}
            {item.vendor && (
              <View
                className={`px-2 py-1 rounded ${vendorColorClass || ''}`}
                style={displayColor ? {
                  backgroundColor: displayColor.bg,
                  borderWidth: 1,
                  borderColor: displayColor.border,
                } : {}}
              >
                <Text
                  className={vendorColorClass ? '' : 'text-sm'}
                  style={displayColor ? { color: displayColor.text } : {}}
                >
                  {item.vendor}
                </Text>
              </View>
            )}

            {/* Project badge */}
            <View className={`px-2 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {getProjectName(item.projectId)}
              </Text>
            </View>
          </View>

          {/* Tracking */}
          {item.tracking && (
            <TouchableOpacity
              onPress={() => openTracking(item.tracking)}
              className="flex-row items-center mt-3"
            >
              <Ionicons name="location" size={14} color={isDark ? '#60a5fa' : '#3b82f6'} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {getCarrierName(item.tracking)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Price */}
          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-700">
            <View className="flex-row gap-4">
              {item.price > 0 && (
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Price: {formatCurrency(item.price)}
                </Text>
              )}
              {item.shipping > 0 && (
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ship: {formatCurrency(item.shipping)}
                </Text>
              )}
            </View>
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading parts...</Text>
      </View>
    );
  }

  // Calculate totals
  const totalSpent = parts.reduce((sum, p) => sum + (p.total || 0), 0);

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Summary Header */}
      <View className={`px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row justify-between">
          <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {parts.length} parts
          </Text>
          <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Total: {formatCurrency(totalSpent)}
          </Text>
        </View>
      </View>

      <FlatList
        data={parts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#60a5fa' : '#3b82f6'}
          />
        }
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons
              name="construct-outline"
              size={64}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No parts yet
            </Text>
            <Text className={`mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap + to add your first part
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Part Modal */}
      <AddPartModal
        visible={showAddModal}
        projects={projects}
        vendors={vendors}
        onClose={() => setShowAddModal(false)}
        onSave={async () => {
          setShowAddModal(false);
          await loadData();
        }}
        isDark={isDark}
      />
    </View>
  );
}
