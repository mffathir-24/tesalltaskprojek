
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userService } from '../../services/api';

const EditUserScreen = ({ navigation, route }) => {
  const { userId, user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser || {});
  const [loading, setLoading] = useState(!initialUser);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'staff',
  });
  const [changes, setChanges] = useState({});
  const [showRoleModal, setShowRoleModal] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    if (!initialUser) {
      fetchUserDetail();
    } else {
      initializeForm();
    }
  }, [initialUser]);

  useEffect(() => {
    if (user.id) {
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
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById(userId);
      const userData = response.Users || response;
      setUser(userData);
      initializeForm(userData);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      Alert.alert('Error', 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = (userData = user) => {
    const initialForm = {
      username: userData.username || '',
      email: userData.email || '',
      role: userData.role || 'staff',
    };
    setFormData(initialForm);
    setChanges({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    const originalValue = user[field];
    if (value !== originalValue) {
      setChanges(prev => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[field];
        return newChanges;
      });
    }
  };

  const handleRoleChange = (role) => {
    handleInputChange('role', role);
    setShowRoleModal(false);
  };

  const hasChanges = Object.keys(changes).length > 0;

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      await userService.updateUser(userId, changes);
      
      Alert.alert(
        'Success',
        'User updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to reset all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: initializeForm,
        },
      ]
    );
  };

  const getRoleGradient = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return ['#8B5CF6', '#EC4899'];
      case 'manager':
        return ['#3B82F6', '#06B6D4'];
      case 'staff':
        return ['#10B981', '#34D399'];
      default:
        return ['#6B7280', '#9CA3AF'];
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

  const getRoleBadgeColors = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { bg: '#F3E8FF', border: '#E9D5FF', text: '#7C3AED' };
      case 'manager':
        return { bg: '#DBEAFE', border: '#BFDBFE', text: '#2563EB' };
      case 'staff':
        return { bg: '#D1FAE5', border: '#A7F3D0', text: '#059669' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#4B5563' };
    }
  };

  const RoleOption = ({ role, title, description, icon, selected }) => {
    const gradientColors = getRoleGradient(role);
    
    return (
      <TouchableOpacity
        style={[
          styles.roleOption,
          selected && styles.roleOptionSelected,
          { borderColor: selected ? gradientColors[0] : '#E5E7EB' }
        ]}
        onPress={() => handleRoleChange(role)}
        activeOpacity={0.7}
      >
        <View style={styles.roleOptionContent}>
          <View style={styles.roleOptionLeft}>
            <LinearGradient
              colors={gradientColors}
              style={styles.roleIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon} size={24} color="#ffffff" />
            </LinearGradient>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{title}</Text>
              <Text style={styles.roleDescription}>{description}</Text>
            </View>
          </View>
          {selected && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={28} color={gradientColors[0]} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <LinearGradient
          colors={['#F9FAFB', '#F3F4F6']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
          <Text style={styles.loadingTitle}>Loading User Data...</Text>
          <Text style={styles.loadingSubtitle}>Please wait while we fetch user details</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleBadgeColors = getRoleBadgeColors(user.role);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Edit User</Text>
              <Text style={styles.headerSubtitle}>
                Update user information and permissions
              </Text>
            </View>

            {hasChanges ? (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.resetButton} />
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }}
        >
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <LinearGradient
                colors={getRoleGradient(user.role)}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {user.username?.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.username}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                
                <View style={[
                  styles.roleBadge,
                  { 
                    backgroundColor: roleBadgeColors.bg,
                    borderColor: roleBadgeColors.border 
                  }
                ]}>
                  <Ionicons 
                    name={getRoleIcon(user.role)} 
                    size={14} 
                    color={roleBadgeColors.text}
                  />
                  <Text style={[styles.roleBadgeText, { color: roleBadgeColors.text }]}>
                    Current: {user.role?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="create-outline" size={24} color="#667eea" />
              <Text style={styles.formTitle}>User Information</Text>
            </View>

            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={[
                styles.inputWrapper,
                changes.username && styles.inputWrapperChanged
              ]}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  placeholder="Enter username"
                  placeholderTextColor="#9CA3AF"
                />
                {changes.username && (
                  <View style={styles.changeIndicator} />
                )}
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[
                styles.inputWrapper,
                changes.email && styles.inputWrapperChanged
              ]}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {changes.email && (
                  <View style={styles.changeIndicator} />
                )}
              </View>
            </View>

            {/* Role Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Role</Text>
              <TouchableOpacity
                style={[
                  styles.roleSelector,
                  changes.role && styles.roleSelectorChanged
                ]}
                onPress={() => setShowRoleModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.roleSelectorLeft}>
                  <LinearGradient
                    colors={getRoleGradient(formData.role)}
                    style={styles.roleIconSmall}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={getRoleIcon(formData.role)} size={18} color="#ffffff" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.roleSelectorTitle}>
                      {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                    </Text>
                    <Text style={styles.roleSelectorSubtitle}>
                      {formData.role === 'admin' ? 'Full system access' : 
                       formData.role === 'manager' ? 'Project management' : 
                       'Task management'}
                    </Text>
                  </View>
                </View>
                <View style={styles.roleSelectorRight}>
                  {changes.role && (
                    <View style={[styles.changeIndicator, { marginRight: 8 }]} />
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Changes Summary */}
          {hasChanges && (
            <View style={styles.changesCard}>
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.changesGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.changesHeader}>
                  <View style={styles.changesBadge}>
                    <Ionicons name="notifications" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.changesTitle}>Pending Changes</Text>
                  <View style={styles.changesCount}>
                    <Text style={styles.changesCountText}>{Object.keys(changes).length}</Text>
                  </View>
                </View>
                
                {Object.entries(changes).map(([field, value]) => (
                  <View key={field} style={styles.changeRow}>
                    <Text style={styles.changeField}>
                      {field.replace('_', ' ').charAt(0).toUpperCase() + field.slice(1)}
                    </Text>
                    <View style={styles.changeValues}>
                      <Text style={styles.changeOldValue}>{user[field]}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#667eea" style={{ marginHorizontal: 8 }} />
                      <Text style={styles.changeNewValue}>{value}</Text>
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={22} color="#6B7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.saveButton,
                (!hasChanges || saving) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!hasChanges || saving}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={(!hasChanges || saving) ? ['#D1D5DB', '#9CA3AF'] : ['#667eea', '#764ba2']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="checkmark-outline" size={22} color="#ffffff" />
                )}
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Select Role</Text>
                <Text style={styles.modalSubtitle}>
                  Choose the appropriate role for this user
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowRoleModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView 
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <RoleOption
              role="staff"
              title="Staff Member"
              description="Can view and update assigned tasks, comment on tasks, and upload files"
              icon="person"
              selected={formData.role === 'staff'}
            />
            
            <RoleOption
              role="manager"
              title="Project Manager"
              description="Can create and manage projects, assign tasks to team members, and manage project timelines"
              icon="briefcase"
              selected={formData.role === 'manager'}
            />
            
            <RoleOption
              role="admin"
              title="Administrator"
              description="Full system access including user management, all projects and tasks, and system settings"
              icon="shield-checkmark"
              selected={formData.role === 'admin'}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowRoleModal(false)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.confirmButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loaderWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  inputWrapperChanged: {
    borderColor: '#667eea',
    backgroundColor: '#EEF2FF',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  changeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  roleSelector: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleSelectorChanged: {
    borderColor: '#667eea',
    backgroundColor: '#EEF2FF',
  },
  roleSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleSelectorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleSelectorSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  roleSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changesCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  changesGradient: {
    padding: 20,
  },
  changesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  changesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  changesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  changesCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changesCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  changeField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeOldValue: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  changeNewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  modalHeaderContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  roleOption: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  roleOptionSelected: {
    backgroundColor: '#F5F3FF',
    shadowColor: '#667eea',
    shadowOpacity: 0.2,
    elevation: 6,
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  checkmarkContainer: {
    marginLeft: 12,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default EditUserScreen;