
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePlatform } from '../hooks/usePlatform';

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  icon,
  error,
  disabled = false,
  containerClassName = '',
  inputClassName = '',
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { isWeb } = usePlatform();

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-gray-700 font-medium mb-2 ml-1 text-base">
          {label}
        </Text>
      )}
      <View
        className={`
          flex-row items-center rounded-2xl px-4 py-3 border-2
          ${error ? 'border-red-500 bg-red-50' : 
            isFocused ? 'border-blue-500 bg-white' : 
            'border-gray-200 bg-gray-50'}
          ${disabled ? 'opacity-50' : ''}
          ${isWeb ? 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200' : ''}
        `}
      >
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={error ? '#ef4444' : isFocused ? '#3b82f6' : '#6b7280'} 
            className="mr-3" 
          />
        )}
        
        <TextInput
          className={`
            flex-1 text-base text-gray-800 
            ${isWeb ? 'focus:outline-none' : ''}
            ${inputClassName}
          `}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          
          {...(isWeb && {
            autoComplete: secureTextEntry ? 'current-password' : 'username',
            spellCheck: false,
            autoCorrect: 'off',
            autoCapitalize: 'none',
          })}
          {...props}
        />
        
        {(secureTextEntry || rightIcon) && (
          <TouchableOpacity
            onPress={secureTextEntry ? () => setShowPassword(!showPassword) : onRightIconPress}
            className="p-1"
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={secureTextEntry ? (showPassword ? 'eye-off-outline' : 'eye-outline') : rightIcon}
              size={20}
              color={error ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
};