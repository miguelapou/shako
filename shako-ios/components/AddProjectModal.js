import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { createProject } from '../services/projectsService';

export default function AddProjectModal({ visible, vehicles, onClose, onSave, isDark }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [priority, setPriority] = useState('not_set');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const resetForm = () => {
    setName('');
    setDescription('');
    setVehicleId('');
    setPriority('not_set');
    setBudget('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setSaving(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || null,
        vehicle_id: vehicleId ? parseInt(vehicleId) : null,
        priority,
        budget: budget ? parseFloat(budget) : null,
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
            Add Project
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text className={`font-semibold ${saving ? 'text-gray-400' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Name (required) */}
          <View className="mb-4">
            <Text className={labelStyle}>Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Engine Rebuild"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={inputStyle}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className={labelStyle}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Project details..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`${inputStyle} h-24`}
            />
          </View>

          {/* Vehicle Selection */}
          <View className="mb-4">
            <Text className={labelStyle}>Vehicle</Text>
            <View className={`border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <Picker
                selectedValue={vehicleId}
                onValueChange={setVehicleId}
                style={{ color: isDark ? '#fff' : '#111' }}
              >
                <Picker.Item label="Select a vehicle..." value="" />
                {vehicles.filter(v => !v.archived).map(vehicle => (
                  <Picker.Item
                    key={vehicle.id}
                    label={vehicle.nickname || vehicle.name}
                    value={vehicle.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className={labelStyle}>Priority</Text>
            <View className={`border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <Picker
                selectedValue={priority}
                onValueChange={setPriority}
                style={{ color: isDark ? '#fff' : '#111' }}
              >
                <Picker.Item label="Not Set" value="not_set" />
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>
          </View>

          {/* Budget */}
          <View className="mb-4">
            <Text className={labelStyle}>Budget</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="decimal-pad"
              className={inputStyle}
            />
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
