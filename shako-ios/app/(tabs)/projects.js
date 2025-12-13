import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllProjects } from '../../services/projectsService';
import { getAllVehicles } from '../../services/vehiclesService';
import { getAllParts } from '../../services/partsService';
import { calculateProjectTotal, formatCurrency } from '../../utils/dataUtils';
import { getPriorityBorderColor } from '../../utils/colorUtils';
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
    if (user) {
      loadData();
    }
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

  const getPriorityLabel = (priority) => {
    const labels = {
      not_set: 'Not Set',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    };
    return labels[priority] || 'Not Set';
  };

  const renderProject = ({ item }) => {
    const total = calculateProjectTotal(item.id, parts);
    const borderColor = getPriorityBorderColor(item.priority || 'not_set');
    const todoCount = item.todos?.length || 0;
    const completedTodos = item.todos?.filter(t => t.completed)?.length || 0;

    return (
      <TouchableOpacity
        className={`mb-3 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        <View className="p-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.name}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {getVehicleName(item.vehicle_id)}
              </Text>
            </View>
            {item.paused && (
              <View className="bg-yellow-500/20 px-2 py-1 rounded">
                <Text className="text-yellow-500 text-xs font-medium">Paused</Text>
              </View>
            )}
          </View>

          {item.description && (
            <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View className="flex-row mt-3 gap-4">
            <View className="flex-row items-center">
              <Ionicons name="flag" size={14} color={borderColor} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {getPriorityLabel(item.priority)}
              </Text>
            </View>

            {todoCount > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="checkbox" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {completedTodos}/{todoCount}
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <Ionicons name="cash" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <FlatList
        data={projects}
        renderItem={renderProject}
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
              name="folder-outline"
              size={64}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No projects yet
            </Text>
            <Text className={`mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap + to create your first project
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

      {/* Add Project Modal */}
      <AddProjectModal
        visible={showAddModal}
        vehicles={vehicles}
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
