
import { Dimensions, Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

export const getResponsiveValue = (mobileValue, webValue) => {
  return isWeb ? webValue : mobileValue;
};

export const getColumnCount = () => {
  if (isWeb) {
    if (screenWidth >= 1200) return 4;
    if (screenWidth >= 768) return 3;
    return 2;
  }
  return 1;
};