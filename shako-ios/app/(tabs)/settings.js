import { View, Text, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress, destructive = false }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
    >
      <View className={`w-8 h-8 rounded-lg items-center justify-center ${destructive ? 'bg-red-500/20' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280'}
        />
      </View>
      <Text className={`flex-1 ml-3 text-base ${destructive ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#4b5563' : '#9ca3af'} />
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Account Section */}
      <View className="mt-6">
        <Text className={`px-4 mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ACCOUNT
        </Text>
        <View className={`mx-4 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="px-4 py-4 border-b border-gray-700">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</Text>
            <Text className={`text-base font-medium mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View className="mt-6">
        <Text className={`px-4 mb-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ABOUT
        </Text>
        <View className={`mx-4 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="px-4 py-4 border-b border-gray-700 flex-row justify-between">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Version</Text>
            <Text className={isDark ? 'text-white' : 'text-gray-900'}>1.0.0</Text>
          </View>
          <View className="px-4 py-4 flex-row justify-between">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Theme</Text>
            <Text className={isDark ? 'text-white' : 'text-gray-900'}>
              {colorScheme === 'dark' ? 'Dark' : 'Light'} (System)
            </Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View className="mt-6">
        <TouchableOpacity
          onPress={handleSignOut}
          className={`mx-4 rounded-xl py-4 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <Text className="text-red-500 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <Text className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Shako - Vehicle Parts Tracker
        </Text>
      </View>
    </View>
  );
}
