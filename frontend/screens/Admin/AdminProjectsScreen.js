
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { projectService, taskService } from '../../services/api';

const AdminProjectsScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  
  
  const isTablet = width >= 768;
  const NUM_COLUMNS = isTablet ? 3 : 1;
  const CARD_MARGIN = 12;
  const CARD_WIDTH = (width - (CARD_MARGIN * (NUM_COLUMNS + 1))) / NUM_COLUMNS;
  
  
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProjects();
    Animated.spring(headerAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
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
        })
      ]).start();
    }
  }, [projects]);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects, selectedFilter]);

  
  const calculateProjectProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => 
      task.status?.toLowerCase() === 'done' || 
      task.status?.toLowerCase() === 'completed'
    ).length;
    
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const [tasksResponse, membersResponse] = await Promise.all([
        taskService.getProjectTasks(projectId),
        projectService.getProjectMembers(projectId).catch(() => ({ members: [] }))
      ]);

      const tasksData = tasksResponse?.tasks || tasksResponse?.Tasks || tasksResponse?.data || tasksResponse || [];
      const membersData = membersResponse?.members || membersResponse?.Members || membersResponse?.data || membersResponse || [];

      return {
        task_count: Array.isArray(tasksData) ? tasksData.length : 0,
        member_count: Array.isArray(membersData) ? membersData.length : 0,
        progress: calculateProjectProgress(Array.isArray(tasksData) ? tasksData : [])
      };
    } catch (error) {
      console.error(`Error fetching details for project ${projectId}:`, error);
      return {
        task_count: 0,
        member_count: 0,
        progress: 0
      };
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects();
      
      const projectsData = response.Project || response.Projects || response.projects || response.data || response;
      
      if (Array.isArray(projectsData)) {
        const projectsWithDetails = await Promise.all(
          projectsData.map(async (project) => {
            const details = await fetchProjectDetails(project.id);
            return {
              ...project,
              task_count: details.task_count,
              member_count: details.member_count,
              progress: details.progress,
              priority: project.priority || 'medium',
              deadline: project.deadline || project.end_date
            };
          })
        );
        
        setProjects(projectsWithDetails);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setProjects([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      Alert.alert('Error', 'Failed to fetch projects');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (selectedFilter === 'active') {
      filtered = filtered.filter(p => getSafeValue(p.progress, 0) < 100);
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(p => getSafeValue(p.progress, 0) === 100);
    } else if (selectedFilter === 'high') {
      filtered = filtered.filter(p => p.priority === 'high');
    } else if (selectedFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.created_at) > oneWeekAgo);
    }

    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.manager?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  const handleViewProjectDetail = async (projectId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const members = await projectService.getProjectMembers(projectId);
      navigation.navigate('AdminProjectDetail', { 
        projectId,
        members: members.members || []
      });
    } catch (error) {
      console.error('Error fetching project members:', error);
      Alert.alert('Error', 'Failed to load project details');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') {
      return 'No deadline';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSafeValue = (value, fallback = 0) => {
    return value !== undefined ? value : fallback;
  };

  
  const FilterButton = ({ label, value, icon }) => {
    const isSelected = selectedFilter === value;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      setSelectedFilter(value);
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.filterButton,
            isSelected ? styles.filterButtonActive : styles.filterButtonInactive
          ]}
          activeOpacity={0.9}
        >
          <Ionicons 
            name={icon} 
            size={16} 
            color={isSelected ? '#8b5cf6' : '#ffffff'} 
          />
          <Text style={[
            styles.filterButtonText,
            isSelected ? styles.filterButtonTextActive : styles.filterButtonTextInactive
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  
  const ProjectCard = ({ project, index }) => {
    const cardScale = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    
    const progress = getSafeValue(project.progress, 0);
    const isCompleted = progress === 100;
    const priorityColor = getPriorityColor(project.priority);

    const handlePressIn = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 0.98,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    };

    const rotateInterpolate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '2deg']
    });

    
    const dynamicStyles = StyleSheet.create({
      cardContainer: {
        width: CARD_WIDTH,
        margin: CARD_MARGIN / 2,
      },
      projectName: {
        fontSize: isTablet ? 16 : 18,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: isTablet ? 20 : 22,
      },
      description: {
        fontSize: isTablet ? 12 : 14,
        color: '#64748b',
        lineHeight: isTablet ? 16 : 20,
        marginBottom: isTablet ? 12 : 16,
      },
      statValue: {
        fontSize: isTablet ? 18 : 20,
        fontWeight: '700',
        color: '#1e293b',
        marginVertical: 4,
      },
      statLabel: {
        fontSize: isTablet ? 10 : 11,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
      },
      managerName: {
        fontSize: isTablet ? 13 : 14,
        color: '#1e293b',
        fontWeight: '600',
      },
    });

    return (
      <Animated.View 
        style={[
          dynamicStyles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: cardScale },
              { rotate: rotateInterpolate }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleViewProjectDetail(project.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
        >
          {/* Card Header */}
          <LinearGradient
            colors={isCompleted 
              ? ['#10b981', '#059669'] 
              : ['#8b5cf6', '#7c3aed']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeader}
          >
            {/* Priority Indicator */}
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{project.priority || 'Medium'}</Text>
            </View>

            {/* Project Icon and Title */}
            <View style={styles.projectHeader}>
              <View style={[
                styles.projectIcon,
                { width: isTablet ? 40 : 48, height: isTablet ? 40 : 48 }
              ]}>
                <Ionicons 
                  name="folder-open" 
                  size={isTablet ? 20 : 24} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.projectTitleContainer}>
                <Text style={dynamicStyles.projectName} numberOfLines={2}>
                  {project.nama || 'Unnamed Project'}
                </Text>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={12} color="#e9d5ff" />
                  <Text style={styles.dateText}>
                    {formatDate(project.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{progress}%</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#ffffff' : getProgressColor(progress)
                    }
                  ]}
                />
              </View>
            </View>
          </LinearGradient>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Description */}
            <Text style={dynamicStyles.description} numberOfLines={3}>
              {project.deskripsi || 'No description provided for this project.'}
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, styles.statItemFirst]}>
                <Ionicons name="people" size={isTablet ? 18 : 20} color="#8b5cf6" />
                <Text style={dynamicStyles.statValue}>{getSafeValue(project.member_count, 0)}</Text>
                <Text style={dynamicStyles.statLabel}>Members</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="list" size={isTablet ? 18 : 20} color="#3b82f6" />
                <Text style={dynamicStyles.statValue}>{getSafeValue(project.task_count, 0)}</Text>
                <Text style={dynamicStyles.statLabel}>Tasks</Text>
              </View>
              
              <View style={[styles.statItem, styles.statItemLast]}>
                <Ionicons name="checkmark-circle" size={isTablet ? 18 : 20} color="#10b981" />
                <Text style={dynamicStyles.statValue}>{progress}%</Text>
                <Text style={dynamicStyles.statLabel}>Done</Text>
              </View>
            </View>

            {/* Manager Info */}
            <View style={styles.managerContainer}>
              <View style={[
                styles.managerIcon,
                { width: isTablet ? 32 : 36, height: isTablet ? 32 : 36 }
              ]}>
                <Ionicons name="person" size={isTablet ? 16 : 18} color="#ffffff" />
              </View>
              <View style={styles.managerInfo}>
                <Text style={styles.managerLabel}>Project Manager</Text>
                <Text style={dynamicStyles.managerName} numberOfLines={1}>
                  {project.manager?.username || 'Not assigned'}
                </Text>
              </View>
            </View>

            {/* Deadline */}
            {project.deadline && (
              <View style={styles.deadlineContainer}>
                <Ionicons name="time" size={14} color="#6b7280" />
                <Text style={styles.deadlineText}>
                  Deadline: {formatDate(project.deadline)}
                </Text>
              </View>
            )}
          </View>

          {/* Card Footer */}
          <View style={[
            styles.cardFooter,
            isCompleted ? styles.cardFooterCompleted : styles.cardFooterActive
          ]}>
            <Ionicons 
              name={isCompleted ? "checkmark-circle" : "time"} 
              size={16} 
              color={isCompleted ? "#10b981" : "#8b5cf6"} 
            />
            <Text style={[
              styles.footerText,
              isCompleted ? styles.footerTextCompleted : styles.footerTextActive
            ]}>
              {isCompleted ? 'Completed' : `${progress}% Progress`}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  
  const LoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['#f3e8ff', '#e9d5ff', '#ddd6fe']}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingTitle}>Loading Projects</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch your data...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f3e8ff', '#e9d5ff']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="folder-open-outline" size={60} color="#8b5cf6" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {projects.length === 0 ? 'No Projects Yet' : 'No Results Found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {projects.length === 0 ? 
          'Start by creating your first project to manage tasks and teams effectively.' : 
          `We couldn't find any projects matching "${searchQuery}". Try adjusting your search.`
        }
      </Text>
      {projects.length === 0 && (
        <TouchableOpacity 
          onPress={fetchProjects}
          style={styles.emptyButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Refresh Projects</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8b5cf6" />
      
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Projects</Text>
              <Text style={styles.headerSubtitle}>
                Manage and track all your projects
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchProjects}
              >
                <Ionicons name="refresh" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <BlurView intensity={90} style={styles.searchBlur}>
              <View style={styles.searchContent}>
                <Ionicons name="search" size={22} color="#8b5cf6" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search projects..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close" size={18} color="#6b7280" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </BlurView>
          </View>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterButton label="All" value="all" icon="apps" />
            <FilterButton label="Active" value="active" icon="play" />
            <FilterButton label="Completed" value="completed" icon="checkmark" />
            <FilterButton label="High Priority" value="high" icon="alert" />
            <FilterButton label="Recent" value="recent" icon="time" />
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Projects Grid - Responsif Otomatis */}
      <FlatList
        data={filteredProjects}
        renderItem={({ item, index }) => <ProjectCard project={item} index={index} />}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={NUM_COLUMNS} 
        contentContainerStyle={[
          styles.gridContent,
          { padding: CARD_MARGIN }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.listHeader, { paddingHorizontal: CARD_MARGIN }]}>
            <Text style={styles.listHeaderText}>
              {searchQuery ? 
                `Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}` : 
                `Showing ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        
        key={`grid-${NUM_COLUMNS}`}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e9d5ff',
    opacity: 0.9,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginLeft: 8,
    fontSize: 16,
    color: '#334155',
    
    outlineStyle: 'none',
    
    outlineWidth: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterContainer: {
    paddingBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#8b5cf6',
  },
  filterButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#8b5cf6',
  },
  filterButtonTextInactive: {
    color: '#ffffff',
  },
  
  gridContent: {
    paddingBottom: 100,
  },
  listHeader: {
    paddingVertical: 12,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    height: '100%',
  },
  
  cardHeader: {
    padding: 16,
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectIcon: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  projectTitleContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#e9d5ff',
    marginLeft: 4,
  },
  
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  cardBody: {
    padding: 16,
    flex: 1,
  },
  
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statItemFirst: {
    alignItems: 'flex-start',
  },
  statItemLast: {
    alignItems: 'flex-end',
  },
  
  managerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  managerIcon: {
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  managerInfo: {
    flex: 1,
  },
  managerLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cardFooterActive: {
    backgroundColor: '#f5f3ff',
    borderTopColor: '#ede9fe',
  },
  cardFooterCompleted: {
    backgroundColor: '#f0fdf4',
    borderTopColor: '#dcfce7',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerTextActive: {
    color: '#7c3aed',
  },
  footerTextCompleted: {
    color: '#059669',
  },
  
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdminProjectsScreen;