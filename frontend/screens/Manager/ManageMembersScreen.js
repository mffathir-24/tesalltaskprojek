// screens/Manager/ManageMembersScreen.js
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { projectService, userService } from '../../services/api';

const ManageMembersScreen = ({ route, navigation }) => {
  const { projectId, projectName } = route.params;
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [filterStaffOnly, setFilterStaffOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterStaffOnly) {
      const staffUsers = allUsers.filter(user => 
        user.role?.toLowerCase() === 'staff' || user.role?.toLowerCase() === 'user'
      );
      setFilteredUsers(staffUsers);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [allUsers, filterStaffOnly]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersResponse, usersResponse] = await Promise.all([
        projectService.getProjectMembers(projectId),
        userService.getAllUsers()
      ]);
      
      const membersData = membersResponse?.members || membersResponse?.Members || membersResponse?.data || membersResponse || [];
      setMembers(Array.isArray(membersData) ? membersData : []);

      const usersData = usersResponse?.users || usersResponse?.Users || usersResponse?.data || usersResponse || [];
      const availableUsers = Array.isArray(usersData) ? usersData : [];

      const memberIds = (Array.isArray(membersData) ? membersData : []).map(m => m.id);
      const filteredUsers = availableUsers.filter(u => u && u.id && !memberIds.includes(u.id));
      
      setAllUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
      setMembers([]);
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setAddingMember(true);
      await projectService.addMember(projectId, userId);
      Alert.alert('Success', 'Member added successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (userId, username) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.removeMember(projectId, userId);
              Alert.alert('Success', 'Member removed successfully');
              fetchData();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'manager':
        return { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' };
      case 'admin':
        return { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50' };
      case 'staff':
      case 'user':
        return { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50' };
      default:
        return { bg: 'bg-gray-500', text: 'text-gray-500', light: 'bg-gray-50' };
    }
  };

  const renderMember = ({ item, index }) => (
    <View className="mb-4 mx-4">
      <View className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        <View className="p-5">
          <View className="flex-row items-center">
            {/* Avatar dengan gradient */}
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            >
              <Text className="text-lg font-bold text-white">
                {item.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            
            {/* User Info */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800 mb-1">
                {item.username || 'Unknown User'}
              </Text>
              <Text className="text-sm text-gray-600 mb-2">
                {item.email || 'No email'}
              </Text>
              <View className={`self-start px-3 py-1 rounded-full ${getRoleColor(item.role).light}`}>
                <Text className={`text-xs font-bold ${getRoleColor(item.role).text}`}>
                  {item.role?.toUpperCase() || 'USER'}
                </Text>
              </View>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-red-50 items-center justify-center ml-2"
              onPress={() => handleRemoveMember(item.id, item.username)}
            >
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row border-t border-gray-100">
          <View className="flex-1 items-center justify-center py-3 border-r border-gray-100">
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">Active</Text>
          </View>
          <View className="flex-1 items-center justify-center py-3">
            <Ionicons name="checkmark-done-outline" size={16} color="#6b7280" />
            <Text className="text-xs text-gray-600 mt-1">Member</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAvailableUser = ({ item }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
      onPress={() => handleAddMember(item.id)}
      disabled={addingMember}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-400 items-center justify-center mr-4">
          <Text className="text-base font-bold text-white">
            {item.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        
        {/* User Info */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800 mb-1">
            {item.username || 'Unknown User'}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {item.email || 'No email'}
          </Text>
          <View className={`self-start px-2 py-1 rounded-full ${getRoleColor(item.role).light}`}>
            <Text className={`text-xs font-bold ${getRoleColor(item.role).text}`}>
              {item.role?.toUpperCase() || 'USER'}
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
          <Ionicons name="add" size={20} color="#10b981" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4facfe" />
        <Text className="mt-4 text-base text-gray-600 font-medium">Loading members...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header dengan Gradient */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        className="pt-14 pb-8 px-6"
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white mb-1">Manage Members</Text>
            <Text className="text-base text-white/80">{projectName}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="people" size={20} color="#fff" />
              <Text className="text-2xl font-bold text-white">{members.length}</Text>
            </View>
            <Text className="text-xs text-white/80 font-medium">Current Members</Text>
          </View>

          <View className="flex-1 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text className="text-2xl font-bold text-white">{filteredUsers.length}</Text>
            </View>
            <Text className="text-xs text-white/80 font-medium">Available</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Members List */}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6">
              <Ionicons name="people-outline" size={48} color="#4facfe" />
            </View>
            <Text className="text-xl font-bold text-gray-800 text-center mb-2">
              No Members Yet
            </Text>
            <Text className="text-base text-gray-500 text-center leading-6">
              Start by adding members to collaborate on this project
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute right-6 bottom-6 w-16 h-16 rounded-full shadow-2xl"
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          className="w-16 h-16 rounded-full items-center justify-center"
        >
          <Ionicons name="person-add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Member Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-4/5">
            {/* Modal Header */}
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-gray-800">Add Team Member</Text>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => setShowAddModal(false)}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              {/* Filter Toggle */}
              <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800 mb-1">
                    Show Staff Only
                  </Text>
                  <Text className="text-xs text-gray-600">
                    Filter to show only staff members
                  </Text>
                </View>
                <TouchableOpacity
                  className={`w-12 h-6 rounded-full flex-row items-center px-1 ${
                    filterStaffOnly ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                  onPress={() => setFilterStaffOnly(!filterStaffOnly)}
                >
                  <View className="w-4 h-4 rounded-full bg-white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Available Users List */}
            <FlatList
              data={filteredUsers}
              renderItem={renderAvailableUser}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center justify-center py-16 px-8">
                  <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
                    <Ionicons name="checkmark-circle-outline" size={40} color="#10b981" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800 text-center mb-2">
                    All Users Are Members
                  </Text>
                  <Text className="text-sm text-gray-500 text-center">
                    {filterStaffOnly 
                      ? 'No staff members available to add' 
                      : 'No available users to add to this project'
                    }
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageMembersScreen;