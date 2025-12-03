import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  variant = 'primary',
  className = '',
}) => {
  const insets = useSafeAreaInsets();

  const variants = {
    primary: 'bg-primary-500',
    white: 'bg-white border-b border-gray-200',
    transparent: 'bg-transparent',
  };

  const textColors = {
    primary: 'text-white',
    white: 'text-gray-900',
    transparent: 'text-gray-900',
  };

  return (
    <View
      style={{
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor:
          variant === 'primary'
            ? '#3b82f6'
            : variant === 'white'
            ? '#ffffff'
            : 'transparent',
        borderBottomWidth: variant === 'white' ? 1 : 0,
        borderBottomColor: variant === 'white' ? '#e5e7eb' : 'transparent',
      }}
      className={className}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {leftIcon && (
          <TouchableOpacity onPress={onLeftPress}>
            <Ionicons
              name={leftIcon}
              size={24}
              color={variant === 'primary' ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color:
              variant === 'primary'
                ? '#ffffff'
                : variant === 'white'
                ? '#111827'
                : '#111827',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color:
                variant === 'primary'
                  ? '#e5e7eb'
                  : variant === 'white'
                  ? '#6b7280'
                  : '#6b7280',
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress}>
            <Ionicons
              name={rightIcon}
              size={24}
              color={variant === 'primary' ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;