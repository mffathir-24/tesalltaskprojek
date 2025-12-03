
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
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

const StaffTaskDetailScreen = ({ route, navigation }) => {
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(null);
  const [showAttachmentDeleteModal, setShowAttachmentDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  
  
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

      const taskData = taskResponse?.task || taskResponse;
      const commentsData = commentsResponse?.comments || commentsResponse || [];
      const attachmentsData = attachmentsResponse?.data || attachmentsResponse || [];

      console.log('📊 Task Data:', taskData);
      console.log('💬 Comments Data:', commentsData);
      console.log('📎 Attachments Data:', attachmentsData);

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

  
  const handleUpdateStatus = async (newStatus) => {
    try {
      setSubmitting(true);
      await taskService.updateTask(projectId, taskId, {
        status: newStatus,
        title: task.title,
        description: task.description,
      });
      
      setTask({ ...task, status: newStatus });
      setShowStatusModal(false);
      Alert.alert('Success', 'Task status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
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

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#ef4444', icon: 'alert-circle-outline' },
    { value: 'in-progress', label: 'In Progress', color: '#f59e0b', icon: 'sync-outline' },
    { value: 'done', label: 'Done', color: '#10b981', icon: 'checkmark-done-outline' },
  ];

  
  const isCommentOwner = (comment) => {
    console.log('🔍 Checking comment ownership:', {
      commentUserId: comment.user_id,
      currentUserId: currentUser?.id,
      isEqual: comment.user_id === currentUser?.id
    });
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
      Alert.alert('Error', 'You can only delete your own comments');
      return;
    }

    if (Platform.OS === 'web') {
      setCommentToDelete(comment);
      setShowDeleteModal(true);
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
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  
  const handleUploadFile = async () => {
    try {
      console.log('🔄 Starting file upload process...');

      let file;
      
      
      if (Platform.OS === 'web') {
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        
        
        const filePromise = new Promise((resolve, reject) => {
          input.onchange = (e) => {
            const selectedFile = e.target.files[0];
            if (!selectedFile) {
              reject(new Error('No file selected'));
              return;
            }
            
            
            const maxSize = 10 * 1024 * 1024;
            if (selectedFile.size > maxSize) {
              Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
              reject(new Error('File too large'));
              return;
            }
            
            
            file = {
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type,
              uri: selectedFile
            };
            resolve(file);
          };
          
          input.oncancel = () => {
            reject(new Error('File selection cancelled'));
          };
        });
        
        input.click();
        await filePromise;
      } else {
        
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('❌ File selection cancelled');
          return;
        }

        file = result.assets[0];
        console.log('📁 Selected file:', {
          name: file.name,
          size: file.size,
          type: file.mimeType,
          uri: file.uri
        });

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }
      }

      setUploadingFile(true);

      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        
        formData.append('file', file.uri);
      } else {
        
        formData.append('file', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        });
      }

      console.log('📤 Uploading to task:', taskId);
      const response = await attachmentService.uploadAttachment(taskId, formData);
      
      console.log('✅ Upload response:', response);
      await fetchTaskData();
      Alert.alert('Success', 'File uploaded successfully');
      
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.message === 'Network Error' || error.message.includes('Network')) {
        Alert.alert(
          'Network Error', 
          'Cannot connect to server. Please check:\n\n' +
          '• Server is running at http://localhost:8080/api/\n' +
          '• Your device is on the same WiFi network\n' +
          '• Firewall is not blocking the connection\n' +
          '• Backend CORS is properly configured'
        );
      } else if (error.response?.status === 413) {
        Alert.alert('File Too Large', 'The file size exceeds the server limit');
      } else if (error.response?.status === 415) {
        Alert.alert('Unsupported File Type', 'This file type is not supported');
      } else if (error.response?.data?.error) {
        Alert.alert('Upload Failed', error.response.data.error);
      } else if (error.message !== 'File selection cancelled' && error.message !== 'File too large') {
        Alert.alert('Error', error.message || 'Failed to upload file');
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleOpenPreview = (attachment) => {
    setSelectedAttachment(attachment);
    setShowPreviewModal(true);
  };

  const handleDeleteAttachment = (attachment) => {
  const isOwner = attachment.uploader?.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  
  if (!isOwner && !isAdmin && !isManager) {
    if (Platform.OS === 'web') {
      window.alert('Permission Denied\n\nYou can only delete files that you uploaded.');
    } else {
      Alert.alert(
        'Permission Denied', 
        'You can only delete files that you uploaded.'
      );
    }
    return;
  }

  if (Platform.OS === 'web') {
    // Untuk web, gunakan modal custom yang sama dengan comments
    setAttachmentToDelete(attachment);
    setShowAttachmentDeleteModal(true);
  } else {
    // Mobile: Tetap menggunakan Alert.alert
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${attachment.file_name}"?\n\nThis action cannot be undone.`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDeleteAttachment(attachment)
        },
      ]
    );
  }
};

const performDeleteAttachment = async (attachment) => {
  try {
    setDeletingAttachment(attachment.id);
    console.log('🗑️ Deleting attachment:', {
      id: attachment.id,
      taskId: taskId,
      fileName: attachment.file_name
    });
    
    await attachmentService.deleteAttachment(taskId, attachment.id);
    
    console.log('✅ Attachment deleted successfully');
    await fetchTaskData();
    
    // PERBAIKAN: Menggunakan notifikasi yang sesuai untuk web
    if (Platform.OS === 'web') {
      // Anda bisa menggunakan alert sederhana atau modal yang lebih bagus
      window.alert('File deleted successfully');
    } else {
      Alert.alert('Success', 'File deleted successfully');
    }
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // PERBAIKAN: Error handling untuk web
    let errorMessage = 'Failed to delete file';
    if (error.response?.status === 404) {
      errorMessage = 'File not found';
    } else if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to delete this file';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (Platform.OS === 'web') {
      window.alert(`Error: ${errorMessage}`);
    } else {
      Alert.alert('Error', errorMessage);
    }
  } finally {
    setDeletingAttachment(null);
    setSelectedAttachment(null);
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
          borderLeftColor: isOwner ? '#10b981' : 'transparent',
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
              colors={['#10b981', '#34d399']}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
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
                    backgroundColor: '#10b981',
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
                    backgroundColor: '#10b98115',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleEditComment(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={16} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#ef444415',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleDeleteComment(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
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

  const renderAttachmentItem = ({ item, index }) => {
    const isOwner = item.uploader?.id === currentUser?.id;
    const canDelete = isOwner || currentUser?.role === 'admin' || currentUser?.role === 'manager';
    const isDeleting = deletingAttachment === item.id;

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        style={{
          marginHorizontal: paddingHorizontal,
          marginBottom: 12,
          cursor: Platform.OS === 'web' ? 'pointer' : 'default' 
        }}
      >
        <View style={{
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
          borderLeftWidth: isOwner ? 4 : 0,
          borderLeftColor: isOwner ? '#10b981' : 'transparent',
          
          ...(Platform.OS === 'web' && {
            ':hover': {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              transform: [{ translateY: -2 }],
              transition: 'all 0.2s ease-in-out'
            }
          })
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            padding: 16,
            
            pointerEvents: isDeleting ? 'none' : 'auto'
          }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              onPress={() => handleOpenPreview(item)}
              activeOpacity={0.7}
              disabled={isDeleting}
              
              {...(Platform.OS === 'web' && {
                onMouseEnter: (e) => {
                  e.currentTarget.style.opacity = '0.8';
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.opacity = '1';
                }
              })}
            >
              <LinearGradient
                colors={['#10b981', '#34d399']}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  flexShrink: 0 
                }}
              >
                <Ionicons 
                  name={getFileIcon(item.mime_type, item.file_name)} 
                  size={24} 
                  color="#fff" 
                />
              </LinearGradient>

              <View style={{ flex: 1, minWidth: 0 }}> {/* PERBAIKAN: Tambah minWidth untuk web */}
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: '#0f172a', 
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.file_name || 'Unknown File'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  {formatFileSize(item.file_size)} • {formatDate(item.created_at)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>Uploaded by </Text>
                  <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>
                    {item.uploader?.username || 'Unknown'}
                  </Text>
                  {isOwner && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#10b981',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      marginLeft: 6,
                    }}>
                      <Ionicons name="person" size={8} color="#fff" />
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white', marginLeft: 4 }}>YOU</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Action buttons */}
            <View style={{ 
              flexDirection: 'row', 
              gap: 8,
              flexShrink: 0 
            }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#10b98115',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => handleOpenPreview(item)}
                disabled={isDeleting}
                activeOpacity={0.7}
                
                {...(Platform.OS === 'web' && {
                  title: 'Preview file',
                  onMouseEnter: (e) => {
                    e.currentTarget.style.backgroundColor = '#10b98130';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.backgroundColor = '#10b98115';
                  }
                })}
              >
                <Ionicons name="eye-outline" size={18} color="#10b981" />
              </TouchableOpacity>

              {canDelete && (
                <TouchableOpacity
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isDeleting ? '#f1f5f9' : '#ef444415',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleDeleteAttachment(item)}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                  
                  {...(Platform.OS === 'web' && {
                    title: 'Delete file',
                    onMouseEnter: (e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#ef444430';
                      }
                    },
                    onMouseLeave: (e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#ef444415';
                      }
                    }
                  })}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  
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
            colors={['#10b981']}
            tintColor="#10b981"
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: '#10b981',
            }}
            onPress={() => setShowStatusModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
              Update
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          alignSelf: 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: getStatusGradient(task?.status)[0],
        }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: 'white' }}>
            {task?.status?.replace('-', ' ').toUpperCase()}
          </Text>
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
            colors={['#10b981', '#34d399']}
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

      {/* Project Information Card */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <LinearGradient
            colors={['#10b981', '#34d399']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="briefcase-outline" size={20} color="#fff" />
          </LinearGradient>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
            Project Information
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
          {task?.project?.nama || 'Unknown Project'}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b' }}>
          Project ID: {task?.project_id || 'N/A'}
        </Text>
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
            colors={['#10b981', '#34d399']}
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
            <Ionicons name="calendar-outline" size={18} color="#10b981" style={{ marginRight: 14, marginTop: 2 }} />
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
            <Ionicons name="create-outline" size={18} color="#10b981" style={{ marginRight: 14, marginTop: 2 }} />
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
            <Ionicons name="refresh-outline" size={18} color="#10b981" style={{ marginRight: 14, marginTop: 2 }} />
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
            colors={['#10b981', '#34d399']}
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
          borderLeftColor: '#10b981',
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
            textAlignVertical="top"
          />
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: (!newComment.trim() || submitting) ? '#cbd5e1' : '#10b981',
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
              colors={['#10b981']}
              tintColor="#10b981"
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
              <Ionicons name="chatbubbles-outline" size={40} color="#10b981" />
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

  
  const renderUploadSection = () => (
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
        
        ...(Platform.OS === 'web' && {
          ':hover': {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            transform: [{ translateY: -1 }],
            transition: 'all 0.2s ease-in-out'
          }
        })
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 }}>
        Upload Files
      </Text>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: uploadingFile ? '#cbd5e1' : '#10b981',
          
          ...(Platform.OS === 'web' && !uploadingFile && {
            ':hover': {
              backgroundColor: '#0ea271',
              transform: [{ scale: 1.02 }],
              transition: 'all 0.2s ease-in-out'
            }
          })
        }}
        onPress={handleUploadFile}
        disabled={uploadingFile}
        activeOpacity={0.7}
        
        {...(Platform.OS === 'web' && {
          cursor: uploadingFile ? 'not-allowed' : 'pointer'
        })}
      >
        {uploadingFile ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 8 }}>
              Uploading...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
              Upload File
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 12 }}>
        Upload documents, images, or other files (max 10MB)
      </Text>
      
      {/* PERBAIKAN: Tambah info untuk web */}
      {Platform.OS === 'web' && (
        <Text style={{ 
          fontSize: 11, 
          color: '#94a3b8', 
          textAlign: 'center', 
          marginTop: 8,
          fontStyle: 'italic'
        }}>
          Click to select a file from your computer
        </Text>
      )}
    </Animated.View>
  );

  const renderAttachmentsTab = () => (
    <View style={{ flex: 1 }}>
      {/* Upload File Section */}
      {renderUploadSection()}

      {/* Attachments List */}
      <FlatList
        data={attachments}
        renderItem={renderAttachmentItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={{ 
          paddingBottom: contentContainerPaddingBottom,
          
          ...(Platform.OS === 'web' && {
            minHeight: '50vh',
            overflowY: 'auto'
          })
        }}
        scrollEnabled={Platform.OS === 'web' ? true : false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10b981']}
              tintColor="#10b981"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        ListEmptyComponent={
          <View style={{ 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingVertical: 60, 
            paddingHorizontal: paddingHorizontal,
            minHeight: Platform.OS === 'web' ? '40vh' : undefined
          }}>
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
              <Ionicons name="attach-outline" size={40} color="#10b981" />
            </LinearGradient>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
              No Attachments
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 }}>
              No files have been attached to this task yet.
            </Text>
            {Platform.OS === 'web' && (
              <Text style={{ 
                fontSize: 12, 
                color: '#94a3b8', 
                textAlign: 'center', 
                marginTop: 12,
                maxWidth: 300
              }}>
                Click "Upload File" above to add documents, images, or other files to this task.
              </Text>
            )}
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
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            }}>
              <LinearGradient
                colors={['#10b981', '#34d399']}
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
              backgroundColor: '#10b981',
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
                  <Ionicons name="arrow-back" size={24} color="#10b981" />
                </TouchableOpacity>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 }} numberOfLines={1}>
                    {task?.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    Task Details • {projectId?.slice(0, 8)}...
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
                      backgroundColor: activeTab === tab.key ? '#10b981' : 'transparent',
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

          {/* Update Status Modal */}
          <Modal
            visible={showStatusModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowStatusModal(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <BlurView
                intensity={90}
                tint="light"
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <Animated.View entering={FadeInUp.delay(50)} style={{ 
                  backgroundColor: 'white', 
                  borderTopLeftRadius: 24, 
                  borderTopRightRadius: 24,
                  maxHeight: '80%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 10,
                }}>
                  <View style={{ padding: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Update Task Status</Text>
                      <TouchableOpacity 
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: '#f1f5f9',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => setShowStatusModal(false)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={24} color="#374151" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 24, lineHeight: 22 }}>
                      Select the current status of this task
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {statusOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 16,
                            borderRadius: 16,
                            marginBottom: 12,
                            borderWidth: 2,
                            borderColor: task?.status === option.value ? '#10b981' : '#e2e8f0',
                            backgroundColor: task?.status === option.value ? '#10b98110' : 'white',
                          }}
                          onPress={() => handleUpdateStatus(option.value)}
                          disabled={submitting}
                          activeOpacity={0.7}
                        >
                          <View 
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 16,
                              backgroundColor: option.color,
                            }}
                          >
                            <Ionicons name={option.icon} size={22} color="#fff" />
                          </View>
                          
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
                              {option.label}
                            </Text>
                            {task?.status === option.value && (
                              <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '500', marginTop: 4 }}>
                                Current Status
                              </Text>
                            )}
                          </View>

                          {task?.status === option.value && (
                            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </Animated.View>
              </BlurView>
            </View>
          </Modal>

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
                        backgroundColor: (!editCommentText.trim() || submitting) ? '#cbd5e1' : '#10b981',
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

          {/* Delete Comment Modal for Web */}
          {Platform.OS === 'web' && showDeleteModal && (
            <Modal
              visible={showDeleteModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {
                setShowDeleteModal(false);
                setCommentToDelete(null);
              }}
            >
              <BlurView
                intensity={90}
                tint="light"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <Animated.View 
                  entering={FadeInUp.delay(50)}
                  style={{
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
                  }}
                >
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
                    
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
                      Delete Comment
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 }}>
                      Are you sure you want to delete this comment? This action cannot be undone.
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
                        setShowDeleteModal(false);
                        setCommentToDelete(null);
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
                        backgroundColor: '#ef4444',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => commentToDelete && performDeleteComment(commentToDelete)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </BlurView>
            </Modal>
          )}
          {Platform.OS === 'web' && showAttachmentDeleteModal && (
            <Modal
              visible={showAttachmentDeleteModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => {
                setShowAttachmentDeleteModal(false);
                setAttachmentToDelete(null);
              }}
            >
              <BlurView
                intensity={90}
                tint="light"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <Animated.View 
                  entering={FadeInUp.delay(50)}
                  style={{
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
                  }}
                >
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
                    
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
                      Delete File
                    </Text>
                    <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 }}>
                      Are you sure you want to delete "{attachmentToDelete?.file_name}"?
                    </Text>
                    <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
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
                        setShowAttachmentDeleteModal(false);
                        setAttachmentToDelete(null);
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
                        backgroundColor: '#ef4444',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => {
                        if (attachmentToDelete) {
                          performDeleteAttachment(attachmentToDelete);
                          setShowAttachmentDeleteModal(false);
                        }
                      }}
                      disabled={deletingAttachment}
                      activeOpacity={0.7}
                    >
                      {deletingAttachment ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                            Delete
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </BlurView>
            </Modal>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScrollComponent>
  );
};

export default StaffTaskDetailScreen;