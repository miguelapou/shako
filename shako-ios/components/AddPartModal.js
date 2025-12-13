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
  StyleSheet,
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
  const styles = createStyles(isDark);

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

  // Get unique vendor names from vendors list
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
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Part</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveText, saving && styles.disabledText]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Part Name (required) */}
          <View style={styles.field}>
            <Text style={styles.label}>Part Name *</Text>
            <TextInput
              value={partName}
              onChangeText={setPartName}
              placeholder="e.g., Oil Filter"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.input}
            />
          </View>

          {/* Part Number */}
          <View style={styles.field}>
            <Text style={styles.label}>Part Number</Text>
            <TextInput
              value={partNumber}
              onChangeText={setPartNumber}
              placeholder="e.g., 90915-YZZD3"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* Vendor */}
          <View style={styles.field}>
            <Text style={styles.label}>Vendor</Text>
            <TextInput
              value={vendor}
              onChangeText={setVendor}
              placeholder="e.g., Amazon, eBay, Toyota"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.input}
            />
            {vendorNames.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vendorChips}>
                {vendorNames.map(name => (
                  <TouchableOpacity
                    key={name}
                    onPress={() => setVendor(name)}
                    style={[styles.chip, vendor === name && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, vendor === name && styles.chipTextSelected]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Project */}
          <View style={styles.field}>
            <Text style={styles.label}>Project</Text>
            <View style={styles.pickerContainer}>
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
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.priceField}>
              <Text style={styles.label}>Shipping</Text>
              <TextInput
                value={shipping}
                onChangeText={setShipping}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.priceField}>
              <Text style={styles.label}>Duties</Text>
              <TextInput
                value={duties}
                onChangeText={setDuties}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* Total Display */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
          </View>

          {/* Tracking */}
          <View style={styles.field}>
            <Text style={styles.label}>Tracking Number / URL</Text>
            <TextInput
              value={tracking}
              onChangeText={setTracking}
              placeholder="Tracking number or URL"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="none"
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
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: isDark ? '#d1d5db' : '#374151' },
  input: { borderWidth: 1, borderColor: isDark ? '#374151' : '#d1d5db', backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: isDark ? '#fff' : '#111' },
  pickerContainer: { borderWidth: 1, borderColor: isDark ? '#374151' : '#d1d5db', backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, overflow: 'hidden' },
  vendorChips: { marginTop: 8 },
  chip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: isDark ? '#374151' : '#e5e7eb' },
  chipSelected: { backgroundColor: '#3b82f6' },
  chipText: { fontSize: 14, color: isDark ? '#d1d5db' : '#374151' },
  chipTextSelected: { color: '#fff' },
  priceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  priceField: { flex: 1 },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 8, backgroundColor: isDark ? '#1f2937' : '#e5e7eb', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: isDark ? '#fff' : '#111' },
});
