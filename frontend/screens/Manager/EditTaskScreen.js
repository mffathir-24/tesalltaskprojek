import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { projectService, taskService } from '../../services/api';

export const EditTaskScreen = ({ route, navigation }) => {
  const { projectId, taskId, taskData } = route.params;
  const [title, setTitle] = useState(taskData?.title || '');
  const [description, setDescription] = useState(taskData?.description || '');
  const [status, setStatus] = useState(taskData?.status || 'todo');
  const [assigneeId, setAssigneeId] = useState(taskData?.assignee_id || null);
  const [assigneeName, setAssigneeName] = useState(taskData?.assignee?.username || '');
  const [dueDate, setDueDate] = useState(taskData?.due_date ? new Date(taskData.due_date) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await projectService.getProjectMembers(projectId);
      setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter task title');
      return;
    }

    try {
      setLoading(true);
      await taskService.updateTask(projectId, taskId, {
        title,
        description,
        status,
        assignee_id: assigneeId,
        due_date: dueDate,
      });
      
      Alert.alert('Success', 'Task updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleWebDateChange = (e) => {
    if (e.target.value) {
      const date = new Date(e.target.value);
      setDueDate(date);
    }
  };

  const clearDueDate = () => {
    setDueDate(null);
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#6c757d', icon: 'list' },
    { value: 'in-progress', label: 'In Progress', color: '#ffc107', icon: 'sync' },
    { value: 'done', label: 'Done', color: '#28a745', icon: 'checkmark-circle' },
  ];

  const currentStatus = statusOptions.find(s => s.value === status);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Task</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={20} color="#4facfe" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter task title"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons name="document-text-outline" size={20} color="#4facfe" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter task description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Ionicons name={currentStatus.icon} size={20} color={currentStatus.color} />
              <Text style={styles.selectButtonText}>{currentStatus.label}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign To</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMemberModal(true)}
            >
              <Ionicons name="person-outline" size={20} color="#4facfe" />
              <Text style={styles.selectButtonText}>
                {assigneeName || 'Select member'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            
            {Platform.OS === 'web' ? (
              // Input date native untuk web
              <View style={styles.webDateContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#4facfe" style={styles.inputIcon} />
                  <input
                    type="date"
                    value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                    onChange={handleWebDateChange}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: '#333',
                      padding: '16px 0',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      fontFamily: 'inherit',
                    }}
                  />
                  {dueDate && (
                    <TouchableOpacity onPress={clearDueDate} style={{ marginLeft: 12 }}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
                {dueDate && (
                  <Text style={styles.datePreview}>
                    Selected: {formatDate(dueDate)}
                  </Text>
                )}
              </View>
            ) : (
              // DateTimePicker untuk mobile
              <>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#4facfe" />
                  <Text style={styles.selectButtonText}>
                    {dueDate ? formatDate(dueDate) : 'Select date'}
                  </Text>
                  {dueDate && (
                    <TouchableOpacity onPress={clearDueDate}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createButton} onPress={handleUpdate} disabled={loading}>
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : ['#4facfe', '#00f2fe']}
            style={styles.createButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Update Task</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  setStatus(option.value);
                  setShowStatusModal(false);
                }}
              >
                <Ionicons name={option.icon} size={24} color={option.color} />
                <Text style={styles.optionText}>{option.label}</Text>
                {status === option.value && (
                  <Ionicons name="checkmark" size={24} color={option.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign To</Text>
              <TouchableOpacity onPress={() => setShowMemberModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => {
                    setAssigneeId(item.id);
                    setAssigneeName(item.username);
                    setShowMemberModal(false);
                  }}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.username}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                  {assigneeId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4facfe" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1 },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    minHeight: 56,
  },
  webDateContainer: {
    position: 'relative',
  },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  inputIcon: { marginRight: 12 },
  textAreaIcon: { marginTop: 4 },
  input: { flex: 1, fontSize: 16, color: '#333', paddingVertical: 16 },
  textArea: { minHeight: 100, paddingTop: 0 },
  selectButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    minHeight: 56,
  },
  selectButtonText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12 },
  datePreview: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 12,
    fontStyle: 'italic',
  },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cancelButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  createButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  createButtonDisabled: { opacity: 0.6 },
  createButtonGradient: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  createButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 16 },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4facfe', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#333' },
  memberEmail: { fontSize: 13, color: '#666', marginTop: 2 },
});

export default EditTaskScreen;