import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'right',
  className = '',
  ...props
}) => {
  const getVariantStyle = () => {
    const base = 'rounded-2xl py-4 px-6 flex-row items-center justify-center';
    
    switch (variant) {
      case 'primary':
        return `${base} bg-blue-500`;
      case 'secondary':
        return `${base} bg-white border-2 border-blue-500`;
      case 'ghost':
        return `${base} bg-transparent`;
      case 'danger':
        return `${base} bg-red-500`;
      default:
        return `${base} bg-blue-500`;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return 'text-white font-bold text-lg';
      case 'secondary':
        return 'text-blue-500 font-semibold text-lg';
      case 'ghost':
        return 'text-blue-500 font-semibold text-lg';
      case 'danger':
        return 'text-white font-bold text-lg';
      default:
        return 'text-white font-bold text-lg';
    }
  };

  return (
    <TouchableOpacity
      className={`${getVariantStyle()} ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#3b82f6' : '#ffffff'} />
      ) : (
        <View className="flex-row items-center">
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={20} color={variant === 'secondary' ? '#3b82f6' : '#ffffff'} className="mr-2" />
          )}
          <Text className={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={20} color={variant === 'secondary' ? '#3b82f6' : '#ffffff'} className="ml-2" />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};