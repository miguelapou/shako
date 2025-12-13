import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Check your email to confirm your account');
      } else {
        await signIn(email, password);
        router.replace('/(tabs)/vehicles');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Shako
          </Text>
          <Text className={`text-lg mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vehicle Parts Tracker
          </Text>
        </View>

        <View className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <Text className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>

          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              autoCapitalize="none"
              keyboardType="email-address"
              className={`border rounded-lg px-4 py-3 text-base ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </View>

          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              secureTextEntry
              className={`border rounded-lg px-4 py-3 text-base ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-lg py-4 items-center ${
              loading ? 'bg-blue-400' : 'bg-blue-600'
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            className="mt-4 items-center"
          >
            <Text className={isDark ? 'text-blue-400' : 'text-blue-600'}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
