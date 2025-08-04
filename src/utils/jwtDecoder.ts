import { useAuth } from '@clerk/clerk-expo';

// JWT Decoder utility for driver app
export const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const payload = parts[1];
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

// Utility to get user ID for socket connection
export const getUserIdFromJWT = async (getToken: any) => {
  try {
    const token = await getToken({ template: 'driver_app_token' });
    if (!token) return 'driver123';
    const decoded = decodeJWT(token);
    if (!decoded) return 'driver123';
    return decoded.sub || decoded.user_id || decoded.userId || 'driver123';
  } catch (error) {
    console.error('Error getting user ID from JWT:', error);
    return 'driver123';
  }
};

// Utility to get user type from JWT
export const getUserTypeFromJWT = async (getToken: any) => {
  try {
    const token = await getToken({ template: 'driver_app_token' });
    if (!token) return 'driver';
    const decoded = decodeJWT(token);
    if (!decoded) return 'driver';
    return decoded.user_type || decoded.type || 'driver';
  } catch (error) {
    console.error('Error getting user type from JWT:', error);
    return 'driver';
  }
};

// Comprehensive JWT logging utility
export const logJWTDetails = async (getToken: any, context: string = 'JWT Analysis') => {
  try {
    console.log(`🔍 === ${context} ===`);
    
    // Get the JWT token
    const token = await getToken({ template: 'driver_app_token', skipCache: true });
    if (!token) {
      console.log('❌ No JWT token available');
      return null;
    }
    
    console.log(`🔑 Token Length: ${token.length} characters`);
    console.log(`🔑 Token Preview: ${token.substring(0, 50)}...${token.substring(token.length - 20)}`);
    
    // Decode the JWT
    const decoded = decodeJWT(token);
    if (!decoded) {
      console.log('❌ Failed to decode JWT');
      return null;
    }
    
    console.log('📋 Decoded JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check for custom fields
    const customFields = {
      firstName: decoded.firstName || 'Not found',
      lastName: decoded.lastName || 'Not found',
      userType: decoded.userType || 'Not found',
      phoneNumber: decoded.phoneNumber || 'Not found'
    };
    
    console.log('🎯 Custom Fields Check:');
    Object.entries(customFields).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log(`✅ === ${context} COMPLETED ===`);
    return decoded;
    
  } catch (error) {
    console.error(`❌ === ${context} ERROR ===`);
    console.error('Error in JWT logging:', error);
    return null;
  }
};

// Full JWT token logging utility
export const logFullJWT = async (getToken: any, context: string = 'Full JWT Token') => {
  try {
    console.log(`🔍 === ${context} ===`);
    
    const token = await getToken({ template: 'driver_app_token', skipCache: true });
    if (!token) {
      console.log('❌ No JWT token available');
      return null;
    }
    
    console.log('🔑 Full JWT Token:');
    console.log(token);
    
    const decoded = decodeJWT(token);
    if (decoded) {
      console.log('📋 Full Decoded Payload:');
      console.log(JSON.stringify(decoded, null, 2));
    }
    
    console.log(`✅ === ${context} COMPLETED ===`);
    return token;
    
  } catch (error) {
    console.error(`❌ === ${context} ERROR ===`);
    console.error('Error in full JWT logging:', error);
    return null;
  }
}; 