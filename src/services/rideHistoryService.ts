import { useAuth } from '@clerk/clerk-expo';

export interface RideHistoryItem {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  driver: string;
  fare: number;
  distance: number;
  duration: number;
  status: 'accepted' | 'completed' | 'cancelled';
  rating?: number;
  cancellationReason?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  requestedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface RideHistoryResponse {
  success: boolean;
  data: RideHistoryItem[];
  message?: string;
  error?: string;
}

class RideHistoryService {
  private baseUrl = 'https://bike-taxi-production.up.railway.app';



  async fetchRideHistory(token?: string): Promise<RideHistoryResponse> {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      console.log('🚀 Fetching ride history from API...');
      console.log('📍 Endpoint:', `${this.baseUrl}/api/drivers/me/rides`);
      console.log('🕐 API call timestamp:', new Date().toISOString());

      const response = await fetch(`${this.baseUrl}/api/drivers/me/rides`, {
        method: 'GET',
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
      console.log('✅ Ride history fetched successfully:', data);
      console.log('📊 Response data type:', typeof data);
      console.log('📊 Response data length:', Array.isArray(data) ? data.length : 'Not an array');

      // Transform the API response to match our RideHistoryItem interface
      const transformedData = this.transformApiResponse(data);
      
      // Sort by requestedAt date (latest first)
      const sortedData = transformedData.sort((a, b) => {
        const dateA = new Date(a.requestedAt || a.date).getTime();
        const dateB = new Date(b.requestedAt || b.date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('🔄 Transformed and sorted ride history data:', sortedData);
      console.log('📊 Transformed data length:', sortedData.length);

      return {
        success: true,
        data: sortedData,
      };
    } catch (error) {
      console.error('❌ Error fetching ride history:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private transformApiResponse(apiData: any): RideHistoryItem[] {
    // Handle different possible response structures
    const rides = Array.isArray(apiData) ? apiData : (apiData.data || apiData.rides || []);
    
    return rides.map((ride: any) => {
      // Generate location strings from coordinates if addresses are not available
      const pickupLocation = this.generateLocationString(ride.pickupLat, ride.pickupLng, ride.pickupAddress);
      const dropoffLocation = this.generateLocationString(ride.dropLat, ride.dropLng, ride.dropoffAddress);
      
      return {
        id: ride.id || ride._id || `ride_${Date.now()}_${Math.random()}`,
        date: this.formatDate(ride.requestedAt || ride.createdAt || ride.date),
        time: this.formatTime(ride.requestedAt || ride.createdAt || ride.time),
        from: pickupLocation,
        to: dropoffLocation,
        driver: ride.driver?.firstName ? `${ride.driver.firstName} ${ride.driver.lastName || ''}`.trim() : 'Driver',
        fare: ride.estimatedFare || ride.fare || ride.price || 0,
        distance: this.calculateDistance(ride.pickupLat, ride.pickupLng, ride.dropLat, ride.dropLng),
        duration: ride.duration || ride.durationInMinutes || 0,
        status: this.mapStatus(ride.status),
        rating: ride.rating || ride.driverRating,
        cancellationReason: ride.cancellationReason || ride.cancelReason,
        pickupAddress: pickupLocation,
        dropoffAddress: dropoffLocation,
        requestedAt: ride.requestedAt || ride.createdAt,
        completedAt: ride.completedAt,
        cancelledAt: ride.cancelledAt,
      };
    });
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  }

  private formatTime(dateString: string): string {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'Unknown time';
    }
  }

  private generateLocationString(lat: number, lng: number, address?: string): string {
    if (address && address !== 'Unknown location') {
      return address;
    }
    
    if (lat && lng) {
      // Generate a simple location string from coordinates
      return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    
    return 'Unknown location';
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return 0;
    }
    
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private mapStatus(apiStatus: string): 'accepted' | 'completed' | 'cancelled' {
    const statusMap: { [key: string]: 'accepted' | 'completed' | 'cancelled' } = {
      'accepted': 'accepted',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'finished': 'completed',
      'done': 'completed',
      'active': 'accepted',
      'in_progress': 'accepted',
      'ongoing': 'accepted',
    };

    return statusMap[apiStatus?.toLowerCase()] || 'completed';
  }
}

export const rideHistoryService = new RideHistoryService(); 