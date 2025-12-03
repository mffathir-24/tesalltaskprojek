import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProjectProgressBarChart from '../../components/Charts/ProjectProgressBarChart';
import TaskStatusPieChart from '../../components/Charts/TaskStatusPieChart';
import { dashboardService } from '../../services/dashboard';

const ManagerDashboardScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  
  const paddingHorizontal = isMobile ? 16 : isTablet ? 24 : 32;
  const actualChartWidth = isMobile 
    ? width - (paddingHorizontal * 2) - 32
    : (width - (paddingHorizontal * 2) - 32) / 2;
  const chartHeight = isMobile ? 320 : 300;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching manager dashboard data...');
      
      const response = await dashboardService.getManagerDashboard();
      console.log('📊 Manager Dashboard response:', response);
      
      if (response && response.data) {
        const actualData = response.data.data || response.data;
        console.log('📦 Actual data to set:', actualData);
        setDashboardData(actualData);
        if (actualData.my_projects?.[0]) {
          setSelectedProject(actualData.my_projects[0].id);
        }
      } else {
        console.log('⚠️ No valid data received, using mock');
        useMockData();
      }
      
    } catch (error) {
      console.error('❌ Error fetching manager dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      useMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const useMockData = () => {
    const mockData = {
      stats: {
        project_stats: {
          total_projects: 2,
          active_projects: 2,
          completed_projects: 0,
          on_hold_projects: 0
        },
        task_stats: {
          total_tasks: 8,
          todo_tasks: 2,
          in_progress_tasks: 4,
          done_tasks: 2,
          overdue_tasks: 1
        },
        total_members: 5,
        productivity_score: 78
      },
      my_projects: [
        {
          id: '63b19e6f-69b5-4de9-934d-24cfc106aa00',
          name: 'Mobile Project',
          total_members: 2,
          total_tasks: 0,
          todo_tasks: 0,
          in_progress_tasks: 0,
          done_tasks: 0,
          progress: 0,
          status: 'planning',
          priority: 'medium',
          deadline: '2024-06-30',
          created_at: new Date().toISOString()
        },
        {
          id: '536542b4-4304-467c-aed8-789ff6e8d86c',
          name: 'PSti - Payment System Integration',
          total_members: 3,
          total_tasks: 8,
          todo_tasks: 2,
          in_progress_tasks: 4,
          done_tasks: 2,
          progress: 50,
          status: 'active',
          priority: 'high',
          deadline: '2024-05-15',
          created_at: new Date().toISOString()
        },
        {
          id: '789ff6e8d86c-536542b4-4304-467c-aed8',
          name: 'Website Redesign',
          total_members: 4,
          total_tasks: 12,
          todo_tasks: 3,
          in_progress_tasks: 6,
          done_tasks: 3,
          progress: 75,
          status: 'active',
          priority: 'high',
          deadline: '2024-04-30',
          created_at: new Date().toISOString()
        }
      ],
      my_projects_tasks: [
        {
          id: '490f7a42-4154-43d3-b519-2f9f84e06003',
          title: 'Project Report Documentation',
          status: 'in-progress',
          assignee_name: 'John Staff',
          assignee_avatar: 'JS',
          due_date: new Date().toISOString(),
          is_overdue: true,
          priority: 'high',
          project_name: 'PSti',
          created_at: new Date().toISOString()
        },
        {
          id: '793f0c33-ec84-4451-acea-7ebe0fc992ed',
          title: 'Face Recognition Module',
          status: 'done',
          assignee_name: 'M Fathir',
          assignee_avatar: 'MF',
          due_date: new Date().toISOString(),
          is_overdue: false,
          priority: 'critical',
          project_name: 'Mobile Project',
          created_at: new Date().toISOString()
        },
        {
          id: 'acea-7ebe0fc992ed-793f0c33-ec84-4451',
          title: 'API Integration Testing',
          status: 'todo',
          assignee_name: 'Sarah Chen',
          assignee_avatar: 'SC',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          is_overdue: false,
          priority: 'medium',
          project_name: 'PSti',
          created_at: new Date().toISOString()
        }
      ],
      recent_activity: [
        {
          id: '1',
          type: 'task_update',
          user_name: 'M Fathir',
          user_avatar: 'MF',
          message: 'Completed Face Recognition Module',
          timestamp: '2 hours ago',
          icon: 'checkmark-circle',
          color: '#10B981'
        },
        {
          id: '2',
          type: 'task_create',
          user_name: 'John Staff',
          user_avatar: 'JS',
          message: 'Created new task: API Integration Testing',
          timestamp: '4 hours ago',
          icon: 'add-circle',
          color: '#3B82F6'
        },
        {
          id: '3',
          type: 'comment',
          user_name: 'Sarah Chen',
          user_avatar: 'SC',
          message: 'Commented on project requirements',
          timestamp: 'Yesterday',
          icon: 'chatbubble',
          color: '#8B5CF6'
        }
      ],
      team_members: [
        { id: '1', name: 'M Fathir', role: 'Lead Developer', avatar: 'MF', tasks_completed: 12 },
        { id: '2', name: 'John Staff', role: 'Backend Developer', avatar: 'JS', tasks_completed: 8 },
        { id: '3', name: 'Sarah Chen', role: 'Frontend Developer', avatar: 'SC', tasks_completed: 15 },
        { id: '4', name: 'Alex Wong', role: 'UI/UX Designer', avatar: 'AW', tasks_completed: 9 }
      ]
    };
    
    setDashboardData(mockData);
    if (mockData.my_projects?.[1]) {
      setSelectedProject(mockData.my_projects[1].id);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, gradient, onPress, subtitle }) => (
    <Animated.View 
      entering={FadeInDown.delay(100).springify()}
      style={{ 
        width: isMobile ? '48%' : isTablet ? '48%' : '23.5%',
        marginBottom: 12,
        marginRight: (isMobile || isTablet) ? '4%' : '2%'
      }}
    >
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          height: '100%',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
              {title}
            </Text>
            <Text style={{ color: '#0f172a', fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>
              {value}
            </Text>
            {subtitle && (
              <Text style={{ color: '#94a3b8', fontSize: 10 }}>{subtitle}</Text>
            )}
          </View>
          <LinearGradient
            colors={gradient}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            <Ionicons name={icon} size={24} color="white" />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const MetricCard = ({ title, value, description, icon, color, progress, onPress }) => (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()}
      style={{ 
        width: isMobile ? '100%' : '48.5%',
        marginBottom: 16,
        marginRight: !isMobile ? '3%' : 0
      }}
    >
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 14, 
            backgroundColor: `${color}15`,
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          {progress && (
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#475569', fontWeight: '600', fontSize: 12 }}>{progress}%</Text>
            </View>
          )}
        </View>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: 'bold', marginBottom: 6 }}>
          {value}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 11 }}>{description}</Text>
        
        {progress && (
          <View style={{ marginTop: 14 }}>
            <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: color,
                  borderRadius: 20,
                }}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: '#f8fafc',
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Animated.View 
          entering={FadeInUp.delay(100).springify()}
          style={{ alignItems: 'center' }}
        >
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: '#667eea',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <LinearGradient
              colors={['#667eea', '#8b5cf6']}
              style={{ width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <ActivityIndicator size="large" color="white" />
            </LinearGradient>
          </View>
          <Text style={{ 
            color: '#0f172a', 
            fontWeight: 'bold', 
            fontSize: 18, 
            marginBottom: 8 
          }}>
            Loading Dashboard
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
            Preparing your insights and analytics...
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: '#f8fafc',
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: paddingHorizontal
      }}>
        <Ionicons name="warning" size={48} color="#ef4444" />
        <Text style={{ 
          color: '#0f172a', 
          fontWeight: 'bold', 
          fontSize: 18, 
          marginTop: 16,
          marginBottom: 8 
        }}>
          No Data Available
        </Text>
        <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
          Unable to load dashboard data. Please check your connection.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#667eea',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
          onPress={fetchDashboardData}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const stats = dashboardData?.stats || {};
  const taskStats = stats.task_stats || {};
  const projectStats = stats.project_stats || {};

  const completionRate = taskStats.total_tasks 
    ? Math.round(((taskStats.done_tasks || 0) / taskStats.total_tasks) * 100)
    : 0;

  const avgProgress = dashboardData?.my_projects?.length > 0
    ? Math.round(
        dashboardData.my_projects.reduce((sum, p) => sum + (p.progress || 0), 0) / 
        dashboardData.my_projects.length
      )
    : 0;

  const productivityScore = stats.productivity_score || Math.round((completionRate + avgProgress) / 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <BlurView intensity={80} tint="light" style={{ paddingHorizontal: paddingHorizontal, paddingTop: 12, paddingBottom: 20 }}>
        <Animated.View 
          entering={FadeInDown.delay(50).springify()}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0f172a', fontSize: isMobile ? 24 : 28, fontWeight: 'bold', marginBottom: 4 }}>
              Manager Dashboard
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>
              Track your projects and team performance
            </Text>
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={fetchDashboardData}
          >
            <LinearGradient
              colors={['#667eea', '#8b5cf6']}
              style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="refresh" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>

      <ScrollView 
        showsVerticalScrollIndicator={true}
        style={{ flex: 1, width: '100%' }}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea', '#8b5cf6']}
            tintColor="#667eea"
            progressBackgroundColor="white"
          />
        }
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
      >
        {/* Productivity Score Banner */}
        <Animated.View 
          entering={FadeInUp.delay(150).springify()}
          style={{ marginHorizontal: paddingHorizontal, marginTop: 20 }}
        >
          <LinearGradient
            colors={['#667eea', '#8b5cf6', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: isMobile ? 18 : 24,
              shadowColor: '#8b5cf6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center' }}>
              <View style={{ flex: 1, marginBottom: isMobile ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="flash" size={16} color="#fbbf24" />
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Team Productivity
                  </Text>
                </View>
                <Text style={{ color: 'white', fontSize: isMobile ? 32 : 38, fontWeight: 'bold', marginBottom: 8 }}>
                  {productivityScore}%
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Based on task completion and project progress
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ 
                  width: isMobile ? 80 : 96, 
                  height: isMobile ? 80 : 96, 
                  borderRadius: isMobile ? 40 : 48, 
                  borderWidth: 3, 
                  borderColor: 'rgba(255,255,255,0.3)',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}>
                  <Text style={{ fontSize: isMobile ? 24 : 28, fontWeight: 'bold', color: 'white' }}>{productivityScore}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Key Metrics Grid */}
        <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 24 }}>
          <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Key Metrics
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
            <StatCard
              title="Active Projects"
              value={projectStats.active_projects || 0}
              icon="rocket"
              gradient={['#8b5cf6', '#ec4899']}
              subtitle={`${projectStats.total_projects || 0} total`}
              onPress={() => navigation.navigate('ManagerProjects')}
            />
            <StatCard
              title="Team Tasks"
              value={taskStats.total_tasks || 0}
              icon="checkbox"
              gradient={['#3b82f6', '#06b6d4']}
              subtitle={`${taskStats.done_tasks || 0} completed`}
              onPress={() => selectedProject && navigation.navigate('ManagerProjectDetail', { 
                projectId: selectedProject 
              })}
            />
            <StatCard
              title="Team Members"
              value={stats.total_members || 0}
              icon="people"
              gradient={['#10b981', '#059669']}
              subtitle="Active team"
              onPress={() => navigation.navigate('TeamManagement')}
            />
            <StatCard
              title="Completion Rate"
              value={`${completionRate}%`}
              icon="checkmark-done"
              gradient={['#f59e0b', '#ea580c']}
              subtitle="Task completion"
            />
          </View>
        </View>

        {/* Charts Section - Responsive Grid */}
        <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold' }}>
              Performance Analytics
            </Text>
          </View>

          <View style={{ 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            {/* Task Status Chart */}
            <Animated.View 
              entering={FadeInUp.delay(200).springify()}
              style={{ 
                flex: 1, 
                marginBottom: isMobile ? 16 : 0,
                width: isMobile ? '100%' : '48%',
                minHeight: isMobile ? 420 : 380,
              }}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                flex: 1,
              }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
                  Task Distribution
                </Text>
                <View style={{ 
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <ScrollView 
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    contentContainerStyle={{ alignItems: 'center' }}
                  >
                    <TaskStatusPieChart 
                      data={taskStats}
                      width={actualChartWidth}
                      height={chartHeight}
                    />
                  </ScrollView>
                </View>
              </View>
            </Animated.View>

            {/* Project Progress Chart */}
            <Animated.View 
              entering={FadeInUp.delay(250).springify()}
              style={{ 
                flex: 1,
                width: isMobile ? '100%' : '48%',
                minHeight: isMobile ? 420 : 380,
              }}
            >
              <View style={{
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                flex: 1,
              }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>
                  Project Progress
                </Text>
                <View style={{ 
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <ScrollView 
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    contentContainerStyle={{ alignItems: 'center' }}
                  >
                    <ProjectProgressBarChart 
                      projects={dashboardData?.my_projects || []}
                      width={actualChartWidth}
                      height={chartHeight}
                      onProjectPress={(projectId) => {
                        setSelectedProject(projectId);
                        navigation.navigate('ManagerProjectDetail', { projectId });
                      }}
                    />
                  </ScrollView>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32 }}>
          <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Performance Insights
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            gap: 16,
          }}>
            {/* Grid 1: Project Velocity */}
            <View style={{ 
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '0%' : '50%',
            }}>
              <MetricCard
                title="Project Velocity"
                value={`${avgProgress}%`}
                description="Average project progress"
                icon="speedometer"
                color="#8b5cf6"
                progress={avgProgress}
                onPress={() => navigation.navigate('ManagerProjects')}
              />
            </View>
            
            {/* Grid 2: Task Efficiency */}
            <View style={{ 
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '0%' : '40%',
            }}>
              <MetricCard
                title="Task Efficiency"
                value={`${completionRate}%`}
                description="Task completion rate"
                icon="checkmark-circle"
                color="#10b981"
                progress={completionRate}
              />
            </View>
            
            {/* Grid 3: Team Productivity */}
            <View style={{ 
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '0%' : '30%',
            }}>
              <MetricCard
                title="Team Productivity"
                value={`${productivityScore}%`}
                description="Overall team performance"
                icon="trending-up"
                color="#3b82f6"
                progress={productivityScore}
                onPress={() => navigation.navigate('TeamManagement')}
              />
            </View>
            
            {/* Grid 4: Active Projects */}
            <View style={{ 
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '0%' : '20%',
            }}>
              <MetricCard
                title="Active Projects"
                value={`${projectStats.active_projects || 0}`}
                description="Currently running projects"
                icon="folder-open"
                color="#f59e0b"
                progress={projectStats.active_projects ? (projectStats.active_projects / (projectStats.total_projects || 1)) * 100 : 0}
                onPress={() => navigation.navigate('ManagerProjects')}
              />
            </View>
          </View>
        </View>

        {/* Recent Tasks & Activity */}
        <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32 }}>
          <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16 }}>
            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold' }}>
              Recent Tasks
            </Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: isMobile ? 8 : 0 }}
              onPress={() => selectedProject && navigation.navigate('ManagerProjectDetail', { 
                projectId: selectedProject 
              })}
            >
              <Text style={{ color: '#667eea', fontWeight: '600', fontSize: 12, marginRight: 4 }}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color="#667eea" />
            </TouchableOpacity>
          </View>
          
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            marginBottom: isMobile ? 0 : 32,
          }}>
            {dashboardData?.my_projects_tasks?.slice(0, 3).map((task, index) => (
              <Animated.View 
                key={task.id}
                entering={FadeInDown.delay(index * 100).springify()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index !== Math.min(dashboardData.my_projects_tasks.length - 1, 2) ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                }}
              >
                <View style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 10, 
                  backgroundColor: task.status === 'done' ? '#d1fae5' : 
                                 task.status === 'in-progress' ? '#dbeafe' : 
                                 task.is_overdue ? '#fee2e2' : '#f1f5f9',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons 
                    name={task.status === 'done' ? 'checkmark-circle' : 
                          task.status === 'in-progress' ? 'time' : 
                          task.is_overdue ? 'warning' : 'document-text'} 
                    size={18} 
                    color={task.status === 'done' ? '#10b981' : 
                           task.status === 'in-progress' ? '#3b82f6' : 
                           task.is_overdue ? '#ef4444' : '#64748b'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 13, marginBottom: 2 }}>
                    {task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={{ color: '#64748b', fontSize: 11 }}>
                      {task.assignee_name} • {task.project_name}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ 
                    color: task.is_overdue ? '#ef4444' : '#64748b', 
                    fontSize: 11, 
                    fontWeight: task.is_overdue ? '600' : '400',
                    marginBottom: 2 
                  }}>
                    {task.is_overdue ? 'Overdue' : 'Due'}
                  </Text>
                  <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '600' }}>
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </Animated.View>
            ))}
            
            {(!dashboardData?.my_projects_tasks || dashboardData.my_projects_tasks.length === 0) && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Ionicons name="document-text" size={36} color="#d1d5db" />
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>No tasks available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
          <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold' }}>
                Recent Activity
              </Text>
            </View>
            
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#f1f5f9',
            }}>
              {dashboardData.recent_activity.slice(0, isMobile ? 3 : 5).map((activity, index) => (
                <Animated.View 
                  key={activity.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index !== Math.min(dashboardData.recent_activity.length - 1, isMobile ? 2 : 4) ? 1 : 0,
                    borderBottomColor: '#f1f5f9',
                  }}
                >
                  <View style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: 10, 
                    backgroundColor: `${activity.color}20`,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={activity.icon} size={18} color={activity.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 13 }}>
                      {activity.message}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={{ color: '#64748b', fontSize: 11 }}>
                        By {activity.user_name}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11, marginHorizontal: 6 }}>•</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                        {activity.timestamp}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Team Members */}
        {dashboardData?.team_members && dashboardData.team_members.length > 0 && (
          <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold' }}>
                Team Performance
              </Text>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('TeamManagement')}
              >
                <Text style={{ color: '#667eea', fontWeight: '600', fontSize: 12, marginRight: 4 }}>View Team</Text>
                <Ionicons name="arrow-forward" size={14} color="#667eea" />
              </TouchableOpacity>
            </View>
            
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#f1f5f9',
            }}>
              <View style={{ 
                flexDirection: isMobile ? 'column' : 'row', 
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                justifyContent: 'space-between',
              }}>
                {dashboardData.team_members.map((member, index) => (
                  <Animated.View 
                    key={member.id}
                    entering={FadeInDown.delay(100 + (index * 100)).springify()}
                    style={{ 
                      width: isMobile ? '100%' : '48%',
                      marginBottom: 12,
                      marginRight: isMobile ? 0 : '4%',
                    }}
                  >
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 12,
                      backgroundColor: '#f8fafc',
                      borderRadius: 16,
                    }}>
                      <View style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 12, 
                        backgroundColor: '#dbeafe',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: 16 }}>{member.avatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                          {member.name}
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 12 }}>{member.role}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 16 }}>{member.tasks_completed}</Text>
                        <Text style={{ color: '#64748b', fontSize: 11 }}>Tasks Done</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 100 }}>
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#667eea',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 2,
            borderColor: 'white',
          }}
          onPress={() => navigation.navigate('CreateProject')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ManagerDashboardScreen;