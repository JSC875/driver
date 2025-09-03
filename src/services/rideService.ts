import { useAuth } from '@clerk/clerk-expo';
import { serviceAvailabilityService, LocationData } from './serviceAvailabilityService';

export interface CompleteRideResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

class RideService {
  private baseUrl = 'https://bike-taxi-production.up.railway.app';

  /**
   * Check service availability before allowing ride operations
   */
  async checkServiceAvailability(location: LocationData): Promise<boolean> {
    try {
      const result = await serviceAvailabilityService.checkServiceAvailability(location);
      return result.success && result.data.isAvailable;
    } catch (error) {
      console.error('❌ Service availability check failed:', error);
      return false;
    }
  }

  async verifyOtp(rideId: string, otp: string, token?: string): Promise<VerifyOtpResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      if (!rideId) {
        throw new Error('Ride ID is required');
      }

      if (!otp) {
        throw new Error('OTP is required');
      }

      console.log('🔐 Verifying OTP via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/rides/${rideId}/verify-otp`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Ride ID:', rideId);
      console.log('🔐 OTP:', otp);

      const response = await fetch(`${this.baseUrl}/api/rides/${rideId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
        body: JSON.stringify({ otp }),
      });

      console.log('📡 API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ OTP verified successfully via API:', data);

      return {
        success: true,
        data: data,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('❌ Error verifying OTP via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to verify OTP'
      };
    }
  }

  async completeRide(rideId: string, token?: string): Promise<CompleteRideResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      if (!rideId) {
        throw new Error('Ride ID is required');
      }

      console.log('🚀 Completing ride via API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/rides/${rideId}/complete`);
      console.log('🕐 API call timestamp:', new Date().toISOString());
      console.log('🆔 Ride ID:', rideId);

      const response = await fetch(`${this.baseUrl}/api/rides/${rideId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-App-Version': '1.0.0',
          'X-Platform': 'ReactNative',
          'X-Environment': 'development',
        },
      });

      console.log('📡 API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        console.error('❌ API Status:', response.status);
        console.error('❌ API Status Text:', response.statusText);
        throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Ride completed successfully via API:', data);

      return {
        success: true,
        data: data,
        message: 'Ride completed successfully'
      };
    } catch (error) {
      console.error('❌ Error completing ride via API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to complete ride'
      };
    }
  }
}

export const rideService = new RideService();
export default rideService; 