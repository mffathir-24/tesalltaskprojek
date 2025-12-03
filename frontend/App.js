// App.js (di root project)
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import "./global.css";

// Admin Screens
import AdminProjectDetailScreen from './screens/Admin/AdminProjectDetailScreen';
import AdminProjectsScreen from './screens/Admin/AdminProjectsScreen';
import AdminTaskDetailScreen from './screens/Admin/AdminTaskDetailScreen';
import AdminUsersScreen from './screens/Admin/AdminUsersScreen';
import EditUserScreen from './screens/Admin/EditUserScreen';
import UserDetailScreen from './screens/Admin/UserDetailScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Manager Screens
import CreateProjectScreen from './screens/Manager/CreateProjectScreen';
import CreateTaskScreen from './screens/Manager/CreateTaskScreen';
import EditProjectScreen from './screens/Manager/EditProjectScreen';
import EditTaskScreen from './screens/Manager/EditTaskScreen';
import ManageMembersScreen from './screens/Manager/ManageMembersScreen';
import ManagerDashboardScreen from './screens/Manager/ManagerDashboardScreen';
import ManagerProjectDetailScreen from './screens/Manager/ManagerProjectDetailScreen';
import ManagerProjectsScreen from './screens/Manager/ManagerProjectsScreen';
import ManagerTaskDetailScreen from './screens/Manager/ManagerTaskDetailScreen';

// Staff Screens
import AdminDashboardScreen from './screens/Admin/AdminDashboardScreen';
import StaffTaskDetailScreen from './screens/Staff/StaffTaskDetailScreen';
import StaffTasksScreen from './screens/Staff/StaffTasksScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LogoutPlaceholder() {
  return null;
}

const showLogoutConfirmation = (onConfirm) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      onConfirm();
    }
  } else {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onConfirm,
        },
      ]
    );
  }
};

const getTabBarStyles = () => {
  const baseStyles = {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: Platform.OS === 'web' ? 50 : 60,
    paddingBottom: 8,
  };

  if (Platform.OS === 'web') {
    return {
      ...baseStyles,
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    };
  }

  return baseStyles;
};

const getScreenOptions = (activeColor) => ({
  tabBarActiveTintColor: activeColor,
  tabBarInactiveTintColor: 'gray',
  tabBarStyle: getTabBarStyles(),
  tabBarLabelStyle: {
    fontSize: Platform.OS === 'web' ? 11 : 12,
    fontWeight: '600',
  },
  headerShown: false,
});

function StaffTabs() {
  const { logout } = useAuth();

  const performLogout = async () => {
    try {
      await logout();
      console.log('User logged out successfully');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    } catch (error) {
      console.log('Logout process completed');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    }
  };

  const handleWebRedirect = () => {
    if (Platform.OS === 'web') {
      
      console.log('Redirect to login page on web');
    }
  };

  const handleLogout = () => {
    showLogoutConfirmation(performLogout);
  };

  return (
    <Tab.Navigator screenOptions={getScreenOptions('#43e97b')}>
      <Tab.Screen 
        name="MyTasks" 
        component={StaffTasksScreen}
        options={{ 
          title: 'My Tasks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Logout" 
        component={LogoutPlaceholder}
        options={{
          title: 'Logout',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  const { logout } = useAuth();

  const performLogout = async () => {
    try {
      await logout();
      console.log('User logged out successfully');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    } catch (error) {
      console.log('Logout process completed');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    }
  };

  const handleWebRedirect = () => {
    if (Platform.OS === 'web') {
      console.log('Redirect to login page on web');
    }
  };

  const handleLogout = () => {
    showLogoutConfirmation(performLogout);
  };

  return (
    <Tab.Navigator screenOptions={getScreenOptions('#4facfe')}>
      <Tab.Screen 
        name="Dashboard" 
        component={ManagerDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="MyProjects" 
        component={ManagerProjectsScreen}
        options={{ 
          title: 'My Projects',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Logout" 
        component={LogoutPlaceholder}
        options={{
          title: 'Logout',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  const { logout } = useAuth();
  
  const performLogout = async () => {
    try {
      await logout();
      console.log('User logged out successfully');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    } catch (error) {
      console.log('Logout process completed');
      
      if (Platform.OS === 'web') {
        handleWebRedirect();
      }
    }
  };

  const handleWebRedirect = () => {
    if (Platform.OS === 'web') {
      console.log('Redirect to login page on web');
    }
  };

  const handleLogout = () => {
    showLogoutConfirmation(performLogout);
  };

  return (
    <Tab.Navigator screenOptions={getScreenOptions('#667eea')}>
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={AdminUsersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Projects" 
        component={AdminProjectsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Logout" 
        component={LogoutPlaceholder}
        options={{
          title: 'Logout',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isAuthenticated, loading } = useAuth();

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Running on web platform');
      
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
        document.head.appendChild(meta);
      }
    }
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
         <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              animation: Platform.OS === 'web' ? 'none' : 'default',
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              animation: Platform.OS === 'web' ? 'none' : 'default',
            }}
          />
        </>
      ) : (
        <>
          {user?.role === 'admin' && (
            <>
              <Stack.Screen name="AdminDashboard" component={AdminTabs} />
              <Stack.Screen 
                name="AdminDashboardS" 
                component={AdminDashboardScreen}
              />
              <Stack.Screen 
                name="AdminProjectDetail" 
                component={AdminProjectDetailScreen}
              />
              <Stack.Screen 
                name="AdminTaskDetail" 
                component={AdminTaskDetailScreen}
              />
              <Stack.Screen 
                name="UserDetail" 
                component={UserDetailScreen}
              />
              <Stack.Screen 
                name="EditUser" 
                component={EditUserScreen}
              />
            </>
          )}
          
          {user?.role === 'manager' && (
            <>
              <Stack.Screen name="ManagerDashboard" component={ManagerTabs} />
              <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
              <Stack.Screen name="EditProject" component={EditProjectScreen} />
              <Stack.Screen name="ManageMembers" component={ManageMembersScreen} />
              <Stack.Screen name="ManagerProjectDetail" component={ManagerProjectDetailScreen} />
              <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
              <Stack.Screen name="EditTask" component={EditTaskScreen} />
              <Stack.Screen name="ManagerTaskDetail" component={ManagerTaskDetailScreen} />
            </>
          )}
          
          {user?.role === 'staff' && (
            <>
              <Stack.Screen name="StaffDashboard" component={StaffTabs} />
              <Stack.Screen 
                name="StaffTaskDetail" 
                component={StaffTaskDetailScreen}
              />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          overflow-x: hidden;
        }
        
        /* Prevent text selection on tab bar */
        .react-native-tab-bar * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Smooth scrolling for web */
        html {
          scroll-behavior: smooth;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer
        {...(Platform.OS === 'web' ? {
          documentTitle: {
            enabled: false, 
          },
        } : {})}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}