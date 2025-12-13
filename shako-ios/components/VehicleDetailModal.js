import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { deleteVehicle, updateVehicle } from '../services/vehiclesService';

export default function VehicleDetailModal({ visible, vehicle, imageUrl, onClose, onUpdate, isDark }) {
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  if (!vehicle) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete "${vehicle.nickname || vehicle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteVehicle(vehicle.id);
              onClose();
              onUpdate();
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    try {
      await updateVehicle(vehicle.id, { archived: true });
      onClose();
      onUpdate();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <View className="flex-row justify-between py-3 border-b border-gray-700">
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>{label}</Text>
        <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Vehicle Details
          </Text>
          <TouchableOpacity onPress={handleDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Image */}
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-56"
              resizeMode="cover"
            />
          )}

          {/* Vehicle Name */}
          <View className="px-4 py-6">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {vehicle.nickname || vehicle.name}
            </Text>
            {vehicle.nickname && vehicle.name && (
              <Text className={`text-lg mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {vehicle.name}
              </Text>
            )}
          </View>

          {/* Info Section */}
          <View className={`mx-4 rounded-xl px-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <InfoRow label="Year" value={vehicle.year} />
            <InfoRow label="Make" value={vehicle.make} />
            <InfoRow label="License Plate" value={vehicle.license_plate} />
            <InfoRow label="VIN" value={vehicle.vin} />
            <InfoRow label="Color" value={vehicle.color} />
            <InfoRow label="Odometer" value={vehicle.odometer_range ? `${vehicle.odometer_range} ${vehicle.odometer_unit || 'mi'}` : null} />
          </View>

          {/* Maintenance Info */}
          {(vehicle.oil_type || vehicle.oil_filter || vehicle.air_filter || vehicle.fuel_filter || vehicle.battery) && (
            <View className="mt-6">
              <Text className={`px-4 mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                MAINTENANCE
              </Text>
              <View className={`mx-4 rounded-xl px-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <InfoRow label="Oil Type" value={vehicle.oil_type} />
                <InfoRow label="Oil Capacity" value={vehicle.oil_capacity} />
                <InfoRow label="Oil Brand" value={vehicle.oil_brand} />
                <InfoRow label="Oil Filter" value={vehicle.oil_filter} />
                <InfoRow label="Air Filter" value={vehicle.air_filter} />
                <InfoRow label="Fuel Filter" value={vehicle.fuel_filter} />
                <InfoRow label="Battery" value={vehicle.battery} />
                <InfoRow label="Drain Plug" value={vehicle.drain_plug} />
              </View>
            </View>
          )}

          {/* Insurance */}
          {vehicle.insurance_policy && (
            <View className="mt-6">
              <Text className={`px-4 mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                INSURANCE
              </Text>
              <View className={`mx-4 rounded-xl px-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <InfoRow label="Policy" value={vehicle.insurance_policy} />
              </View>
            </View>
          )}

          {/* Archive Button */}
          <TouchableOpacity
            onPress={handleArchive}
            className={`mx-4 mt-6 mb-8 py-3 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <Text className="text-orange-500 font-medium">Archive Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
