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

const AdminDashboardScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Responsive breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  // Responsive values
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
        
        const response = await dashboardService.getAdminDashboard();
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

  const MetricCard = ({ title, value, description, icon, color, progress }) => (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()}
      style={{ 
        width: isMobile ? '100%' : '48.5%',
        marginBottom: 16,
        marginRight: !isMobile ? '3%' : 0
      }}
    >
      <View style={{
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
      }}>
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
      </View>
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
  const taskStats = stats?.task_stats || {
    total_tasks: 0,
    todo_tasks: 0,
    in_progress_tasks: 0,
    done_tasks: 0,
    overdue_tasks: 0
  };
  const projectStats = stats?.project_stats || {
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0
  };
  const totalUsers = stats?.total_users || 0;

  // Debug logs
  console.log('🔍 Stats:', stats);
  console.log('🔍 Task Stats:', taskStats);
  console.log('🔍 Project Stats:', projectStats);
  console.log('🔍 All Projects:', dashboardData?.all_projects);
  console.log('🔍 All Tasks:', dashboardData?.all_tasks);
  console.log('🔍 Recent Activity:', dashboardData?.recent_activity);

  const completionRate = taskStats.total_tasks 
    ? Math.round(((taskStats.done_tasks || 0) / taskStats.total_tasks) * 100)
    : 0;

  const avgProgress = dashboardData?.all_projects?.length > 0
    ? Math.round(
        dashboardData.all_projects.reduce((sum, p) => sum + (p.progress || 0), 0) / 
        dashboardData.all_projects.length
      )
    : 0;

  const efficiencyScore = Math.round((completionRate + avgProgress) / 2);

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
              Admin Dashboard
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>
              Complete system overview and analytics
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
        {/* Efficiency Score Banner */}
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
                    System Efficiency
                  </Text>
                </View>
                <Text style={{ color: 'white', fontSize: isMobile ? 32 : 38, fontWeight: 'bold', marginBottom: 8 }}>
                  {efficiencyScore}%
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Overall system performance & productivity
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
                  <Text style={{ fontSize: isMobile ? 24 : 28, fontWeight: 'bold', color: 'white' }}>{efficiencyScore}</Text>
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
              onPress={() => navigation.navigate('AdminProjects')}
            />
            <StatCard
              title="Total Tasks"
              value={taskStats.total_tasks || 0}
              icon="checkbox"
              gradient={['#3b82f6', '#06b6d4']}
              subtitle={`${taskStats.done_tasks || 0} done`}
            />
            <StatCard
              title="Team Members"
              value={totalUsers}
              icon="people"
              gradient={['#10b981', '#059669']}
              subtitle="Active users"
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <StatCard
              title="Completion"
              value={`${completionRate}%`}
              icon="checkmark-done"
              gradient={['#f59e0b', '#ea580c']}
              subtitle="Progress rate"
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
                      projects={dashboardData?.all_projects || []}
                      width={actualChartWidth}
                      height={chartHeight}
                      onProjectPress={(projectId) => 
                        navigation.navigate('AdminProjectDetail', { projectId })
                      }
                    />
                  </ScrollView>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={{ paddingHorizontal: paddingHorizontal, marginTop: 32 }}>
          <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Performance Insights
          </Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
            <MetricCard
              title="Project Velocity"
              value={`${avgProgress}%`}
              description="Average project progress"
              icon="speedometer"
              color="#8b5cf6"
              progress={avgProgress}
            />
            
            <MetricCard
              title="Task Efficiency"
              value={`${completionRate}%`}
              description="Task completion rate"
              icon="checkmark-circle"
              color="#10b981"
              progress={completionRate}
            />
            
            {!isMobile && (
              <>
                <MetricCard
                  title="Team Productivity"
                  value="87%"
                  description="Overall team performance"
                  icon="trending-up"
                  color="#3b82f6"
                  progress={87}
                />
                
                <MetricCard
                  title="Deadline Adherence"
                  value="92%"
                  description="On-time delivery rate"
                  icon="time"
                  color="#f59e0b"
                  progress={92}
                />
              </>
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
              <TouchableOpacity>
                <Text style={{ color: '#667eea', fontWeight: '600', fontSize: 12 }}>View All</Text>
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
                    backgroundColor: '#dbeafe',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 13 }}>
                      {activity.message}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                      By {activity.user_name}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;
