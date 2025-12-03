// components/WebOptimizedView.js
import React from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { usePlatform } from '../hooks/usePlatform';

export const WebOptimizedView = ({ children, className = '', ...props }) => {
  const { isWeb } = usePlatform();
  
  if (isWeb) {
    return (
      <View 
        className={`max-w-md w-full mx-auto ${className}`}
        {...props}
      >
        {children}
      </View>
    );
  }
  
  return (
    <View className={`flex-1 ${className}`} {...props}>
      {children}
    </View>
  );
};

export const WebOptimizedScrollView = ({ children, className = '', ...props }) => {
  const { isWeb } = usePlatform();
  
  if (isWeb) {
    return (
      <View 
        className={`flex-1 ${className}`}
        style={{ overflowY: 'auto' }}
        {...props}
      >
        {children}
      </View>
    );
  }
  
  return (
    <ScrollView 
      className={`flex-1 ${className}`}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export const WebOptimizedKeyboardAvoidingView = ({ children, className = '', ...props }) => {
  const { isWeb } = usePlatform();
  
  if (isWeb) {
    return (
      <View className={`flex-1 ${className}`} {...props}>
        {children}
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      className={`flex-1 ${className}`}
      behavior="padding"
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
};