import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { createVehicle, uploadVehicleImage } from '../services/vehiclesService';

export default function AddVehicleModal({ visible, onClose, onSave, isDark }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const styles = createStyles(isDark);

  const resetForm = () => {
    setName('');
    setNickname('');
    setYear('');
    setLicensePlate('');
    setVin('');
    setImageUri(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a vehicle name');
      return;
    }

    setSaving(true);
    try {
      let imagePath = null;
      if (imageUri) {
        imagePath = await uploadVehicleImage(imageUri, user.id);
      }

      await createVehicle({
        name: name.trim(),
        nickname: nickname.trim() || null,
        year: year ? parseInt(year) : null,
        license_plate: licensePlate.trim() || null,
        vin: vin.trim() || null,
        image_url: imagePath,
      }, user.id);

      resetForm();
      onSave();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Vehicle</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveText, saving && styles.disabledText]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Image Picker */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name (required) */}
          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., 2020 Toyota Tacoma"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.input}
            />
          </View>

          {/* Nickname */}
          <View style={styles.field}>
            <Text style={styles.label}>Nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g., The Beast"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.input}
            />
          </View>

          {/* Year */}
          <View style={styles.field}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="e.g., 2020"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {/* License Plate */}
          <View style={styles.field}>
            <Text style={styles.label}>License Plate</Text>
            <TextInput
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="e.g., ABC 1234"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* VIN */}
          <View style={styles.field}>
            <Text style={styles.label}>VIN</Text>
            <TextInput
              value={vin}
              onChangeText={setVin}
              placeholder="Vehicle Identification Number"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#111827' : '#f3f4f6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' },
  cancelText: { color: '#3b82f6', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#fff' : '#111' },
  saveText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  disabledText: { color: '#9ca3af' },
  content: { flex: 1, padding: 16 },
  imagePicker: { marginBottom: 24 },
  imagePreview: { width: '100%', height: 192, borderRadius: 12 },
  imagePlaceholder: { width: '100%', height: 192, borderRadius: 12, backgroundColor: isDark ? '#1f2937' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { marginTop: 8, color: isDark ? '#9ca3af' : '#6b7280' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: isDark ? '#d1d5db' : '#374151' },
  input: { borderWidth: 1, borderColor: isDark ? '#374151' : '#d1d5db', backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: isDark ? '#fff' : '#111' },
});
