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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getAllVehicles, getVehicleImageUrls } from '../../services/vehiclesService';
import { formatCurrency } from '../../utils/dataUtils';
import AddVehicleModal from '../../components/AddVehicleModal';
import VehicleDetailModal from '../../components/VehicleDetailModal';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadVehicles = async () => {
    try {
      const data = await getAllVehicles(user.id);
      setVehicles(data.filter(v => !v.archived));

      // Load image URLs
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
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  }, [user]);

  const renderVehicle = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedVehicle(item)}
      className={`mb-3 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}
    >
      {item.image_url && imageUrls[item.image_url] && (
        <Image
          source={{ uri: imageUrls[item.image_url] }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {item.nickname || item.name}
        </Text>
        {item.nickname && item.name && (
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.name}
          </Text>
        )}
        <View className="flex-row mt-2 flex-wrap gap-2">
          {item.year && (
            <View className={`px-2 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.year}
              </Text>
            </View>
          )}
          {item.license_plate && (
            <View className={`px-2 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.license_plate}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
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
              name="car-outline"
              size={64}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text className={`mt-4 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No vehicles yet
            </Text>
            <Text className={`mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Tap + to add your first vehicle
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

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async () => {
          setShowAddModal(false);
          await loadVehicles();
        }}
        isDark={isDark}
      />

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        visible={!!selectedVehicle}
        vehicle={selectedVehicle}
        imageUrl={selectedVehicle?.image_url ? imageUrls[selectedVehicle.image_url] : null}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={async () => {
          await loadVehicles();
        }}
        isDark={isDark}
      />
    </View>
  );
}
