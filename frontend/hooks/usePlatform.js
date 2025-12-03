// hooks/usePlatform.js
import { Platform } from 'react-native';

export const usePlatform = () => {
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  
  return {
    isWeb,
    isMobile,
    isIOS,
    isAndroid,
    platform: Platform.OS
  };
};

export const platformStyles = {
  web: (webStyles, mobileStyles = {}) => Platform.OS === 'web' ? webStyles : mobileStyles,
  mobile: (mobileStyles, webStyles = {}) => Platform.OS !== 'web' ? mobileStyles : webStyles,
};