import { useAuth } from '@clerk/clerk-expo';

// JWT Decoder utility
export const decodeJWT = (token: string) => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Hook to get user info from JWT
export const useUserFromJWT = () => {
  const { getToken } = useAuth();
  
  const getUserInfo = async () => {
    try {
      const token = await getToken({ template: 'driver_app_token' });
      if (!token) {
        console.log('No JWT token available');
        return null;
      }

      const decoded = decodeJWT(token);
      if (!decoded) {
        console.log('Failed to decode JWT');
        return null;
      }

      // Extract user information from JWT payload
      const userInfo = {
        userId: decoded.sub || decoded.user_id || decoded.userId,
        userType: decoded.user_type || decoded.type || 'driver',
        email: decoded.email,
        name: decoded.name || decoded.full_name,
        // Add any other fields you need
        ...decoded
      };

      console.log('Decoded user info from JWT:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('Error getting user info from JWT:', error);
      return null;
    }
  };

  return { getUserInfo };
};

// Utility to get driver ID for socket connection
export const getDriverId = async (getToken: any) => {
  try {
    const token = await getToken({ template: 'driver_app_token' });
    if (!token) {
      console.log('No JWT token available for driver ID');
      return 'driver_001'; // Fallback
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      console.log('Failed to decode JWT for driver ID');
      return 'driver_001'; // Fallback
    }

    const driverId = decoded.sub || decoded.user_id || decoded.userId || 'driver_001';
    console.log('Driver ID from JWT:', driverId);
    return driverId;
  } catch (error) {
    console.error('Error getting driver ID from JWT:', error);
    return 'driver_001'; // Fallback
  }
};

// Utility to get user type from JWT
export const getUserType = async (getToken: any) => {
  try {
    const token = await getToken({ template: 'driver_app_token' });
    if (!token) {
      console.log('No JWT token available for user type');
      return 'driver'; // Fallback
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      console.log('Failed to decode JWT for user type');
      return 'driver'; // Fallback
    }

    const userType = decoded.user_type || decoded.type || 'driver';
    console.log('User type from JWT:', userType);
    return userType;
  } catch (error) {
    console.error('Error getting user type from JWT:', error);
    return 'driver'; // Fallback
  }
}; 