
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { userService } from '../../services/api';

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  
  
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  useEffect(() => {
    if (users.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      
      console.log('🔍 === DEBUG USER DATA ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      let usersData = [];
      
      if (Array.isArray(response)) {
        usersData = response;
        console.log('✅ Using direct array response');
      } else if (response?.Users && Array.isArray(response.Users)) {
        usersData = response.Users;
        console.log('✅ Using response.Users');
      } else if (response?.users && Array.isArray(response.users)) {
        usersData = response.users;
        console.log('✅ Using response.users');
      } else if (response?.data && Array.isArray(response.data)) {
        usersData = response.data;
        console.log('✅ Using response.data');
      } else {
        console.log('❌ No valid users data found');
      }
      
      console.log('📊 Final users data:', usersData);
      console.log('Users count:', usersData.length);
      
      setUsers(usersData);
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  
  const handleDeleteUser = (userId, username) => {
    
    if (Platform.OS === 'web') {
      setUserToDelete({ id: userId, username: username });
      setShowDeleteUserModal(true);
    } else {
      
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${username}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await performDeleteUser(userId, username);
            },
          },
        ]
      );
    }
  };

  
  const performDeleteUser = async (userId, username) => {
    try {
      setDeletingUser(true);
      await userService.deleteUser(userId);
      
      
      if (Platform.OS === 'web') {
        
        alert(`User "${username}" deleted successfully`);
      } else {
        Alert.alert('Success', 'User deleted successfully');
      }
      
      
      fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setDeletingUser(false);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    }
  };

  const getRoleColors = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          gradient: ['#a78bfa', '#ec4899'],
          gradientLight: ['#f3e8ff', '#fce7f3'],
          badge: '#f3e8ff',
          border: '#e9d5ff',
          text: '#6b21a8',
          icon: '#a78bfa'
        };
      case 'manager':
        return {
          gradient: ['#60a5fa', '#34d399'],
          gradientLight: ['#dbeafe', '#d1fae5'],
          badge: '#dbeafe',
          border: '#bfdbfe',
          text: '#1e40af',
          icon: '#60a5fa'
        };
      case 'staff':
        return {
          gradient: ['#34d399', '#fbbf24'],
          gradientLight: ['#d1fae5', '#fef3c7'],
          badge: '#d1fae5',
          border: '#a7f3d0',
          text: '#065f46',
          icon: '#34d399'
        };
      default:
        return {
          gradient: ['#9ca3af', '#6b7280'],
          gradientLight: ['#f3f4f6', '#e5e7eb'],
          badge: '#f3f4f6',
          border: '#e5e7eb',
          text: '#374151',
          icon: '#9ca3af'
        };
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

  const renderUserItem = ({ item, index }) => {
    if (!item || !item.id) {
      return null;
    }

    const roleColors = getRoleColors(item.role);
    const animDelay = index * 100;

    return (
      <Animated.View 
        style={[
          styles.userCard,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.userCardContent}
          onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
            style={styles.cardGradient}
          >
            <View style={styles.userRow}>
              {/* User Avatar with Gradient Border */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={roleColors.gradient}
                  style={styles.avatarGradientBorder}
                >
                  <View style={styles.avatarInner}>
                    <Text style={[styles.avatarText, { color: roleColors.icon }]}>
                      {item.username?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                </LinearGradient>
                {/* Online Status Indicator */}
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                </View>
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.username} numberOfLines={1}>
                    {item.username || 'Unknown'}
                  </Text>
                </View>
                
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: roleColors.badge, borderColor: roleColors.border }
                ]}>
                  <Ionicons 
                    name={getRoleIcon(item.role)} 
                    size={12} 
                    color={roleColors.icon} 
                  />
                  <Text style={[styles.roleText, { color: roleColors.text }]}>
                    {item.role?.toUpperCase() || 'UNKNOWN'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={14} color="#94a3b8" />
                  <Text style={styles.emailText} numberOfLines={1}>
                    {item.email || 'No email'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="key" size={12} color="#cbd5e1" />
                  <Text style={styles.idText}>
                    ID: {item.id}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate('EditUser', { userId: item.id })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#60a5fa', '#3b82f6']}
                    style={styles.actionButtonGradient}
                  >
                    <Ionicons name="create" size={18} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Delete Button yang sudah dimodifikasi */}
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    deletingUser && userToDelete?.id === item.id && styles.deleteButtonDisabled
                  ]}
                  onPress={() => handleDeleteUser(item.id, item.username)}
                  disabled={deletingUser && userToDelete?.id === item.id}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={deletingUser && userToDelete?.id === item.id ? ['#fca5a5', '#f87171'] : ['#f87171', '#ef4444']}
                    style={styles.actionButtonGradient}
                  >
                    {deletingUser && userToDelete?.id === item.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="trash" size={18} color="white" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <LinearGradient
            colors={['#a78bfa', '#ec4899']}
            style={styles.loadingIcon}
          >
            <Ionicons name="people" size={48} color="white" />
          </LinearGradient>
          <ActivityIndicator size="large" color="#a78bfa" style={styles.loader} />
          <Text style={styles.loadingTitle}>Loading Users</Text>
          <Text style={styles.loadingSubtitle}>Fetching user data from server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#a78bfa', '#8b5cf6', '#7c3aed']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="people-circle" size={32} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>User Management</Text>
              <Text style={styles.headerSubtitle}>
                {users.length} total users • Manage permissions
              </Text>
            </View>
          </View>
        </View>

        {/* Modern Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#a78bfa" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or role..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              outlineStyle="none"
            />
            {searchQuery ? (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards with Gradient */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#f3e8ff', '#fce7f3']}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconWrapper}>
              <LinearGradient
                colors={['#a78bfa', '#ec4899']}
                style={styles.statIconGradient}
              >
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.statValue}>
              {users.filter(u => u.role?.toLowerCase() === 'admin').length}
            </Text>
            <Text style={styles.statLabel}>Admins</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#dbeafe', '#d1fae5']}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconWrapper}>
              <LinearGradient
                colors={['#60a5fa', '#34d399']}
                style={styles.statIconGradient}
              >
                <Ionicons name="briefcase" size={20} color="white" />
              </LinearGradient>
            </View>
            <Text style={[styles.statValue, { color: '#1e40af' }]}>
              {users.filter(u => u.role?.toLowerCase() === 'manager').length}
            </Text>
            <Text style={styles.statLabel}>Managers</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statCard}>
          <LinearGradient
            colors={['#d1fae5', '#fef3c7']}
            style={styles.statCardGradient}
          >
            <View style={styles.statIconWrapper}>
              <LinearGradient
                colors={['#34d399', '#fbbf24']}
                style={styles.statIconGradient}
              >
                <Ionicons name="people" size={20} color="white" />
              </LinearGradient>
            </View>
            <Text style={[styles.statValue, { color: '#065f46' }]}>
              {users.filter(u => u.role?.toLowerCase() === 'staff').length}
            </Text>
            <Text style={styles.statLabel}>Staff</Text>
          </LinearGradient>
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#a78bfa', '#ec4899']}
            tintColor="#a78bfa"
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          searchQuery ? (
            <View style={styles.listHeader}>
              <Ionicons name="filter" size={16} color="#64748b" />
              <Text style={styles.listHeaderText}>
                {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for "{searchQuery}"
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#f3e8ff', '#fce7f3']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="people-outline" size={64} color="#a78bfa" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {users.length === 0 ? 'No Users Found' : 'No Search Results'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {users.length === 0 ? 
                'There are no users in the system yet.' : 
                `No users found matching "${searchQuery}"`
              }
            </Text>
            {users.length === 0 && (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchUsers}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#a78bfa', '#ec4899']}
                  style={styles.refreshButtonGradient}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh Users</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Modal Delete User untuk Web */}
      {Platform.OS === 'web' && showDeleteUserModal && (
        <Modal
          visible={showDeleteUserModal}
          transparent={true}
          onRequestClose={() => {
            if (!deletingUser) {
              setShowDeleteUserModal(false);
              setUserToDelete(null);
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
                  <Ionicons name="person-remove" size={28} color="#fff" />
                </LinearGradient>
                
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  color: '#0f172a', 
                  marginBottom: 8,
                  textAlign: 'center'
                }}>
                  Delete User
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#64748b', 
                  textAlign: 'center', 
                  lineHeight: 20,
                  marginBottom: 8
                }}>
                  Are you sure you want to delete user "{userToDelete?.username}"?
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#ef4444', 
                  textAlign: 'center', 
                  fontWeight: '600',
                  marginBottom: 4
                }}>
                  This action cannot be undone.
                </Text>
                <Text style={{ 
                  fontSize: 11, 
                  color: '#94a3b8', 
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  All associated data will be permanently removed.
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
                    if (!deletingUser) {
                      setShowDeleteUserModal(false);
                      setUserToDelete(null);
                    }
                  }}
                  disabled={deletingUser}
                  activeOpacity={0.7}
                >
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: deletingUser ? '#94a3b8' : '#475569' 
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    backgroundColor: deletingUser ? '#fca5a5' : '#ef4444',
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: deletingUser ? 0.8 : 1,
                  }}
                  onPress={() => userToDelete && performDeleteUser(userToDelete.id, userToDelete.username)}
                  disabled={deletingUser}
                  activeOpacity={0.7}
                >
                  {deletingUser ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  )}
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    {deletingUser ? 'Deleting...' : 'Delete User'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loader: {
    marginTop: 16,
  },
  loadingTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  searchWrapper: {
    marginTop: 8,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconWrapper: {
    marginBottom: 10,
  },
  statIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  listHeaderText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  userCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  userCardContent: {
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatarGradientBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    marginBottom: 6,
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  idText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  refreshButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdminUsersScreen;