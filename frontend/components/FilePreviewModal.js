
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const FilePreviewModal = ({ visible, onClose, attachment, apiBaseUrl }) => {
  const { authToken } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [previewType, setPreviewType] = useState('direct');
  const [localFileUri, setLocalFileUri] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (visible && attachment) {
      getToken();
      determinePreviewType();
      setError(null);
      setLoading(false);
      setDownloading(false);
    }
    return () => {
      
      if (localFileUri && Platform.OS !== 'web') {
        FileSystem.deleteAsync(localFileUri, { idempotent: true }).catch(() => {});
      }
    };
  }, [visible, attachment]);

  
  const getToken = async () => {
    try {
      if (Platform.OS === 'web') {
        
        const storedToken = authToken || localStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } else {
        
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  
  const getDownloadUrl = () => {
    const baseUrl = apiBaseUrl || 'http://localhost:8080/api';
    if (token) {
      
      return `${baseUrl}/attachments/${attachment.id}/download`;
    } else {
      
      return `${baseUrl}/attachments/${attachment.id}/download`;
    }
  };

  
  const getWebPreviewUrl = () => {
    const baseUrl = apiBaseUrl || 'http://localhost:8080/api';
    if (Platform.OS === 'web' && token) {
      
      return `${baseUrl}/attachments/${attachment.id}/download?token=${encodeURIComponent(token)}`;
    }
    return getDownloadUrl();
  };

  
  const getSafeDirectory = () => {
    if (Platform.OS === 'web') {
      return '';
    }
    return FileSystem.documentDirectory || FileSystem.cacheDirectory || 'file:///';
  };

  
  const getSafeFileName = (fileName) => {
    if (!fileName) return 'download_file';
    return fileName.replace(/[^a-z0-9.\-_]/gi, '_');
  };

  
  const getSafeFileUri = (fileName) => {
    if (Platform.OS === 'web') {
      return fileName;
    }
    const directory = getSafeDirectory();
    const safeFileName = getSafeFileName(fileName);
    return `${directory}${safeFileName}`;
  };

  const determinePreviewType = () => {
    const mimeType = attachment?.mime_type || '';
    const fileName = attachment?.file_name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();

    
    const directPreviewTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'text/csv',
      'image/',
      'video/',
      'audio/'
    ];

    
    const officeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (directPreviewTypes.some(type => mimeType.startsWith(type))) {
      setPreviewType('direct');
    } else if (officeTypes.includes(mimeType) || 
               ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes('.' + ext)) {
      setPreviewType('office');
    } else {
      setPreviewType('download');
    }
  };

  
  const downloadFile = async () => {
    try {
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const baseUrl = apiBaseUrl || 'http://localhost:8080/api';
      const downloadUrl = `${baseUrl}/attachments/${attachment.id}/download`;

      console.log('Downloading file:', {
        url: downloadUrl,
        fileName: attachment.file_name,
        platform: Platform.OS
      });

      if (Platform.OS === 'web') {
        
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name || 'download';
        document.body.appendChild(a);
        a.click();
        
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return url;
      } else {
        
        const fileUri = getSafeFileUri(attachment.file_name);

        const downloadResult = await FileSystem.downloadAsync(
          downloadUrl,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (downloadResult && downloadResult.status === 200) {
          console.log('File downloaded successfully:', downloadResult.uri);
          setLocalFileUri(downloadResult.uri);
          return downloadResult.uri;
        } else {
          throw new Error(`Download failed with status: ${downloadResult?.status}`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file: ' + error.message);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      if (previewType === 'direct' && Platform.OS === 'web') {
        
        const previewUrl = getWebPreviewUrl();
        
        console.log('Opening web preview:', previewUrl);
        
        
        window.open(previewUrl, '_blank');
        
      } else if (previewType === 'direct') {
        
        const previewUrl = getWebPreviewUrl();
        
        console.log('Opening mobile preview:', previewUrl);

        await WebBrowser.openBrowserAsync(previewUrl, {
          toolbarColor: '#6366f1',
          secondaryToolbarColor: '#4f46e5',
          controlsColor: '#ffffff',
          dismissButtonStyle: 'close',
          enableBarCollapsing: false,
          showTitle: true,
        });
      } else if (previewType === 'office') {
        
        await downloadAndOpenOfficeFile();
      }
      
    } catch (err) {
      console.error('Error opening preview:', err);
      setError(err.message);
      
      if (err.message.includes('Authentication')) {
        Alert.alert(
          'Authentication Required',
          'Please login again to access this file.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadAndOpenOfficeFile = async () => {
    try {
      
      const fileUri = await downloadFile();
      
      console.log('File ready to open:', fileUri);

      if (Platform.OS === 'web') {
        
        window.open(fileUri, '_blank');
      } else {
        await openFileWithSharing(fileUri);
      }
      
    } catch (error) {
      console.error('Error downloading office file:', error);
      throw new Error('Failed to open office file: ' + error.message);
    }
  };

  const openFileWithSharing = async (fileUri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: attachment.mime_type,
        dialogTitle: `Open ${attachment.file_name}`,
        UTI: attachment.mime_type,
      });
    } else {
      Alert.alert(
        'File Ready',
        `File is ready to be opened at: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      
      await downloadFile();

      
      if (Platform.OS === 'web') {
        Alert.alert('Download Complete', 'File downloaded successfully!');
      } else {
        Alert.alert(
          'Download Complete', 
          'File downloaded successfully!',
          [
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        error.message || 'Unknown error occurred'
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenWithApp = async () => {
    try {
      if (!localFileUri) {
        Alert.alert('Info', 'Please download the file first');
        return;
      }

      await openFileWithSharing(localFileUri);
    } catch (error) {
      console.error('Error opening with app:', error);
      Alert.alert('Error', 'No app available to open this file type');
    }
  };

  const getFileIcon = () => {
    const mimeType = attachment?.mime_type || '';
    const fileName = attachment?.file_name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType.startsWith('video/')) return 'videocam-outline';
    if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
    if (mimeType === 'application/pdf' || ext === 'pdf') return 'document-text-outline';
    if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') return 'document-outline';
    if (mimeType.includes('excel') || ext === 'xls' || ext === 'xlsx') return 'stats-chart-outline';
    if (mimeType.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') return 'tv-outline';
    if (ext === 'zip' || ext === 'rar') return 'archive-outline';
    if (ext === 'txt') return 'document-text-outline';
    return 'document-outline';
  };

  const getFileTypeDescription = () => {
    const mimeType = attachment?.mime_type || '';
    const fileName = attachment?.file_name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (mimeType.startsWith('image/')) return 'Image File';
    if (mimeType.startsWith('video/')) return 'Video File';
    if (mimeType.startsWith('audio/')) return 'Audio File';
    if (mimeType === 'application/pdf') return 'PDF Document';
    if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') return 'Word Document';
    if (mimeType.includes('excel') || ext === 'xls' || ext === 'xlsx') return 'Excel Spreadsheet';
    if (mimeType.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') return 'PowerPoint Presentation';
    if (ext === 'txt') return 'Text File';
    if (ext === 'zip' || ext === 'rar') return 'Archive File';
    return 'Document';
  };

  const getPreviewDescription = () => {
    switch (previewType) {
      case 'direct':
        return Platform.OS === 'web' 
          ? 'This file can be previewed directly in a new browser tab.' 
          : 'This file can be previewed directly in your browser.';
      case 'office':
        return Platform.OS === 'web'
          ? 'This file will be downloaded and can be opened with appropriate apps.'
          : 'This file will be opened with an installed app (Word, Excel, etc.).';
      case 'download':
        return 'Please download this file to view its contents.';
      default:
        return 'Ready to preview this file.';
    }
  };

  const getPreviewIcon = () => {
    switch (previewType) {
      case 'direct':
        return Platform.OS === 'web' ? 'open-outline' : 'eye-outline';
      case 'office':
        return 'document-outline';
      case 'download':
        return 'download-outline';
      default:
        return 'document-outline';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  
  const renderWebPreview = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#374151" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.fileInfo}>
          <View style={styles.fileIconContainer}>
            <Ionicons name={getFileIcon()} size={32} color="#6366f1" />
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{attachment?.file_name}</Text>
            <Text style={styles.fileType}>
              {getFileTypeDescription()} • {formatFileSize(attachment?.file_size)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>
              {previewType === 'office' ? 
                'Downloading and opening file...' : 
                'Opening preview...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Preview Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handlePreview}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleDownload}>
                <Ionicons name="download" size={20} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.previewContent}>
            <View style={styles.previewIconContainer}>
              <View style={styles.previewIconBackground}>
                <Ionicons name={getPreviewIcon()} size={48} color="#6366f1" />
              </View>
              <Text style={styles.previewTitle}>
                {previewType === 'download' ? 'Download Required' : 'Ready to View'}
              </Text>
              <Text style={styles.previewSubtitle}>
                Choose how you want to access this file
              </Text>
            </View>

            <View style={styles.previewInfo}>
              <View style={styles.previewDescription}>
                <Ionicons name={getPreviewIcon()} size={24} color="#6366f1" />
                <Text style={styles.previewDescriptionText}>
                  {getPreviewDescription()}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              {previewType !== 'download' && (
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={handlePreview}
                  disabled={loading}
                >
                  <Ionicons name={Platform.OS === 'web' ? 'open-outline' : 'eye-outline'} 
                           size={22} color="#fff" />
                  <Text style={styles.previewButtonText}>
                    {previewType === 'office' ? 
                      (Platform.OS === 'web' ? 'Download & Open' : 'Open with App') : 
                      (Platform.OS === 'web' ? 'Open in New Tab' : 'Open Preview')}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download" size={22} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>File Information</Text>
        <View style={styles.fileInfoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>File Type</Text>
            <Text style={styles.infoValue}>{attachment?.mime_type || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>File Size</Text>
            <Text style={styles.infoValue}>{formatFileSize(attachment?.file_size)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Upload Date</Text>
            <Text style={styles.infoValue}>{formatDate(attachment?.created_at)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  
  const renderMobilePreview = () => (
    <View className="flex-1 bg-gradient-to-b from-gray-50 to-blue-50">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 shadow-lg border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-indigo-100 items-center justify-center mr-3">
                <Ionicons name={getFileIcon()} size={24} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
                  {attachment?.file_name}
                </Text>
                <Text className="text-sm text-gray-500">
                  {getFileTypeDescription()} • {formatFileSize(attachment?.file_size)}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center"
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#6366f1" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-lg text-gray-600 mt-4 text-center">
                {previewType === 'office' ? 
                  'Downloading and opening file...' : 
                  'Opening preview...'}
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
                <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                Preview Error
              </Text>
              <Text className="text-base text-gray-600 text-center mb-8 leading-6">
                {error}
              </Text>
              <View className="flex-row gap-3 w-full max-w-sm">
                <TouchableOpacity 
                  className="flex-1 flex-row items-center justify-center py-4 bg-indigo-500 rounded-xl shadow-lg"
                  onPress={handlePreview}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text className="text-base font-semibold text-white ml-2">Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 flex-row items-center justify-center py-4 bg-white rounded-xl border-2 border-indigo-500 shadow-lg"
                  onPress={handleDownload}
                >
                  <Ionicons name="download" size={20} color="#6366f1" />
                  <Text className="text-base font-semibold text-indigo-600 ml-2">Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="p-6">
              <View className="items-center mb-8">
                <View className="w-24 h-24 rounded-3xl bg-indigo-100 items-center justify-center mb-6 shadow-lg">
                  <Ionicons name={getPreviewIcon()} size={48} color="#6366f1" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                  {previewType === 'download' ? 'Download Required' : 'Ready to View'}
                </Text>
                <Text className="text-base text-gray-500 text-center">
                  Choose how you want to access this file
                </Text>
              </View>
              
              <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-gray-100">
                <View className="flex-row items-center mb-3">
                  <Ionicons name={getPreviewIcon()} size={24} color="#6366f1" />
                  <Text className="text-lg font-semibold text-gray-800 ml-3">
                    {previewType === 'direct' ? 'Direct Preview' :
                     previewType === 'office' ? 'Open with App' :
                     'Download Required'}
                  </Text>
                </View>
                <Text className="text-base text-gray-600 leading-6 mb-3">
                  {getPreviewDescription()}
                </Text>
              </View>

              <View className="gap-4 mb-6">
                {previewType !== 'download' && (
                  <TouchableOpacity
                    className="flex-row items-center justify-center py-5 bg-indigo-500 rounded-2xl shadow-lg active:bg-indigo-600"
                    onPress={handlePreview}
                    disabled={loading}
                  >
                    <Ionicons name="open-outline" size={22} color="#fff" />
                    <Text className="text-lg font-semibold text-white ml-3">
                      {previewType === 'office' ? 
                        'Open with App' : 
                        'Open Preview'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  className="flex-row items-center justify-center py-5 rounded-2xl shadow-lg"
                  style={{
                    backgroundColor: previewType === 'download' ? '#6366f1' : '#10b981',
                    opacity: downloading ? 0.7 : 1,
                  }}
                  onPress={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download" size={22} color="#fff" />
                      <Text className="text-lg font-semibold text-white ml-3">
                        Download File
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer */}
      <View className="bg-white border-t border-gray-200 p-6">
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">File Information</Text>
          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">File Type</Text>
              <Text className="text-sm font-medium text-gray-800">
                {attachment?.mime_type || 'Unknown'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-500">File Size</Text>
              <Text className="text-sm font-medium text-gray-800">
                {formatFileSize(attachment?.file_size)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-500">Upload Date</Text>
              <Text className="text-sm font-medium text-gray-800">
                {formatDate(attachment?.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {Platform.OS === 'web' ? renderWebPreview() : renderMobilePreview()}
    </Modal>
  );
};


const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  previewContent: {
    padding: 24,
  },
  previewIconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewIconBackground: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  previewInfo: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewDescriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#10b981',
    borderRadius: 12,
  },
  downloadButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 24,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  fileInfoGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
};

export default FilePreviewModal;