// screens/Staff/StaffTasksScreen.js
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { taskService } from '../../services/api';

const StaffTasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMyTasks();
  }, []);

  useEffect(() => {
    filterTasksByStatus();
  }, [tasks, filterStatus]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching my tasks...');
      const response = await taskService.getMyTasks();
      
      const tasksData = response?.tasks || response?.Tasks || response?.data || response || [];
      console.log('📋 Full tasks response:', response);
      console.log('📋 Tasks data with projects:', tasksData);
      
      if (tasksData.length > 0) {
        console.log('🔍 First task structure:', tasksData[0]);
        console.log('🏢 Project data in first task:', tasksData[0]?.Project);
      }
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTasksByStatus = () => {
    if (filterStatus === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.status === filterStatus));
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyTasks();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return '#ef4444';
      case 'in-progress':
        return '#f59e0b';
      case 'done':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return 'alert-circle-outline';
      case 'in-progress':
        return 'sync-outline';
      case 'done':
        return 'checkmark-done-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getProjectName = (task) => {
    console.log('🔍 Task structure for project lookup:', {
        taskId: task.id,
        hasProject: !!task.Project,
        hasProjectObject: task.Project,
        projectNama: task.Project?.nama,
        projectName: task.Project?.name,
        projectId: task.project_id,
        fullTask: task 
    });

    const projectName = 
        task.Project?.nama || 
        task.Project?.name ||
        task.project?.nama ||
        task.project?.name ||
        task.project_name;

    console.log(`📊 Project name search result: "${projectName}"`);

    if (!projectName) {
        if (task.project_id) {
            const projectIdStr = String(task.project_id);
            return `Project: ${projectIdStr.slice(0, 8)}...`;
        } else {
            return 'No project';
        }
    }
    
    return projectName;
};

  const stats = getTaskStats();

  const renderTask = ({ item, index }) => {
    const projectName = getProjectName(item);
    
    return (
      <TouchableOpacity
        className="bg-white rounded-3xl p-6 mb-4 mx-4 shadow-lg border border-gray-100"
        onPress={() => navigation.navigate('StaffTaskDetail', { 
          taskId: item.id,
          projectId: item.project_id
        })}
        activeOpacity={0.9}
      >
        {/* Header dengan Status */}
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-2">
              <View 
                className="w-2 h-2 rounded-full mr-3"
                style={{ backgroundColor: getStatusColor(item.status) }}
              />
              <Text className="text-lg font-bold text-gray-800 flex-1" numberOfLines={2}>
                {item.title || 'Untitled Task'}
              </Text>
            </View>
            
            <View 
              className="self-start px-3 py-1 rounded-full"
              style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
            >
              <Text 
                className="text-xs font-bold"
                style={{ color: getStatusColor(item.status) }}
              >
                {item.status?.toUpperCase() || 'TODO'}
              </Text>
            </View>
          </View>

          <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
            <Ionicons 
              name={getStatusIcon(item.status)} 
              size={20} 
              color={getStatusColor(item.status)} 
            />
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <View className="mb-4">
            <Text className="text-sm text-gray-600 leading-5" numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Meta Info - YANG DIPERBAIKI */}
        <View className="flex-row items-center justify-between mb-4 pt-3 border-t border-gray-100">
          {projectName ? (
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2">
                <Ionicons name="briefcase-outline" size={14} color="#10b981" />
              </View>
              <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                {projectName}
              </Text>
            </View>
          ) : item.project_id ? (
            <View className="flex-1 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-yellow-100 items-center justify-center mr-2">
                <Ionicons name="time-outline" size={14} color="#f59e0b" />
              </View>
              <Text className="text-sm text-gray-500">
                Project data missing
              </Text>
            </View>
          ) : (
            <View className="flex-1 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2">
                <Ionicons name="briefcase-outline" size={14} color="#6b7280" />
              </View>
              <Text className="text-sm text-gray-400 italic">No project</Text>
            </View>
          )}
          
          {item.due_date && (
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl ml-2">
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text className="text-xs font-medium text-gray-700 ml-1.5">
                {formatDate(item.due_date)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 bg-blue-500 rounded-xl"
          onPress={() => navigation.navigate('StaffTaskDetail', { 
            taskId: item.id,
            projectId: item.project_id
          })}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text className="text-sm font-semibold text-white ml-2">View Details</Text>
        </TouchableOpacity>

        {/* Debug Info untuk development */}
        {__DEV__ && (
          <View className="mt-3 p-2 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-500 font-mono">
              Task: {item.id} | 
              Project ID: {item.project_id || 'None'} | 
              Project Name: {projectName || 'Not found'} |
              Status: {item.status}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ status, label, icon, count }) => (
    <TouchableOpacity
      className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mx-1 ${
        filterStatus === status 
          ? 'bg-green-500 border-2 border-green-500' 
          : 'bg-white border-2 border-green-500'
      }`}
      onPress={() => setFilterStatus(status)}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={filterStatus === status ? '#fff' : '#10b981'} 
      />
      <Text className={`text-xs font-semibold ml-1.5 ${
        filterStatus === status ? 'text-white' : 'text-green-500'
      }`}>
        {label}
      </Text>
      <View className={`ml-1.5 px-1.5 py-0.5 rounded-full min-w-6 ${
        filterStatus === status ? 'bg-white' : 'bg-green-500'
      }`}>
        <Text className={`text-xs font-bold ${
          filterStatus === status ? 'text-green-500' : 'text-white'
        }`}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4 text-base text-gray-600 font-medium">Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header dengan Gradient */}
      <LinearGradient
        colors={['#10b981', '#34d399']}
        className="pt-14 pb-8 px-6"
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white mb-2">My Tasks</Text>
          <Text className="text-base text-white/90">
            {stats.total} task{stats.total !== 1 ? 's' : ''} assigned to you
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="list-outline" size={20} color="#fff" />
              <Text className="text-2xl font-bold text-white">{stats.todo}</Text>
            </View>
            <Text className="text-xs text-white/80 font-medium">To Do</Text>
          </View>

          <View className="flex-1 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="sync-outline" size={20} color="#fff" />
              <Text className="text-2xl font-bold text-white">{stats.inProgress}</Text>
            </View>
            <Text className="text-xs text-white/80 font-medium">In Progress</Text>
          </View>

          <View className="flex-1 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
              <Text className="text-2xl font-bold text-white">{stats.done}</Text>
            </View>
            <Text className="text-xs text-white/80 font-medium">Done</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row gap-2">
          <FilterButton 
            status="all" 
            label="All" 
            icon="grid-outline" 
            count={stats.total} 
          />
          <FilterButton 
            status="todo" 
            label="To Do" 
            icon="alert-circle-outline" 
            count={stats.todo} 
          />
          <FilterButton 
            status="in-progress" 
            label="In Progress" 
            icon="sync-outline" 
            count={stats.inProgress} 
          />
          <FilterButton 
            status="done" 
            label="Done" 
            icon="checkmark-done-outline" 
            count={stats.done} 
          />
        </View>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-8">
            <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-6">
              <Ionicons 
                name={filterStatus === 'all' ? "checkbox-outline" : 
                      filterStatus === 'todo' ? "alert-circle-outline" :
                      filterStatus === 'in-progress' ? "sync-outline" : "checkmark-done-outline"} 
                size={48} 
                color="#d1fae5" 
              />
            </View>
            
            <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
              {filterStatus === 'all' 
                ? 'No Tasks Assigned' 
                : `No ${filterStatus.replace('-', ' ')} Tasks`}
            </Text>
            
            <Text className="text-base text-gray-500 text-center leading-6 mb-4">
              {filterStatus === 'all' 
                ? "You don't have any tasks assigned yet. Tasks from your projects will appear here."
                : `No tasks found with status "${filterStatus.replace('-', ' ')}".`
              }
            </Text>
            
            <Text className="text-sm text-gray-400 text-center">
              Pull down to refresh
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default StaffTasksScreen;