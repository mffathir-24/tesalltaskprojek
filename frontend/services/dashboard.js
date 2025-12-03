import api from './api';

export const dashboardService = {
  getAdminDashboard: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      console.log('📊 Admin Dashboard Response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching admin dashboard:', error);
      throw error;
    }
  },

  getManagerDashboard: async () => {
    try {
      const response = await api.get('/dashboard/manager');
      console.log('📊 Manager Dashboard Response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching manager dashboard:', error);
      throw error;
    }
  },

  getManagerProjects: async (page = 1, limit = 10, search = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(), 
        search 
      }).toString();
      const response = await api.get(`/dashboard/manager/projects?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching manager projects:', error);
      throw error;
    }
  },

  getManagerTasks: async (page = 1, limit = 10, status = '', projectId = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(), 
        status, 
        project_id: projectId 
      }).toString();
      const response = await api.get(`/dashboard/manager/tasks?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching manager tasks:', error);
      throw error;
    }
  },

  getAdminProjects: async (page = 1, limit = 10, search = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(), 
        search 
      }).toString();
      const response = await api.get(`/admin/dashboard/projects?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin projects:', error);
      throw error;
    }
  },

  getAdminTasks: async (page = 1, limit = 10, status = '', projectId = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(), 
        status, 
        project_id: projectId 
      }).toString();
      const response = await api.get(`/admin/dashboard/tasks?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin tasks:', error);
      throw error;
    }
  },

  getAdminUsers: async (page = 1, limit = 10, role = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(), 
        role 
      }).toString();
      const response = await api.get(`/admin/dashboard/users?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  },

  getTaskStatusDistribution: async () => {
    try {
      const response = await api.get('/admin/dashboard/tasks/status-distribution');
      return response;
    } catch (error) {
      console.error('Error fetching task distribution:', error);
      throw error;
    }
  },

  getProjectProgress: async (projectId) => {
    try {
      const response = await api.get(`/admin/dashboard/projects/${projectId}/progress`);
      return response;
    } catch (error) {
      console.error('Error fetching project progress:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/admin/dashboard/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  clearAllNotifications: async () => {
    try {
      const response = await api.delete('/admin/dashboard/notifications/clear');
      return response;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },

  getMyTasks: async () => {
    try {
      const response = await api.get('/admin/dashboard/my-tasks');
      return response;
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      throw error;
    }
  }
};