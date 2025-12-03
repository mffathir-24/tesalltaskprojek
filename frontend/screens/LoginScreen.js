
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Logo from '../assets/logo/logo1.png';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonScale] = useState(new Animated.Value(1));
  const inputScale1 = useRef(new Animated.Value(1)).current;
  const inputScale2 = useRef(new Animated.Value(1)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  const { login } = useAuth();

  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1)
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true
        })
      ]).start();
    });

    
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ])
    ).start();

    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('⚠️ Missing Information', 'Please fill in all fields to continue');
      return;
    }

    setLoading(true);
    
    
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.92,
        tension: 100,
        friction: 3,
        useNativeDriver: true
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true
      })
    ]).start();

    
    Animated.timing(logoRotate, {
      toValue: 1,
      duration: 600,
      easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
      useNativeDriver: true
    }).start(() => logoRotate.setValue(0));

    const result = await login(identifier, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('❌ Login Failed', result.message);
    }
  };

  const handleInputFocus = (inputName, scaleValue) => {
    setFocusedInput(inputName);
    Animated.spring(scaleValue, {
      toValue: 1.02,
      tension: 100,
      friction: 3,
      useNativeDriver: true
    }).start();
  };

  const handleInputBlur = (scaleValue) => {
    setFocusedInput(null);
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true
    }).start();
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const renderCredentialCard = (role, username, password, icon, gradient) => (
    <TouchableOpacity
      style={styles.credentialCard}
      onPress={() => {
        setIdentifier(username);
        setPassword(password);
        
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.credentialGradient}
      >
        <View style={styles.credentialIconContainer}>
          <Ionicons name={icon} size={22} color="#ffffff" />
        </View>
        <View style={styles.credentialTextContainer}>
          <Text style={styles.credentialRole}>{role}</Text>
          <Text style={styles.credentialDetails}>{username}</Text>
        </View>
        <View style={styles.credentialCopyIcon}>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Animated Background Gradient */}
          <Animated.View style={styles.backgroundContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backgroundGradient}
            >
              {/* Floating circles decoration */}
              <View style={[styles.floatingCircle, styles.circle1]} />
              <View style={[styles.floatingCircle, styles.circle2]} />
              <View style={[styles.floatingCircle, styles.circle3]} />
            </LinearGradient>
          </Animated.View>

          {/* Header Section with Logo */}
          <Animated.View 
            style={[styles.headerSection, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <Animated.View 
              style={[styles.logoContainer, {
                transform: [{ rotate: spin }]
              }]}
            >
              <View style={styles.logoGlow}>
                <Image 
                  source={Logo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
            
            <Text style={styles.welcomeText}>Welcome Back! 👋</Text>
            <Text style={styles.welcomeSubtext}>Sign in to continue your journey</Text>
          </Animated.View>

          {/* Main Form Card */}
          <Animated.View 
            style={[styles.formCard, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            {/* Email/Username Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale1 }]
              }]}
            >
              <Text style={styles.inputLabel}>
                <Ionicons name="mail" size={14} color="#667eea" /> Email or Username
              </Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'identifier' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-circle" size={24} color="#667eea" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or username"
                  placeholderTextColor="#94a3b8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => handleInputFocus('identifier', inputScale1)}
                  onBlur={() => handleInputBlur(inputScale1)}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale2 }]
              }]}
            >
              <Text style={styles.inputLabel}>
                <Ionicons name="lock-closed" size={14} color="#667eea" /> Password
              </Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color="#667eea" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => handleInputFocus('password', inputScale2)}
                  onBlur={() => handleInputBlur(inputScale2)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#667eea"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Remember & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.rememberMeContainer} activeOpacity={0.7}>
                <View style={styles.checkbox}>
                  <Ionicons name="checkmark" size={14} color="#667eea" />
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => Alert.alert('🔐 Password Reset', 'Contact administrator at:\nadmin@taskflowpro.com')}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button with Gradient */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.loginButtonWrapper}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward-circle" size={24} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Demo Accounts Section */}
          <Animated.View 
            style={[styles.demoAccountsCard, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <View style={styles.demoHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.demoIconGradient}
              >
                <Ionicons name="rocket" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.demoTitle}>Quick Demo Access</Text>
            </View>
            
            <Text style={styles.demoDescription}>
              Tap any account below to auto-fill and try the app instantly
            </Text>
            
            {renderCredentialCard('Administrator', 'admin_user', 'AdminPass123!', 'shield-checkmark', ['#667eea', '#764ba2'])}
            {renderCredentialCard('Project Manager', 'manager_user', 'ManagerPass123!', 'briefcase', ['#f093fb', '#f5576c'])}
            {renderCredentialCard('Team Member', 'staff', 'StaffPass123!', 'people', ['#4facfe', '#00f2fe'])}
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[styles.footer, {
              opacity: fadeAnim
            }]}
          >
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
              <Text style={styles.securityText}>256-bit SSL Encryption</Text>
            </View>
            <Text style={styles.copyrightText}>TaskFlow Pro v1.0.0</Text>
            <Text style={styles.authorText}>by Muhammad Fathiir Farhansyah</Text>
            <Text style={styles.rightsText}>© 2025 All Rights Reserved</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
  },
  backgroundGradient: {
    flex: 1,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 20,
    right: 40,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  formCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 28,
    marginTop: -20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 15,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#667eea',
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 14,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  loginButtonWrapper: {
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 13,
    color: '#64748b',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667eea',
  },
  demoAccountsCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  demoDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  credentialCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  credentialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  credentialIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  credentialTextContainer: {
    flex: 1,
  },
  credentialRole: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  credentialDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  credentialCopyIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  securityText: {
    fontSize: 13,
    color: '#059669',
    marginLeft: 6,
    fontWeight: '600',
  },
  copyrightText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  rightsText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
});