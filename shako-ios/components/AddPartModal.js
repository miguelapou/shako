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
import { createPart } from '../services/partsService';

export default function AddPartModal({ visible, projects, vendors, onClose, onSave, isDark }) {
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [vendor, setVendor] = useState('');
  const [projectId, setProjectId] = useState('');
  const [price, setPrice] = useState('');
  const [shipping, setShipping] = useState('');
  const [duties, setDuties] = useState('');
  const [tracking, setTracking] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const resetForm = () => {
    setPartName('');
    setPartNumber('');
    setVendor('');
    setProjectId('');
    setPrice('');
    setShipping('');
    setDuties('');
    setTracking('');
  };

  const calculateTotal = () => {
    const p = parseFloat(price) || 0;
    const s = parseFloat(shipping) || 0;
    const d = parseFloat(duties) || 0;
    return p + s + d;
  };

  const handleSave = async () => {
    if (!partName.trim()) {
      Alert.alert('Error', 'Please enter a part name');
      return;
    }

    setSaving(true);
    try {
      await createPart({
        part: partName.trim(),
        partNumber: partNumber.trim() || null,
        vendor: vendor.trim() || null,
        projectId: projectId ? parseInt(projectId) : null,
        price: price ? parseFloat(price) : 0,
        shipping: shipping ? parseFloat(shipping) : 0,
        duties: duties ? parseFloat(duties) : 0,
        total: calculateTotal(),
        tracking: tracking.trim() || null,
        purchased: false,
        shipped: false,
        delivered: false,
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

  // Get unique vendor names from both vendors list and custom entry
  const vendorNames = [...new Set(vendors.map(v => v.name))];

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
            Add Part
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text className={`font-semibold ${saving ? 'text-gray-400' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Part Name (required) */}
          <View className="mb-4">
            <Text className={labelStyle}>Part Name *</Text>
            <TextInput
              value={partName}
              onChangeText={setPartName}
              placeholder="e.g., Oil Filter"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={inputStyle}
            />
          </View>

          {/* Part Number */}
          <View className="mb-4">
            <Text className={labelStyle}>Part Number</Text>
            <TextInput
              value={partNumber}
              onChangeText={setPartNumber}
              placeholder="e.g., 90915-YZZD3"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              className={inputStyle}
            />
          </View>

          {/* Vendor */}
          <View className="mb-4">
            <Text className={labelStyle}>Vendor</Text>
            <TextInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g., Amazon, eBay, Toyota"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={inputStyle}
            />
            {vendorNames.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                {vendorNames.map(name => (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setVendor(name)}
                    className={`mr-2 px-3 py-1 rounded-full ${
                      vendor === name
                        ? 'bg-blue-600'
                        : isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={vendor === name ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Project */}
          <View className="mb-4">
            <Text className={labelStyle}>Project</Text>
            <View className={`border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <Picker
                selectedValue={projectId}
                onValueChange={setProjectId}
                style={{ color: isDark ? '#fff' : '#111' }}
              >
                <Picker.Item label="Select a project..." value="" />
                {projects.filter(p => !p.archived).map(project => (
                  <Picker.Item
                    key={project.id}
                    label={project.name}
                    value={project.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Pricing Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className={labelStyle}>Price</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={inputStyle}
              />
            </View>
            <View className="flex-1">
              <Text className={labelStyle}>Shipping</Text>
              <TextInput
                value={shipping}
                onChangeText={setShipping}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={inputStyle}
              />
            </View>
            <View className="flex-1">
              <Text className={labelStyle}>Duties</Text>
              <TextInput
                value={duties}
                onChangeText={setDuties}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                className={inputStyle}
              />
            </View>
          </View>

          {/* Total Display */}
          <View className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <View className="flex-row justify-between">
              <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total</Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Tracking */}
          <View className="mb-4">
            <Text className={labelStyle}>Tracking Number / URL</Text>
            <TextInput
              value={tracking}
              onChangeText={setTracking}
              placeholder="Tracking number or URL"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="none"
              className={inputStyle}
            />
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
