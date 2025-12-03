import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  iconPosition = 'left',
  error,
  secure = false,
  multiline = false,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View>
      {label && (
        <Text className="mb-2 text-base text-gray-700">{label}</Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={24} color="#9ca3af" style={{ marginRight: 8 }} />
        )}
        <TextInput
          className={`flex-1 text-base text-gray-800 ${multiline ? 'min-h-[80px]' : ''}`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secure && !showPassword}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#9ca3af"
            />
          </TouchableOpacity>
        )}
        {icon && iconPosition === 'right' && !secure && (
          <Ionicons name={icon} size={24} color="#9ca3af" style={{ marginLeft: 8 }} />
        )}
      </View>
      {error && (
        <Text className="mt-2 text-sm text-red-500">{error}</Text>
      )}
    </View>
  );
};

export default Input;