// screens/Manager/ManagerProjectsScreen.js
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
import { useAuth } from '../../context/AuthContext';
import { projectService, taskService } from '../../services/api';

const ManagerProjectsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  
  // Hitung layout secara dinamis
  const isTablet = width >= 768;
  const NUM_COLUMNS = isTablet ? 3 : 1;
  const CARD_MARGIN = 12;
  const CARD_WIDTH = (width - (CARD_MARGIN * (NUM_COLUMNS + 1))) / NUM_COLUMNS;
  
  // State
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

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
      task.status?.toLowerCase() === 'done'
    ).length;
    
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const [tasksResponse, membersResponse] = await Promise.all([
        taskService.getProjectTasks(projectId),
        projectService.getProjectMembers(projectId).catch(() => ({ members: [] }))
      ]);

      const tasksData = tasksResponse.tasks || tasksResponse.Tasks || tasksResponse.data || tasksResponse || [];
      const membersData = membersResponse.members || membersResponse.Members || membersResponse.data || membersResponse || [];

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
              progress: details.progress
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
    } else if (selectedFilter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(p => new Date(p.created_at) > oneWeekAgo);
    }

    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  const handleDeleteProject = (projectId, projectName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.deleteProject(projectId);
              Alert.alert('Success', 'Project deleted successfully');
              fetchProjects();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getSafeValue = (value, fallback = 0) => {
    return value !== undefined ? value : fallback;
  };

  // Komponen FilterButton
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
            color={isSelected ? '#4facfe' : '#ffffff'} 
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

  // Komponen ProjectCard dengan layout dinamis
  const ProjectCard = ({ project, index }) => {
    const cardScale = useRef(new Animated.Value(1)).current;
    
    const progress = getSafeValue(project.progress, 0);
    const isCompleted = progress === 100;

    const handlePressIn = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(cardScale, {
        toValue: 0.98,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    // Style dinamis berdasarkan lebar card
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
      actionButtonText: {
        fontSize: isTablet ? 12 : 14,
        fontWeight: '600',
      }
    });

    return (
      <Animated.View 
        style={[
          dynamicStyles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: cardScale }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ManagerProjectDetail', { projectId: project.id })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
        >
          {/* Card Header */}
          <LinearGradient
            colors={isCompleted 
              ? ['#10b981', '#059669'] 
              : ['#4facfe', '#00f2fe']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardHeader}
          >
            {/* Project Title and Menu */}
            <View style={styles.projectHeader}>
              <View style={[
                styles.projectIcon,
                { width: isTablet ? 40 : 48, height: isTablet ? 40 : 48 }
              ]}>
                <Ionicons 
                  name="briefcase" 
                  size={isTablet ? 20 : 24} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.projectTitleContainer}>
                <Text style={dynamicStyles.projectName} numberOfLines={2}>
                  {project.nama || 'Unnamed Project'}
                </Text>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={12} color="#e0f2fe" />
                  <Text style={styles.dateText}>
                    {formatDate(project.created_at)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => handleDeleteProject(project.id, project.nama)}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#ffffff" />
              </TouchableOpacity>
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
                <Ionicons name="people" size={isTablet ? 18 : 20} color="#4facfe" />
                <Text style={dynamicStyles.statValue}>{getSafeValue(project.member_count, 0)}</Text>
                <Text style={dynamicStyles.statLabel}>Members</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="list" size={isTablet ? 18 : 20} color="#a78bfa" />
                <Text style={dynamicStyles.statValue}>{getSafeValue(project.task_count, 0)}</Text>
                <Text style={dynamicStyles.statLabel}>Tasks</Text>
              </View>
              
              <View style={[styles.statItem, styles.statItemLast]}>
                <Ionicons name="checkmark-circle" size={isTablet ? 18 : 20} color="#10b981" />
                <Text style={dynamicStyles.statValue}>{progress}%</Text>
                <Text style={dynamicStyles.statLabel}>Done</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => navigation.navigate('EditProject', { 
                  projectId: project.id,
                  projectData: project 
                })}
              >
                <Ionicons name="create-outline" size={16} color="#ffffff" />
                <Text style={[dynamicStyles.actionButtonText, { color: '#ffffff' }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.membersButton]}
                onPress={() => navigation.navigate('ManageMembers', { 
                  projectId: project.id,
                  projectName: project.nama 
                })}
              >
                <Ionicons name="people-outline" size={16} color="#ffffff" />
                <Text style={[dynamicStyles.actionButtonText, { color: '#ffffff' }]}>Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('ManagerProjectDetail', { projectId: project.id })}
              >
                <Ionicons name="eye-outline" size={16} color="#ffffff" />
                <Text style={[dynamicStyles.actionButtonText, { color: '#ffffff' }]}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Komponen LoadingSkeleton
  const LoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd', '#7dd3fc']}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingTitle}>Loading Projects</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch your data...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  // Komponen EmptyState
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#e0f2fe', '#bae6fd']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="folder-open-outline" size={60} color="#4facfe" />
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
          onPress={() => navigation.navigate('CreateProject')}
          style={styles.emptyButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Create First Project</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4facfe" />
      
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
          colors={['#4facfe', '#00f2fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>My Projects</Text>
              <Text style={styles.headerSubtitle}>
                {projects.length} project{projects.length !== 1 ? 's' : ''} • Managed by you
              </Text>
            </View>

            {/* Stats Badge */}
            <View style={styles.statsBadge}>
              <Text style={styles.statsNumber}>{projects.length}</Text>
              <Text style={styles.statsLabel}>Total</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <BlurView intensity={90} style={styles.searchBlur}>
              <View style={styles.searchContent}>
                <Ionicons name="search" size={22} color="#4facfe" />
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
            <FilterButton label="Recent" value="recent" icon="time" />
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Projects Grid - Responsif Otomatis */}
      <FlatList
        ref={flatListRef}
        data={filteredProjects}
        renderItem={({ item, index }) => <ProjectCard project={item} index={index} />}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={[
          styles.gridContent,
          { 
            padding: CARD_MARGIN,
            paddingBottom: 100, // Memberikan ruang untuk FAB
            flexGrow: 1 // FIX: Ini yang memperbaiki scroll
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4facfe']}
            tintColor="#4facfe"
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
        ListEmptyComponent={() => (
          <View style={{ flex: 1, minHeight: height - 300 }}>
            <EmptyState />
          </View>
        )}
        key={`grid-${NUM_COLUMNS}`}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        // Fix untuk scroll yang mentok
        onContentSizeChange={(width, height) => {
          console.log('Content size:', width, height);
        }}
        onLayout={(event) => {
          console.log('FlatList layout:', event.nativeEvent.layout);
        }}
        // Menggunakan ListHeaderComponentStyle untuk mengatur posisi header
        ListHeaderComponentStyle={{
          paddingTop: 10,
        }}
        // Menggunakan ItemSeparatorComponent untuk memberikan jarak
        ItemSeparatorComponent={() => <View style={{ height: CARD_MARGIN }} />}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateProject')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Header Styles
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
    color: '#e0f2fe',
    opacity: 0.9,
  },
  statsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#e0f2fe',
    fontWeight: '600',
  },
  // Search Styles
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
  // Filter Styles
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
    borderColor: '#4facfe',
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
    color: '#4facfe',
  },
  filterButtonTextInactive: {
    color: '#ffffff',
  },
  // Grid Styles - FIXED
  gridContent: {
    flexGrow: 1, // INI PENTING: Membuat konten bisa scroll
    paddingBottom: 100, // Memberi ruang untuk FAB
  },
  listHeader: {
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
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
  // Card Header
  cardHeader: {
    padding: 16,
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#e0f2fe',
    marginLeft: 4,
  },
  // Progress Bar
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
  // Card Body
  cardBody: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  // Stats Grid
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
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#4facfe',
  },
  membersButton: {
    backgroundColor: '#a78bfa',
  },
  viewButton: {
    backgroundColor: '#10b981',
  },
  // Loading Styles
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
  // Empty State Styles
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
  // FAB Styles
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ManagerProjectsScreen;