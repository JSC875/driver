import { checkServiceAvailability, ServiceAvailabilityStatus } from '../constants/ServiceArea';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface ServiceAvailabilityResponse {
  success: boolean;
  data: ServiceAvailabilityStatus;
  error?: string;
}

class ServiceAvailabilityService {
  private baseUrl = 'https://bike-taxi-production.up.railway.app';

  /**
   * Check if service is available at the given location
   */
  async checkServiceAvailability(
    location: LocationData
  ): Promise<ServiceAvailabilityResponse> {
    try {
      console.log('📍 === SERVICE AVAILABILITY CHECK ===');
      console.log('🎯 Location:', location);
      
      // Check local service area first
      const localCheck = checkServiceAvailability(location.latitude, location.longitude);
      
      if (!localCheck.isAvailable) {
        console.log('❌ Service not available in local area');
        return {
          success: true,
          data: localCheck
        };
      }

      // If local check passes, verify with backend
      try {
        const response = await fetch(`${this.baseUrl}/api/service-availability/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Version': '1.0.0',
            'X-Platform': 'ReactNative',
            'X-Environment': 'development',
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp || Date.now()
          }),
        });

        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ Backend service availability check successful:', backendData);
          
          // Combine local and backend checks
          return {
            success: true,
            data: {
              ...localCheck,
              ...backendData,
              isAvailable: localCheck.isAvailable && backendData.isAvailable
            }
          };
        } else {
          console.log('⚠️ Backend check failed, using local check only');
          return {
            success: true,
            data: localCheck
          };
        }
      } catch (backendError) {
        console.log('⚠️ Backend check error, using local check only:', backendError);
        return {
          success: true,
          data: localCheck
        };
      }
    } catch (error) {
      console.error('❌ Service availability check error:', error);
      return {
        success: false,
        data: {
          isAvailable: false,
          message: 'Unable to check service availability',
          distanceFromCenter: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a ride can be requested at the given location
   */
  async canRequestRide(
    pickupLocation: LocationData,
    dropLocation: LocationData
  ): Promise<ServiceAvailabilityResponse> {
    try {
      console.log('🚗 === RIDE REQUEST AVAILABILITY CHECK ===');
      console.log('📍 Pickup:', pickupLocation);
      console.log('🎯 Drop:', dropLocation);

      // Check both pickup and drop locations
      const pickupCheck = await this.checkServiceAvailability(pickupLocation);
      const dropCheck = await this.checkServiceAvailability(dropLocation);

      if (!pickupCheck.success || !dropCheck.success) {
        return {
          success: false,
          data: {
            isAvailable: false,
            message: 'Unable to verify service availability',
            distanceFromCenter: 0
          },
          error: 'Service availability check failed'
        };
      }

      const pickupAvailable = pickupCheck.data.isAvailable;
      const dropAvailable = dropCheck.data.isAvailable;

      if (!pickupAvailable) {
        return {
          success: true,
          data: {
            ...pickupCheck.data,
            message: `Cannot request ride: Pickup location is outside Hyderabad service area`
          }
        };
      }

      if (!dropAvailable) {
        return {
          success: true,
          data: {
            ...dropCheck.data,
            message: `Cannot request ride: Drop location is outside Hyderabad service area`
          }
        };
      }

      // Both locations are available
      return {
        success: true,
        data: {
          isAvailable: true,
          message: `Service available for ride from ${pickupCheck.data.nearestArea} to ${dropCheck.data.nearestArea}`,
          nearestArea: `${pickupCheck.data.nearestArea} to ${dropCheck.data.nearestArea}`,
          distanceFromCenter: Math.max(
            pickupCheck.data.distanceFromCenter || 0,
            dropCheck.data.distanceFromCenter || 0
          )
        }
      };
    } catch (error) {
      console.error('❌ Ride request availability check error:', error);
      return {
        success: false,
        data: {
          isAvailable: false,
          message: 'Unable to verify ride availability',
          distanceFromCenter: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get service area information
   */
  getServiceAreaInfo() {
    return {
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      radiusKm: 50,
      center: { lat: 17.3850, lng: 78.4867 },
      popularAreas: [
        'Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Gachibowli',
        'Madhapur', 'Kondapur', 'Kukatpally', 'Secunderabad',
        'Begumpet', 'Ameerpet', 'Dilsukhnagar', 'LB Nagar',
        'Uppal', 'Medchal', 'Shamshabad', 'Rajendranagar'
      ]
    };
  }
}

export const serviceAvailabilityService = new ServiceAvailabilityService();
export default serviceAvailabilityService;
