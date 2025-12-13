import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { deleteVehicle, updateVehicle } from '../services/vehiclesService';

export default function VehicleDetailModal({ visible, vehicle, imageUrl, onClose, onUpdate, isDark }) {
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const styles = createStyles(isDark);

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
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Details</Text>
          <TouchableOpacity onPress={handleDelete} disabled={deleting}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Image */}
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          )}

          {/* Vehicle Name */}
          <View style={styles.nameSection}>
            <Text style={styles.vehicleName}>{vehicle.nickname || vehicle.name}</Text>
            {vehicle.nickname && vehicle.name && (
              <Text style={styles.vehicleSubname}>{vehicle.name}</Text>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.card}>
            <InfoRow label="Year" value={vehicle.year} />
            <InfoRow label="Make" value={vehicle.make} />
            <InfoRow label="License Plate" value={vehicle.license_plate} />
            <InfoRow label="VIN" value={vehicle.vin} />
            <InfoRow label="Color" value={vehicle.color} />
            <InfoRow label="Odometer" value={vehicle.odometer_range ? `${vehicle.odometer_range} ${vehicle.odometer_unit || 'mi'}` : null} />
          </View>

          {/* Maintenance Info */}
          {(vehicle.oil_type || vehicle.oil_filter || vehicle.air_filter || vehicle.fuel_filter || vehicle.battery) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MAINTENANCE</Text>
              <View style={styles.card}>
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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>INSURANCE</Text>
              <View style={styles.card}>
                <InfoRow label="Policy" value={vehicle.insurance_policy} />
              </View>
            </View>
          )}

          {/* Archive Button */}
          <TouchableOpacity onPress={handleArchive} style={styles.archiveButton}>
            <Text style={styles.archiveButtonText}>Archive Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#fff' : '#111' },
  content: { flex: 1 },
  image: { width: '100%', height: 224 },
  nameSection: { paddingHorizontal: 16, paddingVertical: 24 },
  vehicleName: { fontSize: 24, fontWeight: 'bold', color: isDark ? '#fff' : '#111' },
  vehicleSubname: { fontSize: 18, marginTop: 4, color: isDark ? '#9ca3af' : '#6b7280' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '500', color: isDark ? '#9ca3af' : '#6b7280', paddingHorizontal: 16, marginBottom: 8 },
  card: { marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 16, backgroundColor: isDark ? '#1f2937' : '#fff' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' },
  infoLabel: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: isDark ? '#fff' : '#111' },
  archiveButton: { marginHorizontal: 16, marginTop: 24, marginBottom: 32, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: isDark ? '#1f2937' : '#fff' },
  archiveButtonText: { color: '#f97316', fontWeight: '500', fontSize: 16 },
});
