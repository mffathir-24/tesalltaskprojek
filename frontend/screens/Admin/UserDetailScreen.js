
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { userService } from '../../services/api';

const UserDetailScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  useEffect(() => {
    if (user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(userId);
      console.log('User detail response:', response);
      
      const userData = response.Users || response;
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      Alert.alert('Error', 'Failed to fetch user details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserDetail();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'staff':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'shield-checkmark';
      case 'manager':
        return 'briefcase';
      case 'staff':
        return 'person';
      default:
        return 'person-outline';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 border-purple-200';
      case 'manager':
        return 'bg-blue-100 border-blue-200';
      case 'staff':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getRoleTextColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'text-purple-800';
      case 'manager':
        return 'text-blue-800';
      case 'staff':
        return 'text-green-800';
      default:
        return 'text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
      return 'Not updated';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditUser = () => {
    navigation.navigate('EditUser', { userId, user });
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user?.username}? This action cannot be undone and will remove all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete User',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const InfoRow = ({ icon, label, value, isRole = false, isId = false }) => (
    <View className="flex-row items-center py-4 border-b border-gray-100 last:border-b-0">
      <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color="#8b5cf6" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-500 mb-1">{label}</Text>
        {isRole ? (
          <View className={`flex-row items-center self-start px-3 py-1 rounded-full border ${getRoleBadgeColor(value)}`}>
            <Ionicons 
              name={getRoleIcon(value)} 
              size={14} 
              color={getRoleTextColor(value).replace('text-', '#').replace('-800', '')} 
            />
            <Text className={`text-xs font-bold ml-1 ${getRoleTextColor(value)}`}>
              {value?.toUpperCase()}
            </Text>
          </View>
        ) : isId ? (
          <Text className="text-base font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
            {value}
          </Text>
        ) : (
          <Text className="text-base font-semibold text-gray-800">{value}</Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-4 text-lg font-semibold text-gray-700">Loading User Details...</Text>
        <Text className="mt-2 text-sm text-gray-500">Please wait while we fetch user information</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-purple-50 to-blue-50 px-8">
        <View className="w-32 h-32 rounded-full bg-red-100 items-center justify-center mb-6 border-2 border-white shadow-lg">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-3">User Not Found</Text>
        <Text className="text-base text-gray-600 text-center leading-6 mb-8">
          The user you're looking for doesn't exist or may have been deleted.
        </Text>
        <TouchableOpacity 
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl px-8 py-4 shadow-lg"
          onPress={fetchUserDetail}
        >
          <Text className="text-white text-base font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        className="pt-16 pb-6 rounded-b-3xl shadow-2xl"
      >
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-white">User Details</Text>
              <Text className="text-purple-100 text-sm mt-1">
                Complete user information and management
              </Text>
            </View>

            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              onPress={handleEditUser}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
      >
        <Animated.View 
          className="p-6"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* User Profile Card */}
          <View className="bg-white rounded-3xl p-8 mb-6 shadow-2xl border border-gray-100">
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                className="w-24 h-24 rounded-3xl items-center justify-center mb-4 shadow-lg"
              >
                <Text className="text-3xl font-bold text-white">
                  {user.username?.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl font-bold text-gray-800 mr-3">
                  {user.username}
                </Text>
                <View className={`px-3 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={getRoleIcon(user.role)} 
                      size={14} 
                      color={getRoleTextColor(user.role).replace('text-', '#').replace('-800', '')} 
                    />
                    <Text className={`text-xs font-bold ml-1 ${getRoleTextColor(user.role)}`}>
                      {user.role?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Text className="text-gray-600 text-base">{user.email}</Text>
            </View>

            {/* Quick Stats */}
            <View className="flex-row justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mb-2">
                  <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Member Since</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatDate(user.created_at).split(',')[0]}
                </Text>
              </View>
              
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mb-2">
                  <Ionicons name="time-outline" size={20} color="#3b82f6" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Last Active</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {formatDate(user.updated_at).split(',')[0]}
                </Text>
              </View>
              
              <View className="items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mb-2">
                  <Ionicons name="checkmark-done-outline" size={20} color="#10b981" />
                </View>
                <Text className="text-xs font-medium text-gray-600">Status</Text>
                <Text className="text-sm font-semibold text-green-600">Active</Text>
              </View>
            </View>
          </View>

          {/* User Information */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-2xl border border-gray-100">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-2xl bg-purple-500 items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color="#ffffff" />
              </View>
              <Text className="text-xl font-bold text-gray-800">User Information</Text>
            </View>

            <View className="bg-gray-50 rounded-2xl p-4">
              <InfoRow
                icon="person-circle-outline"
                label="Username"
                value={user.username}
              />
              
              <InfoRow
                icon="mail-outline"
                label="Email Address"
                value={user.email}
              />
              
              <InfoRow
                icon="key-outline"
                label="Role"
                value={user.role}
                isRole={true}
              />
              
              <InfoRow
                icon="calendar-outline"
                label="Member Since"
                value={formatDate(user.created_at)}
              />
              
              <InfoRow
                icon="time-outline"
                label="Last Updated"
                value={formatDate(user.updated_at)}
              />
              
              <InfoRow
                icon="finger-print-outline"
                label="User ID"
                value={userId}
                isId={true}
              />
            </View>
          </View>

          {/* Permissions & Access */}
          <View className="bg-white rounded-3xl p-6 mb-6 shadow-2xl border border-gray-100">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 rounded-2xl bg-blue-500 items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
              </View>
              <Text className="text-xl font-bold text-gray-800">Permissions & Access</Text>
            </View>

            <View className="space-y-3">
              {user.role === 'admin' && (
                <View className="flex-row items-center p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <Ionicons name="checkmark-circle" size={20} color="#8b5cf6" />
                  <Text className="text-purple-800 font-semibold ml-3">
                    Full system administrator access
                  </Text>
                </View>
              )}
              
              {user.role === 'manager' && (
                <>
                  <View className="flex-row items-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                    <Text className="text-blue-800 font-semibold ml-3">
                      Project creation and management
                    </Text>
                  </View>
                  <View className="flex-row items-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                    <Text className="text-blue-800 font-semibold ml-3">
                      Team member assignment
                    </Text>
                  </View>
                </>
              )}
              
              {user.role === 'staff' && (
                <>
                  <View className="flex-row items-center p-4 bg-green-50 rounded-2xl border border-green-200">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-green-800 font-semibold ml-3">
                      Task viewing and updates
                    </Text>
                  </View>
                  <View className="flex-row items-center p-4 bg-green-50 rounded-2xl border border-green-200">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-green-800 font-semibold ml-3">
                      File uploads and comments
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg"
              onPress={handleEditUser}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Edit User</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg"
              onPress={handleDeleteUser}
            >
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default UserDetailScreen;