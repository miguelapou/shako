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

  const inputStyle = `border rounded-lg px-4 py-3 text-base ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-gray-50 border-gray-300 text-gray-900'
  }`;

  const labelStyle = `text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <TouchableOpacity onPress={onClose}>
            <Text className={isDark ? 'text-blue-400' : 'text-blue-600'}>Cancel</Text>
          </TouchableOpacity>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add Vehicle
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text className={`font-semibold ${saving ? 'text-gray-400' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Image Picker */}
          <TouchableOpacity onPress={pickImage} className="mb-6">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <View className={`w-full h-48 rounded-xl items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <Ionicons name="camera" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tap to add photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name (required) */}
          <View className="mb-4">
            <Text className={labelStyle}>Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., 2020 Toyota Tacoma"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={inputStyle}
            />
          </View>

          {/* Nickname */}
          <View className="mb-4">
            <Text className={labelStyle}>Nickname</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g., The Beast"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={inputStyle}
            />
          </View>

          {/* Year */}
          <View className="mb-4">
            <Text className={labelStyle}>Year</Text>
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="e.g., 2020"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="numeric"
              className={inputStyle}
            />
          </View>

          {/* License Plate */}
          <View className="mb-4">
            <Text className={labelStyle}>License Plate</Text>
            <TextInput
              value={licensePlate}
              onChangeText={setLicensePlate}
              placeholder="e.g., ABC 1234"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              className={inputStyle}
            />
          </View>

          {/* VIN */}
          <View className="mb-4">
            <Text className={labelStyle}>VIN</Text>
            <TextInput
              value={vin}
              onChangeText={setVin}
              placeholder="Vehicle Identification Number"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              className={inputStyle}
            />
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
