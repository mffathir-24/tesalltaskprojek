// screens/RegisterScreen.js
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
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
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonScale] = useState(new Animated.Value(1));
  const inputScale1 = useRef(new Animated.Value(1)).current;
  const inputScale2 = useRef(new Animated.Value(1)).current;
  const inputScale3 = useRef(new Animated.Value(1)).current;
  const inputScale4 = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const { register } = useAuth();

  React.useEffect(() => {
    // Entry animations
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
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength();

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: passwordStrength,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [passwordStrength]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return '#ef4444';
    if (passwordStrength <= 50) return '#f59e0b';
    if (passwordStrength <= 75) return '#3b82f6';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const handleRegister = async () => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('⚠️ Missing Information', 'Please fill in all fields to continue');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('❌ Password Mismatch', 'Passwords do not match. Please check again.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('⚠️ Weak Password', 'Password must be at least 6 characters long for security.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('❌ Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    
    // Button press animation
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

    const result = await register(username, email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '🎉 Registration Successful!',
        'Your account has been created. Please login to continue.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
              }).start(() => {
                navigation.navigate('Login');
              });
            }
          }
        ]
      );
    } else {
      Alert.alert('❌ Registration Failed', result.message);
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

  const navigateToLogin = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      navigation.navigate('Login');
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
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
          <View style={styles.backgroundContainer}>
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
          </View>

          {/* Back Button */}
          <Animated.View 
            style={[styles.backButtonContainer, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <TouchableOpacity
              onPress={navigateToLogin}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header Section */}
          <Animated.View 
            style={[styles.headerSection, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.iconGradient}
              >
                <Ionicons name="person-add" size={50} color="#ffffff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.headerTitle}>Create Account 🚀</Text>
            <Text style={styles.headerSubtitle}>Join TaskFlow Pro and boost your productivity</Text>
          </Animated.View>

          {/* Main Form Card */}
          <Animated.View 
            style={[styles.formCard, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Sign Up</Text>
              <Text style={styles.formSubtitle}>Fill in your details to get started</Text>
            </View>

            {/* Username Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale1 }]
              }]}
            >
              <Text style={styles.inputLabel}>
                <Ionicons name="person" size={14} color="#667eea" /> Username
              </Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'username' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-circle" size={24} color="#667eea" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => handleInputFocus('username', inputScale1)}
                  onBlur={() => handleInputBlur(inputScale1)}
                  autoCapitalize="none"
                  editable={!loading}
                />
                {username.length > 0 && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </View>
            </Animated.View>

            {/* Email Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale2 }]
              }]}
            >
              <Text style={styles.inputLabel}>
                <Ionicons name="mail" size={14} color="#667eea" /> Email Address
              </Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail" size={24} color="#667eea" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => handleInputFocus('email', inputScale2)}
                  onBlur={() => handleInputBlur(inputScale2)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                {email.includes('@') && (
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                )}
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale3 }]
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
                  placeholder="Create a strong password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => handleInputFocus('password', inputScale3)}
                  onBlur={() => handleInputBlur(inputScale3)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
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
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <Animated.View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: progressWidth,
                          backgroundColor: getPasswordStrengthColor()
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
              
              <Text style={styles.inputHint}>
                <Ionicons name="information-circle" size={12} color="#64748b" />
                {' '}At least 6 characters, include uppercase & numbers
              </Text>
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View 
              style={[styles.inputWrapper, {
                transform: [{ scale: inputScale4 }]
              }]}
            >
              <Text style={styles.inputLabel}>
                <Ionicons name="lock-closed" size={14} color="#667eea" /> Confirm Password
              </Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'confirmPassword' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="shield" size={24} color="#667eea" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => handleInputFocus('confirmPassword', inputScale4)}
                  onBlur={() => handleInputBlur(inputScale4)}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#667eea"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  {password === confirmPassword ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.matchText}>Passwords match</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={styles.mismatchText}>Passwords don't match</Text>
                    </>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Terms & Conditions */}
            <View style={styles.termsContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" />
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Register Button with Gradient */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.registerButtonWrapper}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward-circle" size={24} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Features Section */}
          <Animated.View 
            style={[styles.featuresCard, {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }]}
          >
            <Text style={styles.featuresTitle}>What you'll get:</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Task Management</Text>
                <Text style={styles.featureDescription}>Organize and track all your tasks efficiently</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Team Collaboration</Text>
                <Text style={styles.featureDescription}>Work together with your team seamlessly</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Real-time Updates</Text>
                <Text style={styles.featureDescription}>Stay synced across all your devices</Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[styles.footer, {
              opacity: fadeAnim
            }]}
          >
            <Text style={styles.footerText}>TaskFlow Pro v1.0.0</Text>
            <Text style={styles.footerSubtext}>by Muhammad Fathiir Farhansyah</Text>
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
    height: height * 0.4,
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
    top: 80,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 20,
    right: 40,
  },
  backButtonContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
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
  formHeader: {
    marginBottom: 28,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
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
  passwordStrengthContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordStrengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  passwordStrengthText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 50,
  },
  inputHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 16,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 13,
    color: '#10b981',
    marginLeft: 6,
    fontWeight: '600',
  },
  mismatchText: {
    fontSize: 13,
    color: '#ef4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginLeft: 12,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  registerButtonWrapper: {
    marginBottom: 24,
  },
  registerButton: {
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
  registerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667eea',
  },
  featuresCard: {
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
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
});