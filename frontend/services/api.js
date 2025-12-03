
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});


api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      
      console.log('🔵 API Request:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        hasData: !!config.data
      });
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/logout')) {
      console.log('Logout with expired token - this is expected');
      return Promise.resolve({ 
        data: { message: 'Logged out (token expired)' },
        status: 200,
        statusText: 'OK'
      });
    }
    
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      } catch (storageError) {
        console.error('Error clearing auth data:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);


export const authService = {
  login: async (identifier, password) => {
    const response = await api.post('/auth/login', {
      cek: identifier,
      password: password,
    });
    return response.data;
  },
  
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout', {}, { timeout: 5000 });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Logout with expired token - considered successful');
        return { message: 'Logged out successfully' };
      }
      console.log('Logout API call failed, but proceeding with local logout:', error.message);
      return { message: 'Logged out locally' };
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};


export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
};


export const projectService = {
  getAllProjects: async () => {
    const response = await api.get('/project');
    return response.data;
  },
  
  getProjectById: async (projectId) => {
    const response = await api.get(`/project/${projectId}`);
    return response.data;
  },
  
  createProject: async (projectData) => {
    const response = await api.post('/project', projectData);
    return response.data;
  },
  
  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/project/${projectId}`, projectData);
    return response.data;
  },
  
  deleteProject: async (projectId) => {
    const response = await api.delete(`/project/${projectId}`);
    return response.data;
  },
  
  getProjectMembers: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },
  
  addMember: async (projectId, userId) => {
    const response = await api.post(`/projects/${projectId}/members`, {
      user_id: userId,
    });
    return response.data;
  },
  
  removeMember: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },
};


export const taskService = {
  getProjectTasks: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },
  
  getTaskById: async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },
  
  createTask: async (projectId, taskData) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },
  
  updateTask: async (projectId, taskId, taskData) => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  deleteTask: async (projectId, taskId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },
  
  getMyTasks: async () => {
    const response = await api.get('/my-tasks');
    return response.data;
  },
};


export const commentService = {
  getTaskComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },
  
  createComment: async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },
  
  updateComment: async (taskId, commentId, content) => {
    const response = await api.put(`/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data;
  },
  
  deleteComment: async (taskId, commentId) => {
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },
};


export const attachmentService = {
  getTaskAttachments: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/attachments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  },
  
  
  uploadAttachment: async (taskId, formData) => {
    try {
      console.log('📤 Uploading attachment to task:', taskId);
      
      const response = await api.post(
        `/tasks/${taskId}/attachments`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 60000, 
          transformRequest: (data) => data, 
        }
      );
      
      console.log('✅ Upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Upload error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  },
  
  
  deleteAttachment: async (taskId, attachmentId) => {
    try {
      console.log('🗑️ Deleting attachment:', {
        taskId,
        attachmentId
      });
      
      
      const response = await api.delete(`/attachments/${attachmentId}`);
      
      console.log('✅ Delete successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Delete error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },
  
  downloadAttachment: async (attachmentId) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  },
};

export default api;