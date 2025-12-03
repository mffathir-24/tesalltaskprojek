import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

export const Card = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
        className={`rounded-3xl p-6 border border-white/30 shadow-xl ${className}`}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      className={`
        rounded-3xl p-6 bg-white
        ${variant === 'outline' ? 'border border-gray-200' : 'shadow-xl'}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
};