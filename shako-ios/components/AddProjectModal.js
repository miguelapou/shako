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
import { createProject } from '../services/projectsService';

export default function AddProjectModal({ visible, vehicles, onClose, onSave, isDark }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [priority, setPriority] = useState('not_set');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const styles = createStyles(isDark);

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
          <Text style={styles.headerTitle}>Add Project</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveText, saving && styles.disabledText]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Name (required) */}
          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Engine Rebuild"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              style={styles.input}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Project details..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* Vehicle Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Vehicle</Text>
            <View style={styles.pickerContainer}>
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
          <View style={styles.field}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.pickerContainer}>
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
          <View style={styles.field}>
            <Text style={styles.label}>Budget</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="decimal-pad"
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
  textArea: { height: 96, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderColor: isDark ? '#374151' : '#d1d5db', backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 8, overflow: 'hidden' },
});
