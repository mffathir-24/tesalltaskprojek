
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import FilePreviewModal from '../../components/FilePreviewModal';
import { useAuth } from '../../context/AuthContext';
import { attachmentService, commentService, taskService } from '../../services/api';

const AdminTaskDetailScreen = ({ route, navigation }) => {
  const { taskId, projectId } = route.params;
  const { user: currentUser } = useAuth();
  const { width, height } = useWindowDimensions();
  
  
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);
  
  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const paddingHorizontal = isMobile ? 16 : isTablet ? 24 : 32;
  const contentContainerPaddingBottom = isMobile ? 32 : 64;

  
  const fetchTaskData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskResponse, commentsResponse, attachmentsResponse] = await Promise.all([
        taskService.getTaskById(projectId, taskId),
        commentService.getTaskComments(taskId),
        attachmentService.getTaskAttachments(taskId)
      ]);

      const taskData = taskResponse?.task || taskResponse?.Task || taskResponse || {};
      const commentsData = commentsResponse?.comments || commentsResponse?.Comments || commentsResponse?.data || commentsResponse || [];
      const attachmentsData = attachmentsResponse?.data || attachmentsResponse?.attachments || attachmentsResponse?.Attachments || attachmentsResponse || [];

      setTask(taskData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setAttachments(Array.isArray(attachmentsData) ? attachmentsData : []);
      
    } catch (error) {
      console.error('❌ Error fetching task data:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, taskId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTaskData();
  }, [fetchTaskData]);

  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  
  const isCommentOwner = (comment) => {
    return comment.user_id === currentUser?.id;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      await commentService.createComment(taskId, newComment.trim());
      setNewComment('');
      await fetchTaskData();
      Alert.alert('Success', 'Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    if (!isCommentOwner(comment)) {
      Alert.alert('Error', 'You can only edit your own comments');
      return;
    }
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowCommentModal(true);
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      await commentService.updateComment(taskId, editingComment.id, editCommentText.trim());
      setEditingComment(null);
      setEditCommentText('');
      setShowCommentModal(false);
      await fetchTaskData();
      Alert.alert('Success', 'Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (comment) => {
    if (!isCommentOwner(comment)) {
      if (Platform.OS === 'web') {
        alert('Error: You can only delete your own comments');
      } else {
        Alert.alert('Error', 'You can only delete your own comments');
      }
      return;
    }

    
    if (Platform.OS === 'web') {
      setCommentToDelete(comment);
      setShowDeleteCommentModal(true);
    } else {
      
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await performDeleteComment(comment);
            },
          },
        ]
      );
    }
  };

  
  const performDeleteComment = async (comment) => {
    try {
      setDeletingComment(true);
      await commentService.deleteComment(taskId, comment.id);
      
      
      await fetchTaskData();
      
      
      if (Platform.OS === 'web') {
        alert('Comment deleted successfully');
      } else {
        Alert.alert('Success', 'Comment deleted successfully');
      }
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      if (Platform.OS === 'web') {
        alert('Failed to delete comment');
      } else {
        Alert.alert('Error', 'Failed to delete comment');
      }
    } finally {
      setDeletingComment(false);
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const handleOpenPreview = (attachment) => {
    setSelectedAttachment(attachment);
    setShowPreviewModal(true);
  };

  
  const getStatusGradient = (status) => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return ['#ef4444', '#dc2626'];
      case 'in-progress':
      case 'in_progress':
        return ['#f59e0b', '#d97706'];
      case 'done':
      case 'completed':
        return ['#10b981', '#059669'];
      default:
        return ['#6b7280', '#4b5563'];
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType, filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) return 'image-outline';
    if (mimeType?.startsWith('video/')) return 'videocam-outline';
    if (mimeType?.startsWith('audio/')) return 'musical-notes-outline';
    
    switch (ext) {
      case 'pdf':
        return 'document-text-outline';
      case 'doc':
      case 'docx':
        return 'document-outline';
      case 'xls':
      case 'xlsx':
        return 'stats-chart-outline';
      case 'zip':
      case 'rar':
        return 'archive-outline';
      case 'txt':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  
  const renderCommentItem = ({ item, index }) => {
    const isOwner = isCommentOwner(item);
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={{
          marginHorizontal: paddingHorizontal,
          marginBottom: 12
        }}
      >
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 16,
          borderLeftWidth: isOwner ? 4 : 0,
          borderLeftColor: isOwner ? '#667eea' : 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
            <LinearGradient
              colors={['#667eea', '#8b5cf6']}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                shadowColor: '#667eea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                {item.users?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginRight: 8 }}>
                  {item.users?.username || 'Unknown User'}
                </Text>
                
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: item.users?.role === 'manager' ? '#3b82f6' : 
                                   item.users?.role === 'admin' ? '#8b5cf6' : '#10b981',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white' }}>
                    {item.users?.role?.toUpperCase() || 'USER'}
                  </Text>
                </View>
                
                {isOwner && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#667eea',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginLeft: 8,
                  }}>
                    <Ionicons name="person" size={10} color="#fff" />
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginLeft: 4 }}>YOU</Text>
                  </View>
                )}
              </View>
              
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                {formatDate(item.created_at)}
              </Text>
            </View>

            {isOwner && (
              <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
                <TouchableOpacity 
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#667eea15',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleEditComment(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={16} color="#667eea" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: deletingComment && commentToDelete?.id === item.id 
                      ? '#fecaca' 
                      : '#ef444415',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: deletingComment && commentToDelete?.id === item.id ? 0.7 : 1,
                  }}
                  onPress={() => handleDeleteComment(item)}
                  disabled={deletingComment && commentToDelete?.id === item.id}
                  activeOpacity={0.7}
                >
                  {deletingComment && commentToDelete?.id === item.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  )}
                </TouchableOpacity>

                {Platform.OS === 'web' && showDeleteCommentModal && (
                  <Modal
                    visible={showDeleteCommentModal}
                    transparent={true}
                    onRequestClose={() => {
                      if (!deletingComment) {
                        setShowDeleteCommentModal(false);
                        setCommentToDelete(null);
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
                            <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
                          </LinearGradient>
                          
                          <Text style={{ 
                            fontSize: 20, 
                            fontWeight: 'bold', 
                            color: '#0f172a', 
                            marginBottom: 8,
                            textAlign: 'center'
                          }}>
                            Delete Comment
                          </Text>
                          
                          {/* Preview comment yang akan dihapus */}
                          {commentToDelete && (
                            <View style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 16,
                              width: '100%',
                              borderWidth: 1,
                              borderColor: '#e2e8f0',
                            }}>
                              <Text style={{ 
                                fontSize: 14, 
                                color: '#64748b', 
                                lineHeight: 20,
                                fontStyle: 'italic'
                              }}>
                                "{commentToDelete.content?.substring(0, 100)}"
                                {commentToDelete.content?.length > 100 ? '...' : ''}
                              </Text>
                            </View>
                          )}
                          
                          <Text style={{ 
                            fontSize: 14, 
                            color: '#64748b', 
                            textAlign: 'center', 
                            lineHeight: 20,
                            marginBottom: 8
                          }}>
                            Are you sure you want to delete this comment?
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
                              if (!deletingComment) {
                                setShowDeleteCommentModal(false);
                                setCommentToDelete(null);
                              }
                            }}
                            disabled={deletingComment}
                            activeOpacity={0.7}
                          >
                            <Text style={{ 
                              fontSize: 14, 
                              fontWeight: '600', 
                              color: deletingComment ? '#94a3b8' : '#475569' 
                            }}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              paddingVertical: 14,
                              backgroundColor: deletingComment ? '#fca5a5' : '#ef4444',
                              borderRadius: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: deletingComment ? 0.8 : 1,
                            }}
                            onPress={() => commentToDelete && performDeleteComment(commentToDelete)}
                            disabled={deletingComment}
                            activeOpacity={0.7}
                          >
                            {deletingComment ? (
                              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            ) : (
                              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            )}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                              {deletingComment ? 'Deleting...' : 'Delete Comment'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
                )}
              </View>
            )}
          </View>

          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>
            {item.content}
          </Text>
          
          {item.updated_at !== item.created_at && (
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
              Edited {formatDate(item.updated_at)}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderAttachmentItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      style={{
        marginHorizontal: paddingHorizontal,
        marginBottom: 12
      }}
    >
      <TouchableOpacity
        onPress={() => handleOpenPreview(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <LinearGradient
          colors={['#f8fafc', '#ffffff']}
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
        >
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons 
              name={getFileIcon(item.mime_type, item.file_name)} 
              size={24} 
              color="#fff" 
            />
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4 }} numberOfLines={1}>
              {item.file_name || 'Unknown File'}
            </Text>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              {formatFileSize(item.file_size)} • {formatDate(item.created_at)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#64748b' }}>Uploaded by </Text>
              <Text style={{ fontSize: 11, color: '#667eea', fontWeight: '600' }}>
                {item.uploader?.username || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#667eea15',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="eye-outline" size={18} color="#667eea" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  
  const renderDetailsTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: paddingHorizontal, paddingBottom: contentContainerPaddingBottom }}
      scrollEnabled={Platform.OS === 'web'}
      refreshControl={
        Platform.OS !== 'web' ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        ) : undefined
      }
    >
      {/* Task Status Card */}
      <Animated.View 
        entering={FadeInUp.delay(100)}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={getStatusGradient(task?.status)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons 
                name={getStatusIcon(task?.status)} 
                size={22} 
                color="#fff" 
              />
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 2 }}>
                Current Status
              </Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                {task?.status?.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <LinearGradient
            colors={getStatusGradient(task?.status)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              shadowColor: getStatusGradient(task?.status)[0],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>
              {task?.status?.replace('-', ' ').toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Description Card */}
      <Animated.View 
        entering={FadeInUp.delay(150)}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
            Description
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
          {task?.description || 'No description provided for this task.'}
        </Text>
      </Animated.View>

      {/* Assignee Card */}
      <Animated.View 
        entering={FadeInUp.delay(200)}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
            Assigned To
          </Text>
        </View>
        {task?.assignee ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={['#667eea', '#8b5cf6']}
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                {task.assignee.username?.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
                {task.assignee.username}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                {task.assignee.email}
              </Text>
              <View style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: task.assignee.role === 'manager' ? '#3b82f6' : 
                               task.assignee.role === 'admin' ? '#8b5cf6' : '#10b981',
              }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'white' }}>
                  {task.assignee.role?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
            <LinearGradient
              colors={['#f0f9ff', '#e0f2fe']}
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="person-remove-outline" size={28} color="#667eea" />
            </LinearGradient>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 8 }}>
              Not assigned to anyone
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Timeline Card */}
      <Animated.View 
        entering={FadeInUp.delay(250)}
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
            Timeline
          </Text>
        </View>
        
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="calendar-outline" size={18} color="#667eea" style={{ marginRight: 14, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 4 }}>
                Due Date
              </Text>
              <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '500' }}>
                {task?.due_date ? formatDate(task.due_date) : 'No due date set'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="create-outline" size={18} color="#667eea" style={{ marginRight: 14, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 4 }}>
                Created
              </Text>
              <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '500' }}>
                {formatDate(task?.created_at)}
              </Text>
            </View>
          </View>
        </View>
        
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="refresh-outline" size={18} color="#667eea" style={{ marginRight: 14, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 4 }}>
                Last Updated
              </Text>
              <Text style={{ fontSize: 14, color: '#0f172a', fontWeight: '500' }}>
                {formatDate(task?.updated_at)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Task ID Card */}
      <Animated.View 
        entering={FadeInUp.delay(300)}
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
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <LinearGradient
            colors={['#667eea', '#8b5cf6']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="key-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
            Task Information
          </Text>
        </View>
        <View style={{
          backgroundColor: '#f8fafc',
          borderRadius: 14,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: '#667eea',
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }}>
          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 6 }}>
            Task ID
          </Text>
          <Text style={{ fontSize: 13, color: '#0f172a', fontFamily: 'monospace', fontWeight: '500' }}>
            {taskId}
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderCommentsTab = () => (
    <View style={{ flex: 1 }}>
      {/* Add Comment Section */}
      <Animated.View 
        entering={FadeInUp.delay(100)}
        style={{
          marginHorizontal: paddingHorizontal,
          marginTop: 16,
          marginBottom: 16,
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
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>
          Add Comment
        </Text>
        <View style={{
          borderRadius: 14,
          marginBottom: 12,
          backgroundColor: '#f8fafc',
          borderWidth: 1.5,
          borderColor: '#e2e8f0',
          overflow: 'hidden',
        }}>
          <TextInput
            style={{
              padding: 14,
              fontSize: 14,
              color: '#0f172a',
              minHeight: 100,
              textAlignVertical: 'top',
            }}
            placeholder="Write your comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={4}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: (!newComment.trim() || submitting) ? '#cbd5e1' : '#6366f1',
          }}
          onPress={handleAddComment}
          disabled={!newComment.trim() || submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: contentContainerPaddingBottom }}
        scrollEnabled={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: paddingHorizontal }}>
            <LinearGradient
              colors={['#f0f9ff', '#e0f2fe']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="chatbubbles-outline" size={40} color="#667eea" />
            </LinearGradient>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
              No Comments Yet
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 }}>
              Be the first to comment on this task.
            </Text>
          </View>
        }
      />
    </View>
  );

  const renderAttachmentsTab = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={attachments}
        renderItem={renderAttachmentItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: contentContainerPaddingBottom }}
        scrollEnabled={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
              tintColor="#6366f1"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: paddingHorizontal }}>
            <LinearGradient
              colors={['#f0f9ff', '#e0f2fe']}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="attach-outline" size={40} color="#667eea" />
            </LinearGradient>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
              No Attachments
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 }}>
              No files have been attached to this task yet.
            </Text>
          </View>
        }
      />
    </View>
  );

  
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View entering={FadeInUp.delay(100).springify()}>
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
            <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
              Loading Task
            </Text>
            <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
              Fetching task details and comments...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  
  if (!task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', paddingHorizontal: paddingHorizontal }}>
        <Animated.View entering={FadeInUp.delay(100)} style={{ alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: '#fff5f5',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="warning" size={40} color="#ef4444" />
          </View>
          <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
            Task Not Found
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            Unable to load task details. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#667eea',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  
  const ScrollComponent = Platform.OS === 'web' ? ScrollView : SafeAreaView;
  const scrollProps = Platform.OS === 'web' ? {
    scrollEnabled: true,
    showsVerticalScrollIndicator: true,
    contentContainerStyle: {
      flexGrow: 1,
    },
    style: {
      minHeight: '100vh',
    }
  } : {};

  return (
    <ScrollComponent
      style={[{ flex: 1, backgroundColor: '#f8fafc' }, Platform.OS === 'web' && { minHeight: '100vh' }]}
      {...scrollProps}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header with BlurView */}
          <BlurView intensity={90} tint="light" style={{ paddingHorizontal: paddingHorizontal, paddingTop: 12, paddingBottom: 16 }}>
            <Animated.View entering={FadeInUp.delay(50)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    marginRight: 12,
                  }}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#667eea" />
                </TouchableOpacity>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 }} numberOfLines={1}>
                    {task?.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    Task Details
                  </Text>
                </View>

                <LinearGradient
                  colors={getStatusGradient(task?.status)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    shadowColor: getStatusGradient(task?.status)[0],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons 
                    name={getStatusIcon(task?.status)} 
                    size={14} 
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'white' }}>
                    {task?.status?.toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>

              {/* Tab Navigation */}
              <View style={{
                backgroundColor: 'white',
                borderRadius: 14,
                padding: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                flexDirection: 'row',
              }}>
                {[
                  { key: 'details', icon: 'information-circle-outline', label: 'Details' },
                  { key: 'comments', icon: 'chatbubbles-outline', label: `Comments (${comments.length})` },
                  { key: 'attachments', icon: 'attach-outline', label: `Files (${attachments.length})` }
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      backgroundColor: activeTab === tab.key ? '#6366f1' : 'transparent',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={tab.icon} 
                      size={16} 
                      color={activeTab === tab.key ? '#fff' : '#64748b'} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={{
                      fontSize: 12,
                      fontWeight: activeTab === tab.key ? '600' : '500',
                      color: activeTab === tab.key ? '#fff' : '#64748b',
                    }} numberOfLines={1}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </BlurView>

          {/* Content Area */}
          <View style={{ flex: 1 }}>
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'comments' && renderCommentsTab()}
            {activeTab === 'attachments' && renderAttachmentsTab()}
          </View>

          {/* Edit Comment Modal */}
          <Modal
            visible={showCommentModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => {
              setShowCommentModal(false);
              setEditingComment(null);
              setEditCommentText('');
            }}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                {/* Modal Header */}
                <BlurView intensity={90} tint="light" style={{ paddingHorizontal: paddingHorizontal, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>
                      Edit Comment
                    </Text>
                    <TouchableOpacity 
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#f1f5f9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        setShowCommentModal(false);
                        setEditingComment(null);
                        setEditCommentText('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={24} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </BlurView>

                {/* Modal Content */}
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: paddingHorizontal, paddingBottom: 32 }}
                >
                  <View style={{
                    borderRadius: 16,
                    marginBottom: 20,
                    backgroundColor: '#f8fafc',
                    borderWidth: 1.5,
                    borderColor: '#e2e8f0',
                    overflow: 'hidden',
                  }}>
                    <TextInput
                      style={{
                        padding: 16,
                        fontSize: 15,
                        color: '#0f172a',
                        minHeight: 150,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Edit your comment..."
                      value={editCommentText}
                      onChangeText={setEditCommentText}
                      multiline
                      numberOfLines={6}
                      placeholderTextColor="#94a3b8"
                      autoFocus
                    />
                  </View>

                  {/* Buttons */}
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
                        setShowCommentModal(false);
                        setEditingComment(null);
                        setEditCommentText('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        backgroundColor: (!editCommentText.trim() || submitting) ? '#cbd5e1' : '#6366f1',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={handleUpdateComment}
                      disabled={!editCommentText.trim() || submitting}
                      activeOpacity={0.7}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                        {submitting ? 'Updating...' : 'Update'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>

          {/* File Preview Modal */}
          <FilePreviewModal
            visible={showPreviewModal}
            onClose={() => {
              setShowPreviewModal(false);
              setSelectedAttachment(null);
            }}
            attachment={selectedAttachment}
            apiBaseUrl="http://localhost:8080/api"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScrollComponent>
  );
};

export default AdminTaskDetailScreen;
