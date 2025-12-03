
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { projectService, taskService } from '../../services/api';

const ManagerProjectDetailScreen = ({ route, navigation }) => {
  const { projectId, members: initialMembers } = route.params;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState(initialMembers || []);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const searchAnim = useState(new Animated.Value(0))[0];
  
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  const isTablet = width >= 768;

  useEffect(() => {
    fetchProjectData();
  }, []);

  useEffect(() => {
    if (project) {
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
  }, [project]);

  useEffect(() => {
    if (activeTab === 'members') {
      if (searchQuery.trim() === '') {
        setFilteredMembers(members);
      } else {
        const filtered = members.filter(member =>
          member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredMembers(filtered);
      }
    }
  }, [searchQuery, members, activeTab]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      if (searchQuery.trim() === '') {
        setFilteredTasks(tasks);
      } else {
        const filtered = tasks.filter(task =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.assignee?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.status?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTasks(filtered);
      }
    }
  }, [searchQuery, tasks, activeTab]);

  useEffect(() => {
    setSearchQuery('');
    setFilteredMembers(members);
    setFilteredTasks(tasks);
    setShowSearch(false);
  }, [activeTab, members, tasks]);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: showSearch ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSearch]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectResponse, tasksResponse] = await Promise.all([
        projectService.getProjectById(projectId),
        taskService.getProjectTasks(projectId)
      ]);

      const projectData = projectResponse.Project || projectResponse.project || projectResponse;
      const tasksData = tasksResponse.tasks || tasksResponse.Tasks || tasksResponse.data || tasksResponse;

      setProject(projectData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setFilteredTasks(Array.isArray(tasksData) ? tasksData : []);
      
    } catch (error) {
      console.error('❌ Error fetching project data:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjectData();
  }, [projectId]);

  const handleDeleteTask = (taskId, taskTitle) => {
      if (Platform.OS === 'web') {
        setTaskToDelete({ id: taskId, title: taskTitle });
        setShowDeleteModal(true);
      } else {
        Alert.alert(
          'Delete Task',
          `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await performDeleteTask(taskId, taskTitle);
              },
            },
          ]
        );
      }
    };

    const performDeleteTask = async (taskId, taskTitle) => {
      try {
        setDeleting(true);
        await taskService.deleteTask(projectId, taskId);
        
        if (Platform.OS === 'web') {
          alert('Task deleted successfully');
        } else {
          Alert.alert('Success', 'Task deleted successfully');
        }
        
        fetchProjectData();
        
      } catch (error) {
        console.error('Error deleting task:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete task';
        
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setDeleting(false);
        setShowDeleteModal(false);
        setTaskToDelete(null);
      }
    };

  const handleEditTask = (task) => {
    navigation.navigate('EditTask', { 
      taskId: task.id,
      projectId: projectId,
      taskData: task
    });
  };

  const handleTaskPress = (task) => {
    navigation.navigate('ManagerTaskDetail', { 
      taskId: task.id,
      projectId: projectId
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return '#ef4444';
      case 'in-progress':
      case 'in_progress':
        return '#3b82f6';
      case 'done':
      case 'completed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return 'bg-red-500';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-500';
      case 'done':
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return 'alert-circle-outline';
      case 'in-progress':
      case 'in_progress':
        return 'sync-outline';
      case 'done':
      case 'completed':
        return 'checkmark-done-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
      return 'Not set';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => 
      task.status?.toLowerCase() === 'done' || 
      task.status?.toLowerCase() === 'completed'
    ).length;
    const inProgress = tasks.filter(task => 
      task.status?.toLowerCase() === 'in-progress' || 
      task.status?.toLowerCase() === 'in_progress'
    ).length;
    const todo = tasks.filter(task => 
      task.status?.toLowerCase() === 'todo'
    ).length;

    return { total, completed, inProgress, todo, progress: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const renderOverview = () => {
    const stats = getProgressStats();
    const cardWidth = isTablet ? '23%' : isSmallScreen ? '48%' : '48%';
            const statCards = [
          {
            key: 'total',
            value: stats.total,
            label: 'Total Tasks',
            icon: 'list-outline',
            iconColor: '#8b5cf6',
            bgColor: 'bg-purple-100',
            borderColor: 'hover:border-purple-200'
          },
          {
            key: 'completed',
            value: stats.completed,
            label: 'Completed',
            icon: 'checkmark-done-outline',
            iconColor: '#10b981',
            bgColor: 'bg-green-100',
            borderColor: 'hover:border-green-200'
          },
          {
            key: 'inProgress',
            value: stats.inProgress,
            label: 'In Progress',
            icon: 'sync-outline',
            iconColor: '#3b82f6',
            bgColor: 'bg-blue-100',
            borderColor: 'hover:border-blue-200'
          },
          {
            key: 'todo',
            value: stats.todo,
            label: 'To Do',
            icon: 'alert-circle-outline',
            iconColor: '#ef4444',
            bgColor: 'bg-red-100',
            borderColor: 'hover:border-red-200'
          }
        ];
    
    return (
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 p-6" 
        showsVerticalScrollIndicator={false}
      >
        {/* Project Stats Grid */}
        <View className={`flex-row flex-wrap mb-6 ${isTablet ? 'justify-between' : 'justify-center'}`}>
          {statCards.map((card, index) => (
            <View 
              key={card.key}
              className={`
                ${isTablet ? 'w-[23%]' : isSmallScreen ? 'w-[48%]' : 'w-[48%]'} 
                ${isSmallScreen ? 'mx-1 mb-3' : 'mx-2 mb-4'}
                ${isTablet ? 'min-w-[180px]' : ''}
                ${index >= 2 && !isTablet ? 'mt-4' : ''}
              `}
            >
              <View className={`bg-white rounded-3xl p-5 h-full shadow-2xl border border-gray-100 hover:shadow-3xl ${card.borderColor} transition-all duration-300`}>
                <View className={`${isSmallScreen ? 'w-10 h-10' : 'w-12 h-12'} rounded-2xl ${card.bgColor} items-center justify-center mb-3`}>
                  <Ionicons 
                    name={card.icon} 
                    size={isSmallScreen ? 20 : 24} 
                    color={card.iconColor} 
                  />
                </View>
                <Text className={`${isSmallScreen ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mb-1`}>
                  {card.value}
                </Text>
                <Text className={`${isSmallScreen ? 'text-xs' : 'text-sm'} font-semibold text-gray-600`}>
                  {card.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Progress Section with Animation */}
        <Animated.View 
          className="bg-white rounded-3xl p-6 mb-6 shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300"
          style={{
            transform: [{
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
              })
            }]
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xl font-bold text-gray-800">Project Progress</Text>
              <Text className="text-sm text-gray-500 mt-1">Overall completion rate</Text>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-black text-green-500">{stats.progress}%</Text>
              <Text className="text-xs text-gray-500 mt-1">
                {stats.completed}/{stats.total} tasks
              </Text>
            </View>
          </View>
          <View className="h-4 bg-gray-200 rounded-full overflow-hidden mb-3 relative">
            <View 
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-lg"
              style={{ 
                width: `${stats.progress}%`,
                transition: 'width 1s ease-in-out'
              }}
            />
            <View className="absolute top-0 right-0 bottom-0 left-0 rounded-full overflow-hidden">
              <View className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </View>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">0%</Text>
            <Text className="text-xs text-gray-500">50%</Text>
            <Text className="text-xs text-gray-500">100%</Text>
          </View>
        </Animated.View>

        {/* Project Details Card */}
        <View className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-800">Project Details</Text>
            <TouchableOpacity 
              className="flex-row items-center bg-purple-50 px-4 py-2 rounded-full active:bg-purple-100"
              onPress={() => navigation.navigate('CreateTask', { projectId })}
            >
              <Ionicons name="add-circle-outline" size={18} color="#8b5cf6" />
              <Text className="text-purple-600 font-semibold ml-2">Add Task</Text>
            </TouchableOpacity>
          </View>
          
          <View className="space-y-5">
            <View className="flex-row items-start p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <View className="w-12 h-12 rounded-2xl bg-purple-100 items-center justify-center mr-4 flex-shrink-0">
                <Ionicons name="document-text-outline" size={24} color="#8b5cf6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-500 mb-1">Description</Text>
                <Text className="text-base text-gray-800 leading-6">
                  {project?.deskripsi || 'No description provided'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center mr-4 flex-shrink-0">
                <Ionicons name="person-outline" size={24} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-500 mb-1">Project Manager</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {project?.manager?.username || 'You'}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {project?.manager?.email || 'You are managing this project'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <View className="w-12 h-12 rounded-2xl bg-green-100 items-center justify-center mr-4 flex-shrink-0">
                <Ionicons name="calendar-outline" size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-500 mb-1">Created</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {formatDate(project?.created_at)}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Project ID: {projectId}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderMemberItem = ({ item, index }) => (
    <Animated.View
      className={`bg-white rounded-3xl overflow-hidden mb-4 shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 ${
        isTablet ? 'mx-2' : ''
      }`}
      style={{
        marginLeft: isTablet && index % 2 === 1 ? 8 : 0,
        marginRight: isTablet && index % 2 === 0 ? 8 : 0,
        width: isTablet ? '48%' : '100%',
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}
    >
      <LinearGradient
        colors={['#f8fafc', '#ffffff']}
        className="p-5"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <LinearGradient
              colors={['#8b5cf6', '#ec4899']}
              className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-lg"
            >
              <Text className="text-lg font-bold text-white">
                {item.username?.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-800 mb-1 truncate">
                {item.username}
              </Text>
              <Text className="text-sm text-gray-600 truncate" numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </View>
          <View className={`px-3 py-2 rounded-full shadow-sm ${
            item.role === 'manager' ? 'bg-blue-500' : 
            item.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
          }`}>
            <View className="flex-row items-center">
              <Ionicons 
                name={item.role === 'manager' ? 'briefcase' : 
                      item.role === 'admin' ? 'shield-checkmark' : 'person'} 
                size={12} 
                color="#ffffff" 
              />
              <Text className="text-xs font-bold text-white ml-1 truncate" style={{ maxWidth: 60 }}>
                {item.role?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        <View className="border-t border-gray-100 pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500 font-medium">
              Member since {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderTaskItem = ({ item, index }) => (
    <TouchableOpacity
      className={`bg-white rounded-3xl overflow-hidden mb-4 shadow-2xl border border-gray-100 active:scale-95 transition-all duration-200 hover:shadow-3xl ${
        isTablet ? 'mx-2' : ''
      }`}
      onPress={() => handleTaskPress(item)}
      activeOpacity={0.7}
      style={{
        marginLeft: isTablet && index % 2 === 1 ? 8 : 0,
        marginRight: isTablet && index % 2 === 0 ? 8 : 0,
        width: isTablet ? '48%' : '100%',
      }}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        className="p-5"
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-start flex-1 mr-3">
            <View className="mt-1 mr-3">
              <Ionicons 
                name={getStatusIcon(item.status)} 
                size={22} 
                color={getStatusColor(item.status)} 
              />
            </View>
            <Text className="text-base font-bold text-gray-800 flex-1 leading-6" numberOfLines={2}>
              {item.title || 'Untitled Task'}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full shadow-sm ${getStatusBgColor(item.status)}`}>
            <Text className="text-xs font-bold text-white" style={{ fontSize: 10 }}>
              {item.status?.replace('-', ' ').toUpperCase() || 'TODO'}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text className="text-sm text-gray-600 leading-5 mb-4 pl-10" numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 items-center justify-center mr-3 shadow-md">
              <Text className="text-xs font-bold text-white">
                {item.assignee?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-semibold text-gray-500">Assigned to</Text>
              <Text className="text-sm font-bold text-gray-800 truncate" style={{ maxWidth: width * 0.3 }}>
                {item.assignee?.username || 'Unassigned'}
              </Text>
            </View>
          </View>

          {item.due_date && (
            <View className="flex-row items-center bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-full shadow-sm">
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text className="text-xs font-semibold text-gray-600 ml-2 truncate" style={{ maxWidth: width * 0.2 }}>
                Due {formatDate(item.due_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons for Manager */}
        <View className="flex-row border-t border-gray-100 mt-4 pt-4">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 bg-blue-50 rounded-xl mr-2 active:bg-blue-100"
            onPress={() => handleEditTask(item)}
          >
            <Ionicons name="create-outline" size={18} color="#3b82f6" />
            <Text className="text-sm font-semibold text-blue-600 ml-2">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ml-2 ${
              deleting && taskToDelete?.id === item.id 
                ? 'bg-red-100' 
                : 'bg-red-50 active:bg-red-100'
            }`}
            onPress={() => handleDeleteTask(item.id, item.title)}
            disabled={deleting && taskToDelete?.id === item.id}
            activeOpacity={0.7}
          >
            {deleting && taskToDelete?.id === item.id ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#ef4444" />
                <Text className="text-sm font-semibold text-red-600 ml-2">Deleting...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="text-sm font-semibold text-red-600 ml-2">Delete</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'web' && showDeleteModal && (
            <Modal
              visible={showDeleteModal}
              transparent={true}
              onRequestClose={() => {
                if (!deleting) {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }
              }}
              style={{
                position: 'fixed',
                zIndex: 9999,
              }}
            >
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}>
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 20,
                  padding: 24,
                  width: '90%',
                  maxWidth: 400,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 10,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                }}>
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <LinearGradient
                      colors={['#ef4444', '#dc2626']}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <Ionicons name="warning" size={28} color="#fff" />
                    </LinearGradient>
                    
                    <Text style={{ 
                      fontSize: 20, 
                      fontWeight: 'bold', 
                      color: '#0f172a', 
                      marginBottom: 8,
                      textAlign: 'center'
                    }}>
                      Delete Task
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#64748b', 
                      textAlign: 'center', 
                      lineHeight: 20,
                      marginBottom: 8
                    }}>
                      Are you sure you want to delete "{taskToDelete?.title}"?
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#ef4444', 
                      textAlign: 'center', 
                      fontWeight: '600'
                    }}>
                      This action cannot be undone.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        backgroundColor: '#f1f5f9',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        if (!deleting) {
                          setShowDeleteModal(false);
                          setTaskToDelete(null);
                        }
                      }}
                      disabled={deleting}
                      activeOpacity={0.7}
                    >
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: deleting ? '#94a3b8' : '#475569' 
                      }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        backgroundColor: deleting ? '#fca5a5' : '#ef4444',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: deleting ? 0.8 : 1,
                      }}
                      onPress={() => taskToDelete && performDeleteTask(taskToDelete.id, taskToDelete.title)}
                      disabled={deleting}
                      activeOpacity={0.7}
                    >
                      {deleting ? (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScrollView 
        contentContainerStyle={{ flex: 1 }}
        className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50"
      >
        <View className="flex-1 justify-center items-center min-h-screen">
          <View className="items-center">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="mt-6 text-xl font-bold text-gray-800">Loading Project Details</Text>
            <Text className="mt-2 text-sm text-gray-500 text-center max-w-xs">
              Fetching project information and team data...
            </Text>
            <View className="mt-8 w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  const searchBarHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72]
  });

  const searchBarOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <ScrollView 
      className="flex-1 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      style={{ 
        height: '100vh',
        overflow: 'scroll',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb', '#1d4ed8']}
        className="pt-16 pb-6 rounded-b-3xl shadow-2xl"
      >
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center active:bg-white/30 shadow-lg"
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View className="flex-1 mx-4" style={{ maxWidth: width * 0.6 }}>
              <Text 
                className="text-2xl font-black text-white text-center mb-1 truncate"
                numberOfLines={1}
                style={{ fontSize: isSmallScreen ? 20 : 24 }}
              >
                {project?.nama || 'Project Details'}
              </Text>
              <Text 
                className="text-blue-100 text-sm text-center truncate"
                numberOfLines={1}
              >
                {project?.deskripsi || 'Project management and task tracking'}
              </Text>
            </View>

            <TouchableOpacity 
              className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center active:bg-white/30 shadow-lg"
              onPress={() => setShowSearch(!showSearch)}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View className="flex-row justify-center mt-2">
            <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              <View className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              <Text className="text-white text-sm font-bold">Managed by You</Text>
              <Text className="text-white/80 text-xs ml-2">• Updated just now</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Animated Search Bar */}
      <Animated.View 
        style={{
          height: searchBarHeight,
          opacity: searchBarOpacity,
          overflow: 'hidden'
        }}
      >
        <View className="px-6 pt-2">
          <View className="bg-white rounded-2xl px-4 py-3 shadow-2xl border border-blue-200">
            <View className="flex-row items-center">
              <Ionicons name="search" size={20} color="#3b82f6" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder={
                  activeTab === 'members' 
                    ? 'Search members...' 
                    : activeTab === 'tasks'
                    ? 'Search tasks...'
                    : 'Search in project...'
                }
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={showSearch}
              />
              {searchQuery ? (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  className="p-1 active:opacity-70"
                >
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          minHeight: 400
        }}
      >
        {/* Tab Navigation */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-1 shadow-2xl border border-gray-100">
          <View className="flex-row">
            {['overview', 'members', 'tasks'].map((tab) => (
              <TouchableOpacity
                key={tab}
                className={`flex-1 flex-row items-center justify-center py-4 rounded-xl ${
                  activeTab === tab ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''
                } active:opacity-80`}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <View className="relative">
                  <Ionicons 
                    name={
                      tab === 'overview' ? 'grid' :
                      tab === 'members' ? 'people' : 'list'
                    } 
                    size={20} 
                    color={activeTab === tab ? '#3b82f6' : '#6b7280'} 
                  />
                  {activeTab === tab && (
                    <View className="absolute -bottom-1 left-1/2 w-1 h-1 bg-blue-500 rounded-full -translate-x-1/2" />
                  )}
                </View>
                <Text className={`text-sm font-bold ml-3 ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {tab === 'overview' ? 'Overview' :
                   tab === 'members' ? `Members (${members.length})` :
                   `Tasks (${tasks.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Area */}
        <View className="flex-1" style={{ minHeight: 500 }}>
          {activeTab === 'overview' && (
            <View style={{ flex: 1 }}>
              {renderOverview()}
            </View>
          )}
          
          {activeTab === 'members' && (
            <View style={{ flex: 1, minHeight: 400 }}>
              <FlatList
                data={filteredMembers}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                scrollEnabled={false}
                contentContainerStyle={{ 
                  padding: 16,
                  paddingBottom: 40
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3b82f6', '#8b5cf6']}
                    tintColor="#3b82f6"
                    progressBackgroundColor="#ffffff"
                  />
                }
                numColumns={isTablet ? 2 : 1}
                columnWrapperStyle={isTablet ? { justifyContent: 'space-between' } : null}
                ListEmptyComponent={
                  <View className="items-center justify-center py-20 px-8 min-h-[400px]">
                    <View className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 items-center justify-center mb-6 border-4 border-white shadow-2xl">
                      <Ionicons 
                        name={searchQuery ? "search" : "people"} 
                        size={80} 
                        color="#3b82f6" 
                      />
                    </View>
                    <Text className="text-2xl font-black text-gray-800 text-center mb-3">
                      {searchQuery ? "No Members Found" : "No Team Members"}
                    </Text>
                    <Text className="text-base text-gray-600 text-center leading-6 max-w-sm">
                      {searchQuery 
                        ? `No members found matching "${searchQuery}". Try a different search term.`
                        : "This project doesn't have any team members assigned yet."
                      }
                    </Text>
                    {searchQuery && (
                      <TouchableOpacity 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl px-8 py-4 mt-8 shadow-lg active:scale-95"
                        onPress={() => setSearchQuery('')}
                      >
                        <Text className="text-white text-base font-bold">Clear Search</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {activeTab === 'tasks' && (
            <View style={{ flex: 1, minHeight: 400 }}>
              <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                scrollEnabled={false}
                contentContainerStyle={{ 
                  padding: 16,
                  paddingBottom: 40
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3b82f6', '#8b5cf6']}
                    tintColor="#3b82f6"
                    progressBackgroundColor="#ffffff"
                  />
                }
                numColumns={isTablet ? 2 : 1}
                columnWrapperStyle={isTablet ? { justifyContent: 'space-between' } : null}
                ListEmptyComponent={
                  <View className="items-center justify-center py-20 px-8 min-h-[400px]">
                    <View className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 items-center justify-center mb-6 border-4 border-white shadow-2xl">
                      <Ionicons 
                        name={searchQuery ? "search" : "list"} 
                        size={80} 
                        color="#3b82f6" 
                      />
                    </View>
                    <Text className="text-2xl font-black text-gray-800 text-center mb-3">
                      {searchQuery ? "No Tasks Found" : "No Tasks Yet"}
                    </Text>
                    <Text className="text-base text-gray-600 text-center leading-6 max-w-sm">
                      {searchQuery 
                        ? `No tasks found matching "${searchQuery}". Try a different search term.`
                        : "This project doesn't have any tasks created yet."
                      }
                    </Text>
                    {searchQuery && (
                      <TouchableOpacity 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl px-8 py-4 mt-8 shadow-lg active:scale-95"
                        onPress={() => setSearchQuery('')}
                      >
                        <Text className="text-white text-base font-bold">Clear Search</Text>
                      </TouchableOpacity>
                    )}
                    {!searchQuery && (
                      <TouchableOpacity 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl px-8 py-4 mt-8 shadow-lg active:scale-95"
                        onPress={() => navigation.navigate('CreateTask', { projectId })}
                      >
                        <Text className="text-white text-base font-bold">Create First Task</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </Animated.View>

      {/* FAB for Creating Task */}
      <TouchableOpacity
        className="absolute right-6 bottom-6 w-16 h-16 rounded-full shadow-2xl active:scale-95"
        onPress={() => navigation.navigate('CreateTask', { projectId })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6']}
          className="w-16 h-16 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ManagerProjectDetailScreen;